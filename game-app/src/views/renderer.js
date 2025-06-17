/**
 * Renderer for International Draughts (hectic-game)
 * Integrates directly with the Game instance.
 * Includes full animation support, NO placeholders.
 * @author codewithheck
 * Updated: 2025-06-17
 */
import { BOARD_SIZE, PIECE } from '../engine/constants.js';

export class Renderer {
    /**
     * @param {Game} gameInstance
     * @param {HTMLElement} boardContainer
     * @param {HTMLElement} historyContainer
     * @param {HTMLElement} statusContainer (optional)
     */
    constructor(gameInstance, boardContainer, historyContainer, statusContainer = null) {
        this.game = gameInstance;
        this.boardContainer = boardContainer;
        this.historyContainer = historyContainer;
        this.statusContainer = statusContainer;
        this.squareSize = 50;

        // Animation management
        this.animations = new Map();
        this.lastTimestamp = 0;
        this.isAnimating = false;
        this.requestId = null;
    }

    // Call this after any state change
    renderAll() {
        this.renderBoard();
        this.renderHistory();
        this.renderStatus();
    }

    renderBoard() {
        if (!this.boardContainer) return;
        this.boardContainer.innerHTML = '';

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                // Board square
                const square = document.createElement('div');
                square.className = 'board-square' + ((row + col) % 2 === 1 ? ' dark' : ' light');
                square.style.width = `${this.squareSize}px`;
                square.style.height = `${this.squareSize}px`;
                square.style.left = `${col * this.squareSize}px`;
                square.style.top = `${row * this.squareSize}px`;
                square.dataset.row = row;
                square.dataset.col = col;
                this.boardContainer.appendChild(square);

                // Piece rendering
                const pieceType = this.game.getPiece(row, col);
                if (pieceType && pieceType !== PIECE.NONE) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = this.getPieceClass(pieceType);
                    pieceEl.style.width = `${this.squareSize - 8}px`;
                    pieceEl.style.height = `${this.squareSize - 8}px`;
                    pieceEl.style.left = `${col * this.squareSize + 4}px`;
                    pieceEl.style.top = `${row * this.squareSize + 4}px`;

                    // King visual
                    if (pieceType === PIECE.WHITE_KING || pieceType === PIECE.BLACK_KING) {
                        const crown = document.createElement('div');
                        crown.className = 'crown';
                        pieceEl.appendChild(crown);
                    }
                    this.boardContainer.appendChild(pieceEl);
                }
            }
        }
    }

    renderHistory() {
        if (!this.historyContainer) return;
        this.historyContainer.innerHTML = '';
        this.game.moveHistory.forEach((move, idx) => {
            const entry = document.createElement('div');
            entry.className = 'history-entry';
            entry.textContent = `#${idx + 1}: ${move.notation || `${move.from.row},${move.from.col}→${move.to.row},${move.to.col}`}`;
            this.historyContainer.appendChild(entry);
        });
    }

    renderStatus() {
        if (!this.statusContainer) return;
        let status = '';
        switch (this.game.gameState) {
            case 'ongoing':
            case 0:
                status = `${this.game.currentPlayer === 0 ? 'White' : 'Black'} to move`;
                break;
            case 'whiteWin':
            case 1:
                status = 'White wins!';
                break;
            case 'blackWin':
            case 2:
                status = 'Black wins!';
                break;
            case 'draw':
            case 3:
                status = 'Game drawn';
                break;
            default:
                status = '';
        }
        this.statusContainer.textContent = status;
    }

    getPieceClass(piece) {
        switch (piece) {
            case PIECE.WHITE: return 'piece white';
            case PIECE.BLACK: return 'piece black';
            case PIECE.WHITE_KING: return 'piece white king';
            case PIECE.BLACK_KING: return 'piece black king';
            default: return '';
        }
    }

    // ----------- ANIMATION METHODS (NO PLACEHOLDERS!) -----------

    /**
     * Animate a piece movement
     * @param {HTMLElement} piece
     * @param {Object} from {row, col}
     * @param {Object} to {row, col}
     * @param {Function} onComplete
     * @param {number} duration
     */
    animateMove(piece, from, to, onComplete, duration = 300) {
        if (!piece) return;
        const fromPos = this.getSquarePosition(from.row, from.col);
        const toPos = this.getSquarePosition(to.row, to.col);

        const animation = {
            element: piece,
            startTime: null,
            duration: duration,
            startPos: fromPos,
            endPos: toPos,
            onComplete: onComplete
        };

        this.animations.set(piece, animation);
        this.startAnimationLoop();
    }

    /**
     * Animate a piece capture (scale down and fade out)
     * @param {HTMLElement} piece
     * @param {Function} onComplete
     * @param {number} duration
     */
    animateCapture(piece, onComplete, duration = 300) {
        if (!piece) return;
        const animation = {
            element: piece,
            startTime: null,
            duration: duration,
            startScale: 1,
            endScale: 0,
            onComplete: onComplete,
            type: 'capture'
        };
        this.animations.set(piece, animation);
        this.startAnimationLoop();
    }

    /**
     * Animate a piece promotion (pop effect)
     * @param {HTMLElement} piece
     * @param {Function} onComplete
     * @param {number} duration
     */
    animatePromotion(piece, onComplete, duration = 500) {
        if (!piece) return;
        const animation = {
            element: piece,
            startTime: null,
            duration: duration,
            startScale: 1,
            midScale: 1.2,
            endScale: 1,
            onComplete: onComplete,
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
     * @param {number} timestamp
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
        return {
            x: col * this.squareSize,
            y: row * this.squareSize
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
}
