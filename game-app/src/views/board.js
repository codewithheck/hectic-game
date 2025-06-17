/**
 * Board class for hectic-game
 * Compatible with main.js expectations
 */

import { BOARD_SIZE, PIECE } from '../engine/constants.js';

export class Board {
    constructor() {
        this.container = null;
        this.listeners = new Map();
        this.editMode = false;
        this.selectedSquare = null;
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
                
                if ((row + col) % 2 === 1) {
                    square.style.backgroundColor = '#8B4513';
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
            
            this.emit('squareClick', { row, col });
        });

        this.container.addEventListener('dragstart', (event) => {
            const piece = event.target.closest('.piece');
            if (!piece) return;
            const square = piece.parentElement;
            const row = parseInt(square.dataset.row, 10);
            const col = parseInt(square.dataset.col, 10);
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', JSON.stringify({ row, col }));
        });

        this.container.addEventListener('dragover', (event) => {
            const square = event.target.closest('.board-square');
            if (!square) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        });

        this.container.addEventListener('drop', (event) => {
            const square = event.target.closest('.board-square');
            if (!square) return;
            event.preventDefault();
            const data = event.dataTransfer.getData('text/plain');
            if (!data) return;
            const { row: fromRow, col: fromCol } = JSON.parse(data);
            const toRow = parseInt(square.dataset.row, 10);
            const toCol = parseInt(square.dataset.col, 10);
            this.emit('squareClick', { row: toRow, col: toCol, from: { row: fromRow, col: fromCol } });
        });
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
        const pieceEl = document.createElement('div');
        pieceEl.className = this.getPieceClass(pieceType);
        pieceEl.style.position = 'absolute';
        pieceEl.style.width = '50px';
        pieceEl.style.height = '50px';
        pieceEl.style.left = `${col * 60 + 5}px`;
        pieceEl.style.top = `${row * 60 + 5}px`;
        pieceEl.style.borderRadius = '50%';
        pieceEl.style.border = '2px solid #000';
        pieceEl.style.cursor = 'pointer';
        pieceEl.draggable = true;

        // Set piece color
        if (pieceType === PIECE.WHITE || pieceType === PIECE.WHITE_KING) {
            pieceEl.style.backgroundColor = '#FFFFFF';
        } else {
            pieceEl.style.backgroundColor = '#000000';
        }

        // Add crown for kings
        if (pieceType === PIECE.WHITE_KING || pieceType === PIECE.BLACK_KING) {
            const crown = document.createElement('div');
            crown.className = 'crown';
            crown.style.position = 'absolute';
            crown.style.top = '10px';
            crown.style.left = '50%';
            crown.style.transform = 'translateX(-50%)';
            crown.style.width = '20px';
            crown.style.height = '15px';
            crown.style.backgroundColor = '#FFD700';
            crown.style.borderRadius = '3px 3px 0 0';
            pieceEl.appendChild(crown);
        }

        this.container.appendChild(pieceEl);
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
