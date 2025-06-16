import { Game } from '../engine/game.js';
import { Board } from './board.js';
import {
    PLAYER,
    GAME_STATE,
    DOM_IDS,
    FEN
} from '../engine/constants.js';
import { createElement } from '../utils/dom-helpers.js';

export class UI {
    constructor(container) {
        this.container = container;
        this.game = new Game();
        this.moveHistory = [];
        this.currentPlayer = PLAYER.WHITE;
        this.initialize();
    }

    initialize() {
        this.createElements();
        this.createBoard();
        this.attachEventListeners();
        this.updateStatus();
    }

    createElements() {
        // Create main container
        this.gameContainer = createElement('div', { class: 'game-container' });

        // Create game info section
        this.gameInfo = createElement('div', { class: 'game-info' });

        // Create status display
        this.statusDisplay = createElement('div', { class: 'status-display', id: DOM_IDS.STATUS_DISPLAY });

        // Create controls
        this.controls = createElement('div', { class: 'game-controls' });

        this.newGameButton = createElement('button', {
            class: 'control-button',
            id: DOM_IDS.NEW_GAME_BUTTON
        }, { textContent: 'New Game' });

        this.undoButton = createElement('button', {
            class: 'control-button',
            id: DOM_IDS.UNDO_BUTTON,
            disabled: true
        }, { textContent: 'Undo' });

        // Create move history
        this.moveHistoryContainer = createElement('div', { class: 'move-history-container' });
        
        this.moveHistoryTitle = createElement('h3', {}, { textContent: 'Move History' });
        
        this.moveHistoryList = createElement('div', {
            class: 'move-history',
            id: DOM_IDS.MOVE_HISTORY
        });

        // Assemble UI
        this.controls.appendChild(this.newGameButton);
        this.controls.appendChild(this.undoButton);

        this.moveHistoryContainer.appendChild(this.moveHistoryTitle);
        this.moveHistoryContainer.appendChild(this.moveHistoryList);

        this.gameInfo.appendChild(this.statusDisplay);
        this.gameInfo.appendChild(this.controls);
        this.gameInfo.appendChild(this.moveHistoryContainer);

        this.container.appendChild(this.gameContainer);
        this.container.appendChild(this.gameInfo);
    }

    createBoard() {
        const boardContainer = createElement('div', { class: 'board-container' });
        this.gameContainer.appendChild(boardContainer);

        this.board = new Board(boardContainer);
        this.board.setCallbacks({
            onSquareClick: (row, col) => this.handleSquareClick(row, col),
            onPieceDragStart: (row, col, event) => this.handlePieceDragStart(row, col, event),
            onPieceDragOver: (event) => this.handlePieceDragOver(event),
            onPieceDrop: (row, col, event) => this.handlePieceDrop(row, col, event)
        });

        this.updateBoard();
    }

    attachEventListeners() {
        this.newGameButton.addEventListener('click', () => this.startNewGame());
        this.undoButton.addEventListener('click', () => this.undoMove());
    }

    handleSquareClick(row, col) {
        if (this.game.gameState !== GAME_STATE.ONGOING) return;

        const piece = this.game.getPiece(row, col);
        
        if (this.selectedSquare) {
            if (this.selectedSquare.row === row && this.selectedSquare.col === col) {
                this.clearSelection();
                return;
            }

            const move = {
                from: this.selectedSquare,
                to: { row, col },
                captures: []
            };

            const legalMoves = this.game.getLegalMoves();
            const matchingMove = legalMoves.find(m => 
                m.from.row === move.from.row && 
                m.from.col === move.from.col && 
                m.to.row === move.to.row && 
                m.to.col === move.to.col
            );

            if (matchingMove) {
                move.captures = matchingMove.captures;
                this.makeMove(move);
            }
            
            this.clearSelection();
        } else if (this.game.isPieceOfCurrentPlayer(piece)) {
            this.selectedSquare = { row, col };
            this.highlightMoves(row, col);
        }
    }

    handlePieceDragStart(row, col, event) {
        if (this.game.gameState !== GAME_STATE.ONGOING) return;

        const piece = this.game.getPiece(row, col);
        if (this.game.isPieceOfCurrentPlayer(piece)) {
            this.selectedSquare = { row, col };
            this.highlightMoves(row, col);
        }
    }

    handlePieceDragOver(event) {
        event.preventDefault();
    }

    handlePieceDrop(row, col, event) {
        if (!this.selectedSquare) return;

        const move = {
            from: this.selectedSquare,
            to: { row, col },
            captures: []
        };

        const legalMoves = this.game.getLegalMoves();
        const matchingMove = legalMoves.find(m => 
            m.from.row === move.from.row && 
            m.from.col === move.from.col && 
            m.to.row === move.to.row && 
            m.to.col === move.to.col
        );

        if (matchingMove) {
            move.captures = matchingMove.captures;
            this.makeMove(move);
        }

        this.clearSelection();
    }

    makeMove(move) {
        if (this.game.makeMove(move)) {
            this.moveHistory.push({
                move: move,
                notation: this.game.getMoveNotation(move)
            });
            this.updateBoard();
            this.updateMoveHistory();
            this.updateStatus();
            this.undoButton.disabled = false;
        }
    }

    highlightMoves(row, col) {
        this.board.clearHighlights();
        this.board.highlightSquare(row, col, 'selected');

        const legalMoves = this.game.getLegalMoves();
        legalMoves.forEach(move => {
            if (move.from.row === row && move.from.col === col) {
                this.board.highlightSquare(
                    move.to.row,
                    move.to.col,
                    move.captures.length > 0 ? 'capture-move' : 'possible-move'
                );
                move.captures.forEach(capture => {
                    this.board.highlightSquare(capture.row, capture.col, 'captured');
                });
            }
        });
    }

    clearSelection() {
        this.selectedSquare = null;
        this.board.clearHighlights();
    }

    updateBoard() {
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const piece = this.game.getPiece(row, col);
                const isDraggable = this.game.gameState === GAME_STATE.ONGOING &&
                                  this.game.isPieceOfCurrentPlayer(piece);
                this.board.setPiece(row, col, piece, isDraggable);
            }
        }
    }

    updateMoveHistory() {
        this.moveHistoryList.innerHTML = '';
        
        for (let i = 0; i < this.moveHistory.length; i++) {
            const moveNumber = Math.floor(i / 2) + 1;
            const isWhiteMove = i % 2 === 0;
            
            if (isWhiteMove) {
                const moveDiv = createElement('div', { class: 'move-entry' });
                moveDiv.innerHTML = `${moveNumber}. ${this.moveHistory[i].notation}`;
                
                if (this.moveHistory[i + 1]) {
                    moveDiv.innerHTML += ` ${this.moveHistory[i + 1].notation}`;
                }
                
                this.moveHistoryList.appendChild(moveDiv);
            }
        }

        this.moveHistoryList.scrollTop = this.moveHistoryList.scrollHeight;
    }

    updateStatus() {
        let status = '';
        
        switch (this.game.gameState) {
            case GAME_STATE.ONGOING:
                status = `${this.game.currentPlayer === PLAYER.WHITE ? 'White' : 'Black'} to move`;
                break;
            case GAME_STATE.WHITE_WIN:
                status = 'White wins!';
                break;
            case GAME_STATE.BLACK_WIN:
                status = 'Black wins!';
                break;
            case GAME_STATE.DRAW:
                status = 'Game drawn';
                break;
        }

        this.statusDisplay.textContent = status;
    }

    startNewGame() {
        this.game.reset();
        this.moveHistory = [];
        this.selectedSquare = null;
        this.undoButton.disabled = true;
        this.updateBoard();
        this.updateMoveHistory();
        this.updateStatus();
        this.board.clearHighlights();
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;

        // Create a new game instance and replay moves except the last one
        const newGame = new Game();
        const movesToReplay = this.moveHistory.slice(0, -1);
        
        movesToReplay.forEach(historyItem => {
            newGame.makeMove(historyItem.move);
        });

        // Update game state
        this.game = newGame;
        this.moveHistory = movesToReplay;
        this.selectedSquare = null;
        this.undoButton.disabled = this.moveHistory.length === 0;

        // Update UI
        this.updateBoard();
        this.updateMoveHistory();
        this.updateStatus();
        this.board.clearHighlights();
    }
}
