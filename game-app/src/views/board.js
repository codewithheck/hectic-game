import {
    BOARD_SIZE,
    PIECE,
    SQUARE_NUMBERS,
    DOM_IDS
} from '../engine/constants.js';

import { createElement, createSquare, createPiece } from '../utils/dom-helpers.js';

export class Board {
    constructor(container) {
        this.container = container;
        this.squares = [];
        this.callbacks = {
            onSquareClick: null,
            onPieceDragStart: null,
            onPieceDragOver: null,
            onPieceDrop: null
        };
        
        this.initialize();
    }

    initialize() {
        this.createBoard();
        this.attachEventListeners();
    }

    createBoard() {
        const board = createElement('div', {
            id: DOM_IDS.GAME_BOARD,
            class: 'game-board'
        });

        for (let row = 0; row < BOARD_SIZE; row++) {
            const squareRow = [];
            for (let col = 0; col < BOARD_SIZE; col++) {
                const squareObj = this.createSquare(row, col);
                board.appendChild(squareObj.element);
                squareRow.push(squareObj);
            }
            this.squares.push(squareRow);
        }

        this.container.appendChild(board);
        this.boardElement = board;
    }

    createSquare(row, col) {
        const isDark = (row + col) % 2 === 1;
        const square = createSquare(row, col, isDark);

        if (isDark) {
            const number = SQUARE_NUMBERS[row * BOARD_SIZE + col];
            const numberDiv = createElement('div', { class: 'square-number' }, { textContent: number });
            square.appendChild(numberDiv);
        }

        return {
            element: square,
            piece: null,
            highlight: null
        };
    }

    attachEventListeners() {
        this.boardElement.addEventListener('click', (e) => {
            const square = e.target.closest('.square');
            if (!square || !this.callbacks.onSquareClick) return;

            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            this.callbacks.onSquareClick(row, col);
        });

        this.boardElement.addEventListener('dragstart', (e) => {
            const square = e.target.closest('.square');
            if (!square || !this.callbacks.onPieceDragStart) return;

            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            this.callbacks.onPieceDragStart(row, col, e);
        });

        this.boardElement.addEventListener('dragover', (e) => {
            if (this.callbacks.onPieceDragOver) {
                e.preventDefault();
                this.callbacks.onPieceDragOver(e);
            }
        });

        this.boardElement.addEventListener('drop', (e) => {
            const square = e.target.closest('.square');
            if (!square || !this.callbacks.onPieceDrop) return;

            e.preventDefault();
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            this.callbacks.onPieceDrop(row, col, e);
        });
    }

    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    setPiece(row, col, piece, isDraggable = false) {
        const square = this.squares[row][col];
        const squareElement = square.element;

        if (square.piece) {
            squareElement.removeChild(square.piece);
            square.piece = null;
        }

        if (piece === PIECE.NONE) return;

        const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
        const pieceType = (piece === PIECE.WHITE || piece === PIECE.WHITE_KING) ? PIECE.WHITE : PIECE.BLACK;
        const pieceElement = createPiece(pieceType, isKing);
        pieceElement.draggable = isDraggable;

        squareElement.appendChild(pieceElement);
        square.piece = pieceElement;
    }

    highlightSquare(row, col, type) {
        const square = this.squares[row][col];
        if (square.highlight) {
            square.element.classList.remove(square.highlight);
        }
        if (type) {
            square.element.classList.add(type);
            square.highlight = type;
        } else {
            square.highlight = null;
        }
    }

    clearHighlights() {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                this.highlightSquare(row, col, null);
            }
        }
    }

    clear() {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                this.setPiece(row, col, PIECE.NONE);
            }
        }
        this.clearHighlights();
    }

    getSquareElement(row, col) {
        return this.squares[row][col].element;
    }
}
