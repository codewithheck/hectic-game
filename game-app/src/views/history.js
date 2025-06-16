/**
 * International Draughts History Manager
 * Handles move history, state management, and navigation
 * @author codewithheck
 * Created: 2025-06-16 20:07:34 UTC
 */

import { PLAYER, GAME_STATE } from '../engine/constants.js';

export class History {
    constructor(game, board) {
        this.game = game;
        this.board = board;
        this.history = [];
        this.currentIndex = -1;
        this.container = null;
        this.navigationEnabled = true;
        
        this.initialize();
    }

    initialize() {
        this.createHistoryPanel();
        this.attachEventListeners();
    }

    /**
     * Creates the history panel UI
     */
    createHistoryPanel() {
        this.container = document.createElement('div');
        this.container.className = 'history-panel';

        // Navigation controls
        const controls = document.createElement('div');
        controls.className = 'history-controls';

        this.firstButton = this.createButton('⟪', 'Jump to start', () => this.jumpToStart());
        this.prevButton = this.createButton('←', 'Previous move', () => this.previousMove());
        this.nextButton = this.createButton('→', 'Next move', () => this.nextMove());
        this.lastButton = this.createButton('⟫', 'Jump to end', () => this.jumpToEnd());

        controls.appendChild(this.firstButton);
        controls.appendChild(this.prevButton);
        controls.appendChild(this.nextButton);
        controls.appendChild(this.lastButton);

        // Move list
        this.moveList = document.createElement('div');
        this.moveList.className = 'history-moves';

        this.container.appendChild(controls);
        this.container.appendChild(this.moveList);

        this.updateNavigationState();
    }

    /**
     * Creates a navigation button
     * @param {string} text Button text
     * @param {string} title Button tooltip
     * @param {Function} onClick Click handler
     * @returns {HTMLElement} Button element
     */
    createButton(text, title, onClick) {
        const button = document.createElement('button');
        button.className = 'history-button';
        button.textContent = text;
        button.title = title;
        button.addEventListener('click', onClick);
        return button;
    }

    /**
     * Attaches event listeners
     */
    attachEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.navigationEnabled) return;

            switch (e.key) {
                case 'ArrowLeft':
                    if (e.ctrlKey) {
                        this.jumpToStart();
                    } else {
                        this.previousMove();
                    }
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    if (e.ctrlKey) {
                        this.jumpToEnd();
                    } else {
                        this.nextMove();
                    }
                    e.preventDefault();
                    break;
            }
        });
    }

    /**
     * Records a new move
     * @param {Object} move Move data
     * @param {string} notation Move notation
     */
    recordMove(move, notation) {
        // Truncate history if we're not at the end
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        this.history.push({
            move: move,
            notation: notation,
            fen: this.game.getFEN(),
            gameState: this.game.gameState
        });

        this.currentIndex = this.history.length - 1;
        this.updateMoveList();
        this.updateNavigationState();
    }

    /**
     * Updates the move list display
     */
    updateMoveList() {
        this.moveList.innerHTML = '';
        
        for (let i = 0; i < this.history.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const moveRow = document.createElement('div');
            moveRow.className = 'history-move-row';

            // Move number
            const numberCell = document.createElement('span');
            numberCell.className = 'move-number';
            numberCell.textContent = `${moveNumber}.`;
            moveRow.appendChild(numberCell);

            // White's move
            const whiteMove = this.createMoveElement(i, this.history[i]);
            moveRow.appendChild(whiteMove);

            // Black's move (if exists)
            if (i + 1 < this.history.length) {
                const blackMove = this.createMoveElement(i + 1, this.history[i + 1]);
                moveRow.appendChild(blackMove);
            }

            this.moveList.appendChild(moveRow);
        }

        // Scroll to the current move
        const currentMove = this.moveList.children[Math.floor(this.currentIndex / 2)];
        if (currentMove) {
            currentMove.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Creates a move element
     * @param {number} index Move index
     * @param {Object} historyItem Move history item
     * @returns {HTMLElement} Move element
     */
    createMoveElement(index, historyItem) {
        const moveElement = document.createElement('span');
        moveElement.className = 'move-notation';
        moveElement.textContent = historyItem.notation;
        
        if (index === this.currentIndex) {
            moveElement.classList.add('current-move');
        }

        moveElement.addEventListener('click', () => this.jumpToMove(index));
        return moveElement;
    }

    /**
     * Jumps to a specific move
     * @param {number} index Move index
     */
    jumpToMove(index) {
        if (!this.navigationEnabled || index === this.currentIndex) return;

        this.game.loadFEN(this.history[index].fen);
        this.currentIndex = index;
        this.board.updateBoard(this.game.getBoard());
        this.updateMoveList();
        this.updateNavigationState();
    }

    /**
     * Jumps to the start position
     */
    jumpToStart() {
        if (!this.navigationEnabled || this.currentIndex === -1) return;
        this.game.reset();
        this.currentIndex = -1;
        this.board.updateBoard(this.game.getBoard());
        this.updateMoveList();
        this.updateNavigationState();
    }

    /**
     * Jumps to the last move
     */
    jumpToEnd() {
        if (!this.navigationEnabled || this.currentIndex === this.history.length - 1) return;
        this.jumpToMove(this.history.length - 1);
    }

    /**
     * Moves to the previous position
     */
    previousMove() {
        if (!this.navigationEnabled || this.currentIndex <= -1) return;
        this.jumpToMove(this.currentIndex - 1);
    }

    /**
     * Moves to the next position
     */
    nextMove() {
        if (!this.navigationEnabled || this.currentIndex >= this.history.length - 1) return;
        this.jumpToMove(this.currentIndex + 1);
    }

    /**
     * Updates navigation button states
     */
    updateNavigationState() {
        const atStart = this.currentIndex === -1;
        const atEnd = this.currentIndex === this.history.length - 1;

        this.firstButton.disabled = atStart;
        this.prevButton.disabled = atStart;
        this.nextButton.disabled = atEnd;
        this.lastButton.disabled = atEnd;
    }

    /**
     * Enables/disables history navigation
     * @param {boolean} enabled Whether navigation is enabled
     */
    setNavigationEnabled(enabled) {
        this.navigationEnabled = enabled;
        this.updateNavigationState();
    }

    /**
     * Clears the move history
     */
    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.updateMoveList();
        this.updateNavigationState();
    }

    /**
     * Gets the move history
     * @returns {Array} Move history
     */
    getHistory() {
        return this.history;
    }

    /**
     * Gets the current position index
     * @returns {number} Current index
     */
    getCurrentIndex() {
        return this.currentIndex;
    }

    /**
     * Checks if we're viewing the latest position
     * @returns {boolean} Whether at latest position
     */
    isAtLatestPosition() {
        return this.currentIndex === this.history.length - 1;
    }
}
