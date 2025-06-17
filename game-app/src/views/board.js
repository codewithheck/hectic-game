/**
 * Board class for hectic-game
 * Uses the provided flipped_board.jpg image with precise positioning
 * FLIPPED BOARD VERSION
 */

import { BOARD_SIZE, PIECE, isDarkSquare } from '../engine/constants.js';

export class Board {
    constructor() {
        this.container = null;
        this.listeners = new Map();
        this.editMode = false;
        this.selectedSquare = null;
        this.highlightedSquares = [];
        
        // Fine-tuning parameters - adjust these to perfect the positioning
        this.boardSize = 700; // Total board size
        this.squareSize = this.boardSize / BOARD_SIZE; // 60px per square
        
        // Fine-tuning offsets (adjust these if pieces are still not centered)
        this.boardOffsetX = 0; // Horizontal offset for the entire grid
        this.boardOffsetY = 0; // Vertical offset for the entire grid
        this.pieceOffsetX = 0; // Additional horizontal offset for pieces only
        this.pieceOffsetY = 0; // Additional vertical offset for pieces only
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
        this.container.style.width = `${this.boardSize}px`;
        this.container.style.height = `${this.boardSize}px`;
        this.container.style.backgroundImage = 'url("assets/images/flipped_board.jpg")';
        this.container.style.backgroundSize = 'cover';
        this.container.style.backgroundPosition = 'center';
        this.container.style.backgroundRepeat = 'no-repeat';
        this.container.style.border = '2px solid #333';

        // Create invisible clickable squares over the board image
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const square = document.createElement('div');
                square.className = `board-square ${isDarkSquare(row, col) ? 'dark' : 'light'}`;
                square.style.position = 'absolute';
                square.style.width = `${this.squareSize}px`;
                square.style.height = `${this.squareSize}px`;
                square.style.left = `${col * this.squareSize + this.boardOffsetX}px`;
                square.style.top = `${row * this.squareSize + this.boardOffsetY}px`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                // Make squares transparent but clickable
                square.style.backgroundColor = 'transparent';
                square.style.cursor = 'pointer';
                square.style.border = 'none';
                
                // Debug: uncomment the next line to see square boundaries
                // square.style.border = '1px solid rgba(255,0,0,0.3)';
                
                // Only dark squares are playable in draughts (flipped board)
                if (isDarkSquare(row, col)) {
                    square.classList.add('playable');
                }
                
                this.container.appendChild(square);
            }
        }

        console.log('Board created with precise positioning for flipped board');
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
            // Add a golden border for selection
            square.style.boxShadow = 'inset 0 0 0 4px #FFD700';
            square.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
        }
    }

    clearSelection() {
        if (this.selectedSquare) {
            const square = this.container.querySelector(`[data-row="${this.selectedSquare.row}"][data-col="${this.selectedSquare.col}"]`);
            if (square) {
                square.classList.remove('selected');
                square.style.boxShadow = '';
                square.style.backgroundColor = 'transparent';
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
        
        // Calculate precise piece positioning
        const pieceSize = this.squareSize * 0.75; // 75% of square size for better fit
        
        // Center the piece in the square, plus any additional offsets
        const baseCenterOffsetX = (this.squareSize - pieceSize) / 2;
        const baseCenterOffsetY = (this.squareSize - pieceSize) / 2;
        
        const finalOffsetX = baseCenterOffsetX + this.pieceOffsetX;
        const finalOffsetY = baseCenterOffsetY + this.pieceOffsetY;
        
        pieceEl.style.width = `${pieceSize}px`;
        pieceEl.style.height = `${pieceSize}px`;
        pieceEl.style.left = `${finalOffsetX}px`;
        pieceEl.style.top = `${finalOffsetY}px`;
        pieceEl.style.borderRadius = '50%';
        pieceEl.style.border = '3px solid #000';
        pieceEl.style.cursor = 'grab';
        pieceEl.style.zIndex = '10';
        pieceEl.draggable = true;
        
        // Enhanced piece styling to look more realistic
        if (pieceType === PIECE.WHITE || pieceType === PIECE.WHITE_KING) {
            pieceEl.style.background = 'radial-gradient(circle at 30% 30%, #ffffff, #e0e0e0, #c0c0c0)';
            pieceEl.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.8)';
        } else {
            pieceEl.style.background = 'radial-gradient(circle at 30% 30%, #444444, #222222, #000000)';
            pieceEl.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)';
        }

        // Add crown for kings
        if (pieceType === PIECE.WHITE_KING || pieceType === PIECE.BLACK_KING) {
            const crown = document.createElement('div');
            crown.className = 'crown';
            crown.style.position = 'absolute';
            crown.style.top = '20%';
            crown.style.left = '50%';
            crown.style.transform = 'translateX(-50%)';
            crown.style.width = '60%';
            crown.style.height = '40%';
            crown.style.background = 'linear-gradient(45deg, #FFD700, #FFA500)';
            crown.style.borderRadius = '6px 6px 0 0';
            crown.style.border = '2px solid #B8860B';
            crown.style.fontSize = `${pieceSize * 0.25}px`;
            crown.style.textAlign = 'center';
            crown.style.lineHeight = crown.style.height;
            crown.innerHTML = '♔';
            crown.style.color = '#8B4513';
            crown.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
            pieceEl.appendChild(crown);
        }

        square.appendChild(pieceEl);
    }

    // Method to adjust positioning if pieces are still not perfectly centered
    adjustPiecePositioning(offsetX = 0, offsetY = 0) {
        this.pieceOffsetX = offsetX;
        this.pieceOffsetY = offsetY;
        
        // Re-render all pieces with new positioning
        if (window.game) {
            this.updatePosition(window.game.getGamePosition());
        }
        
        console.log(`Piece positioning adjusted: X=${offsetX}, Y=${offsetY}`);
    }

    // Method to adjust board grid positioning
    adjustBoardGrid(offsetX = 0, offsetY = 0) {
        this.boardOffsetX = offsetX;
        this.boardOffsetY = offsetY;
        
        // Re-create the board with new grid positioning
        this.createBoard();
        
        // Re-render pieces
        if (window.game) {
            this.updatePosition(window.game.getGamePosition());
        }
        
        console.log(`Board grid adjusted: X=${offsetX}, Y=${offsetY}`);
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
                square.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
            }
        });
    }

    clearHighlights() {
        const highlighted = this.container.querySelectorAll('.legal-move');
        highlighted.forEach(square => {
            square.classList.remove('legal-move');
            square.style.boxShadow = '';
            square.style.backgroundColor = 'transparent';
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
