/**
 * International Draughts Renderer Implementation using Game instance for state
 * @author codewithheck
 * Updated: 2025-06-17
 */

import { BOARD_SIZE } from '../engine/constants.js';

export class Renderer {
    /**
     * @param {Game} gameInstance - The Game instance managing state
     * @param {HTMLElement} boardContainer - DOM element for the board
     * @param {HTMLElement} historyContainer - DOM element for move history
     * @param {HTMLElement} statusContainer - DOM element for status/turn display (optional)
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

    // --- Core render method to call after each game state change ---
    renderAll() {
        this.renderBoard();
        this.renderHistory();
        this.updateUI();
    }

    // --- Render the board based on Game state ---
    renderBoard() {
        if (!this.boardContainer) return;
        // Clear the board display
        while (this.boardContainer.firstChild) {
            this.boardContainer.removeChild(this.boardContainer.firstChild);
        }
        // Render each square and piece
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                // Square
                const square = document.createElement('div');
                square.className = 'board-square';
                square.style.width = `${this.squareSize}px`;
                square.style.height = `${this.squareSize}px`;
                square.style.left = `${col * this.squareSize}px`;
                square.style.top = `${row * this.squareSize}px`;
                square.dataset.row = row;
                square.dataset.col = col;
                this.boardContainer.appendChild(square);

                // Piece
                const piece = this.game.getPiece(row, col);
                if (piece && piece !== 0) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = `piece ${this.getPieceClass(piece)}`;
                    pieceEl.style.width = `${this.squareSize - 8}px`;
                    pieceEl.style.height = `${this.squareSize - 8}px`;
                    pieceEl.style.left = `${col * this.squareSize + 4}px`;
                    pieceEl.style.top = `${row * this.squareSize + 4}px`;

                    // Optionally add a king visual
                    if (piece === 3 || piece === 4) { // PIECE.WHITE_KING || PIECE.BLACK_KING
                        const crown = document.createElement('div');
                        crown.className = 'crown';
                        pieceEl.appendChild(crown);
                    }
                    this.boardContainer.appendChild(pieceEl);
                }
            }
        }
    }

    // --- Render move history based on Game state ---
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

    // --- Update status display or other UI elements ---
    updateUI() {
        if (!this.statusContainer) return;
        let status = '';
        switch (this.game.gameState) {
            case 'ongoing':
            case 0: // fallback for constant
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

    // --- Piece class helper ---
    getPieceClass(piece) {
        // 1: white, 2: black, 3: white king, 4: black king
        switch (piece) {
            case 1: return 'white';
            case 2: return 'black';
            case 3: return 'white king';
            case 4: return 'black king';
            default: return '';
        }
    }

    // --- Animation methods (unchanged from previous version, for brevity) ---
    animateMove(piece, from, to, onComplete, duration = 300) { /* ... */ }
    animateCapture(piece, onComplete, duration = 300) { /* ... */ }
    animatePromotion(piece, onComplete, duration = 500) { /* ... */ }
    startAnimationLoop() { /* ... */ }
    animate(timestamp) { /* ... */ }
    updateMoveAnimation(piece, animation, eased) { /* ... */ }
    updateCaptureAnimation(piece, animation, eased) { /* ... */ }
    updatePromotionAnimation(piece, animation, eased) { /* ... */ }
    getSquarePosition(row, col) { return { x: col * this.squareSize, y: row * this.squareSize }; }
    easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    stopAnimations() { /* ... */ }
    updateSquareSize(size) { this.squareSize = size; }
}
