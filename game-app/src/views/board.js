/**
 * Board class for hectic-game
 * Fixed piece positioning and movement
 */

import { BOARD_SIZE, PIECE } from '../engine/constants.js';

export class Board {
    constructor() {
        this.container = null;
        this.listeners = new Map();
        this.editMode = false;
        this.selectedSquare = null;
        this.highlightedSquares = [];
    }

    initialize() {
        this.container = document.getElementById('game-board');
        if (!this.container) {
            console.error('Game board container not found');
            return;
        }
        
        this.createBoard();
        this.attachEventListeners();
    }

    createBoard() {
        this.container.innerHTML = '';
        this.container.style.position = 'relative';
        this.container.style.width = `${BOARD_SIZE * 60}px`;
        this.container.style.height = `${BOARD_SIZE * 60}px`;
        this.container.style.border = '2px solid #333';

        // Create squares
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const square = document.createElement('div');
                square.className = `board-square ${(row + col) % 2 === 1 ? 'dark' : 'light'}`;
                square.style.position = 'absolute';
                square.style.width = '60px';
                square.style.height = '60px';
                square.style.left = `${col * 60}px`;
                square.style.top = `${row * 60}px`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                // Add basic styling
                square.style.border = '1px solid #333';
                square.style.boxSizing = 'border-box';
                square.style.cursor = 'pointer';
                
                // Only dark squares are playable in draughts
                if ((row + col) % 2 === 1) {
                    square.style.backgroundColor = '#8B4513';
                    square.classList.add('playable');
                } else {
                    square.style.backgroundColor = '#F5DEB3';
                }
                
                this.container.appendChild(square);
            }
        }
    }

    attachEventListeners() {
        this.container.addEventListener('click', (event) => {
            const square = event.target.closest('.board-square');
            if (!square) return;
            
            const row = parseInt(square.dataset.row, 10);
            const col = parseInt(square.dataset.col, 10);
            
            this.handleSquareClick(row, col);
        });

        // Improved drag and drop
        this.container.addEventListener('dragstart', (event) => {
            const piece = event.target.closest('.piece');
            if (!piece) return;
            
            const square = piece.closest('.board-square');
            const row = parseInt(square.dataset.row, 10);
            const col = parseInt(square.dataset.col, 10);
            
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('application/json', JSON.stringify({ 
                row, col, 
                offsetX: event.offsetX,
                offsetY: event.offsetY 
            }));
            
            // Visual feedback
            piece.style.opacity = '0.5';
            this.selectedSquare = { row, col };
        });

        this.container.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        });

        this.container.addEventListener('drop', (event) => {
            event.preventDefault();
            
            const square = event.target.closest('.board-square');
            if (!square) return;
            
            const toRow = parseInt(square.dataset.row, 10);
            const toCol = parseInt(square.dataset.col, 10);
            
            try {
                const dragData = JSON.parse(event.dataTransfer.getData('application/json'));
                const fromRow = dragData.row;
                const fromCol = dragData.col;
                
                // Reset piece opacity
                const piece = this.container.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"] .piece`);
                if (piece) piece.style.opacity = '1';
                
                if (fromRow !== toRow || fromCol !== toCol) {
                    this.emit('moveAttempt', { 
                        from: { row: fromRow, col: fromCol },
                        to: { row: toRow, col: toCol }
                    });
                }
            } catch (error) {
                console.error('Error handling drop:', error);
            }
        });

        this.container.addEventListener('dragend', (event) => {
            // Reset any drag visual effects
            const pieces = this.container.querySelectorAll('.piece');
            pieces.forEach(piece => piece.style.opacity = '1');
        });
    }

    handleSquareClick(row, col) {
        if (this.selectedSquare) {
            // If clicking a different square, try to move
            if (this.selectedSquare.row !== row || this.selectedSquare.col !== col) {
                this.emit('moveAttempt', {
                    from: { row: this.selectedSquare.row, col: this.selectedSquare.col },
                    to: { row, col }
                });
            }
            // Deselect
            this.clearSelection();
        } else {
            // Select this square if it has a piece
            const piece = this.getPieceAt(row, col);
            if (piece) {
                this.selectSquare(row, col);
                this.emit('squareSelected', { row, col });
            }
        }
    }

    selectSquare(row, col) {
        this.clearSelection();
        this.selectedSquare = { row, col };
        
        const square = this.container.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (square) {
            square.classList.add('selected');
            square.style.backgroundColor = '#FFD700';
        }
    }

    clearSelection() {
        if (this.selectedSquare) {
            const square = this.container.querySelector(`[data-row="${this.selectedSquare.row}"][data-col="${this.selectedSquare.col}"]`);
            if (square) {
                square.classList.remove('selected');
                // Restore original color
                const isLight = (this.selectedSquare.row + this.selectedSquare.col) % 2 === 0;
                square.style.backgroundColor = isLight ? '#F5DEB3' : '#8B4513';
            }
        }
        this.selectedSquare = null;
    }

    getPieceAt(row, col) {
        const square = this.container.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        return square ? square.querySelector('.piece') : null;
    }

    updatePosition(position) {
        // Clear existing pieces
        const existingPieces = this.container.querySelectorAll('.piece');
        existingPieces.forEach(piece => piece.remove());

        // Add pieces based on position
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = position.pieces[row][col];
                if (piece && piece !== PIECE.NONE) {
                    this.createPiece(row, col, piece);
                }
            }
        }
    }

    createPiece(row, col, pieceType) {
        const square = this.container.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!square) return;

        const pieceEl = document.createElement('div');
        pieceEl.className = this.getPieceClass(pieceType);
        pieceEl.style.position = 'absolute';
        pieceEl.style.width = '50px';
        pieceEl.style.height = '50px';
        pieceEl.style.left = '5px';
        pieceEl.style.top = '5px';
        pieceEl.style.borderRadius = '50%';
        pieceEl.style.border = '3px solid #000';
        pieceEl.style.cursor = 'grab';
        pieceEl.style.zIndex = '10';
        pieceEl.draggable = true;
        
        // Piece styling
        if (pieceType === PIECE.WHITE || pieceType === PIECE.WHITE_KING) {
            pieceEl.style.backgroundColor = '#FFFFFF';
            pieceEl.style.backgroundImage = 'radial-gradient(circle at 30% 30%, #fff, #ddd)';
        } else {
            pieceEl.style.backgroundColor = '#222222';
            pieceEl.style.backgroundImage = 'radial-gradient(circle at 30% 30%, #444, #000)';
        }

        // Add crown for kings
        if (pieceType === PIECE.WHITE_KING || pieceType === PIECE.BLACK_KING) {
            const crown = document.createElement('div');
            crown.className = 'crown';
            crown.style.position = 'absolute';
            crown.style.top = '8px';
            crown.style.left = '50%';
            crown.style.transform = 'translateX(-50%)';
            crown.style.width = '24px';
            crown.style.height = '16px';
            crown.style.backgroundColor = '#FFD700';
            crown.style.borderRadius = '4px 4px 0 0';
            crown.style.border = '1px solid #B8860B';
            crown.style.fontSize = '8px';
            crown.style.textAlign = 'center';
            crown.style.lineHeight = '16px';
            crown.innerHTML = '♔';
            crown.style.color = '#8B4513';
            pieceEl.appendChild(crown);
        }

        square.appendChild(pieceEl);
    }

    getPieceClass(piece) {
        switch (piece) {
            case PIECE.WHITE: return 'piece white';
            case PIECE.BLACK: return 'piece black';
            case PIECE.WHITE_KING: return 'piece white king';
            case PIECE.BLACK_KING: return 'piece black king';
            default: return 'piece';
        }
    }

    highlightLegalMoves(moves) {
        this.clearHighlights();
        
        moves.forEach(move => {
            const square = this.container.querySelector(`[data-row="${move.to.row}"][data-col="${move.to.col}"]`);
            if (square) {
                square.classList.add('legal-move');
                square.style.boxShadow = 'inset 0 0 0 4px #00FF00';
            }
        });
    }

    clearHighlights() {
        const highlighted = this.container.querySelectorAll('.legal-move');
        highlighted.forEach(square => {
            square.classList.remove('legal-move');
            square.style.boxShadow = '';
        });
    }

    setEditMode(enabled) {
        this.editMode = enabled;
        console.log('Edit mode:', enabled);
    }

    async saveAsPNG() {
        if (typeof html2canvas !== 'undefined') {
            try {
                const canvas = await html2canvas(this.container);
                const link = document.createElement('a');
                link.download = 'draughts-position.png';
                link.href = canvas.toDataURL();
                link.click();
            } catch (error) {
                console.error('Failed to save PNG:', error);
            }
        } else {
            console.error('html2canvas not loaded');
        }
    }

    async loadFromPNG(imageFile) {
        console.log('Loading position from PNG not yet implemented');
        return null;
    }

    // Event emitter methods
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
}
