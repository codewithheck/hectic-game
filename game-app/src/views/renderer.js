/**
 * International Draughts Renderer Implementation
 * Refactored for centralized state management and reactivity
 * @author codewithheck
 * Updated: 2025-06-17
 */

import { BOARD_SIZE } from '../engine/constants.js';

export class Renderer {
    /**
     * @param {GameStateManager} stateManager
     * @param {HTMLElement} boardContainer - DOM element for the board
     * @param {HTMLElement} historyContainer - DOM element for move history
     */
    constructor(stateManager, boardContainer, historyContainer) {
        // Animation management
        this.animations = new Map();
        this.lastTimestamp = 0;
        this.isAnimating = false;
        this.requestId = null;

        // Board rendering
        this.boardContainer = boardContainer;
        this.historyContainer = historyContainer;
        this.squareSize = 50; // Default, can be set with updateSquareSize

        // Subscribe to state changes
        this.unsubscribe = stateManager.subscribe((state) => {
            this.renderBoard(state.board);
            this.renderHistory(state.moves);
            this.updateUI(state);
        });
    }

    /**
     * Animates a piece movement
     */
    animateMove(piece, from, to, onComplete, duration = 300) {
        if (!piece) return;
        const fromPos = this.getSquarePosition(from.row, from.col);
        const toPos = this.getSquarePosition(to.row, to.col);

        const animation = {
            element: piece,
            startTime: null,
            duration,
            startPos: fromPos,
            endPos: toPos,
            onComplete
        };

        this.animations.set(piece, animation);
        this.startAnimationLoop();
    }

    /**
     * Animates a piece capture (scale down and fade out)
     */
    animateCapture(piece, onComplete, duration = 300) {
        if (!piece) return;
        const animation = {
            element: piece,
            startTime: null,
            duration,
            startScale: 1,
            endScale: 0,
            onComplete,
            type: 'capture'
        };
        this.animations.set(piece, animation);
        this.startAnimationLoop();
    }

    /**
     * Animates a piece promotion (pop effect)
     */
    animatePromotion(piece, onComplete, duration = 500) {
        if (!piece) return;
        const animation = {
            element: piece,
            startTime: null,
            duration,
            startScale: 1,
            midScale: 1.2,
            endScale: 1,
            onComplete,
            type: 'promotion'
        };
        this.animations.set(piece, animation);
        this.startAnimationLoop();
    }

    /**
     * Starts the animation loop if not already running
     */
    startAnimationLoop() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.lastTimestamp = performance.now();
            this.requestId = requestAnimationFrame((timestamp) => this.animate(timestamp));
        }
    }

    /**
     * Main animation loop
     */
    animate(timestamp) {
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        for (const [piece, animation] of this.animations.entries()) {
            if (!animation.startTime) {
                animation.startTime = timestamp;
            }
            const progress = Math.min((timestamp - animation.startTime) / animation.duration, 1);
            const eased = this.easeInOutCubic(progress);

            if (animation.type === 'capture') {
                this.updateCaptureAnimation(piece, animation, eased);
            } else if (animation.type === 'promotion') {
                this.updatePromotionAnimation(piece, animation, eased);
            } else {
                this.updateMoveAnimation(piece, animation, eased);
            }

            if (progress >= 1) {
                if (animation.onComplete) animation.onComplete();
                this.animations.delete(piece);
            }
        }

        if (this.animations.size > 0) {
            this.requestId = requestAnimationFrame((timestamp) => this.animate(timestamp));
        } else {
            this.isAnimating = false;
            this.requestId = null;
        }
    }

    /**
     * Updates the position of a moving piece
     */
    updateMoveAnimation(piece, animation, eased) {
        const currentX = animation.startPos.x + (animation.endPos.x - animation.startPos.x) * eased;
        const currentY = animation.startPos.y + (animation.endPos.y - animation.startPos.y) * eased;
        piece.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }

    /**
     * Updates the scale of a captured piece
     */
    updateCaptureAnimation(piece, animation, eased) {
        const currentScale = animation.startScale + (animation.endScale - animation.startScale) * eased;
        piece.style.transform = `scale(${currentScale})`;
        piece.style.opacity = 1 - eased;
    }

    /**
     * Updates the scale of a promoted piece
     */
    updatePromotionAnimation(piece, animation, eased) {
        let currentScale;
        if (eased < 0.5) {
            currentScale = animation.startScale + (animation.midScale - animation.startScale) * (eased * 2);
        } else {
            currentScale = animation.midScale + (animation.endScale - animation.midScale) * ((eased - 0.5) * 2);
        }
        piece.style.transform = `scale(${currentScale})`;
    }

    /**
     * Gets the pixel position of a square
     */
    getSquarePosition(row, col) {
        const size = this.squareSize || 50;
        return {
            x: col * size,
            y: row * size
        };
    }

    /**
     * Easing function for smooth animations
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * Stops all current animations
     */
    stopAnimations() {
        if (this.requestId) {
            cancelAnimationFrame(this.requestId);
            this.requestId = null;
        }
        this.animations.clear();
        this.isAnimating = false;
    }

    /**
     * Updates the square size for calculations
     */
    updateSquareSize(size) {
        this.squareSize = size;
    }

    /**
     * Renders the board given a board state
     * @param {Array} board 2D array representing the board state
     */
    renderBoard(board) {
        if (!this.boardContainer) return;
        // Remove old pieces
        while (this.boardContainer.firstChild) {
            this.boardContainer.removeChild(this.boardContainer.firstChild);
        }
        // Render squares and pieces
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const square = document.createElement('div');
                square.className = 'board-square';
                square.style.width = `${this.squareSize}px`;
                square.style.height = `${this.squareSize}px`;
                square.style.left = `${col * this.squareSize}px`;
                square.style.top = `${row * this.squareSize}px`;
                square.dataset.row = row;
                square.dataset.col = col;
                this.boardContainer.appendChild(square);

                const piece = board[row][col];
                if (piece) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = `piece ${piece.color} ${piece.king ? 'king' : ''}`;
                    pieceEl.style.width = `${this.squareSize - 8}px`;
                    pieceEl.style.height = `${this.squareSize - 8}px`;
                    pieceEl.style.left = `${col * this.squareSize + 4}px`;
                    pieceEl.style.top = `${row * this.squareSize + 4}px`;
                    // Optionally add data attributes for IDs, etc.
                    this.boardContainer.appendChild(pieceEl);
                }
            }
        }
    }

    /**
     * Renders the move history
     * @param {Array} moves Array of move objects
     */
    renderHistory(moves) {
        if (!this.historyContainer) return;
        this.historyContainer.innerHTML = '';
        moves.forEach((move, idx) => {
            const entry = document.createElement('div');
            entry.className = 'history-entry';
            entry.textContent = `#${idx + 1}: ${move.notation || `${move.from.row},${move.from.col}→${move.to.row},${move.to.col}`}`;
            this.historyContainer.appendChild(entry);
        });
    }

    /**
     * Updates other UI elements as needed
     * @param {object} state
     */
    updateUI(state) {
        // Extend as needed, e.g., update status bar, enable/disable controls, etc.
    }
}
