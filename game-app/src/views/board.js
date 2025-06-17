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
        this.boardElement.addEventListener('click', this.handleBoardEvents);
        this.boardElement.addEventListener('dragstart', this.handleBoardEvents);
        this.boardElement.addEventListener('dragover', this.handleBoardEvents);
        this.boardElement.addEventListener('drop', this.handleBoardEvents);
    }

    handleBoardEvents = (event) => {
        const square = event.target.closest('.square');
        if (!square) return;

        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        switch(event.type) {
            case 'click':
                if (this.callbacks.onSquareClick) {
                    this.callbacks.onSquareClick(row, col, event);
                }
                break;
            case 'dragstart':
                if (this.callbacks.onPieceDragStart) {
                    this.callbacks.onPieceDragStart(row, col, event);
                }
                break;
            case 'dragover':
                if (this.callbacks.onPieceDragOver) {
                    event.preventDefault();
                    this.callbacks.onPieceDragOver(event, square, row, col);
                }
                break;
            case 'drop':
                if (this.callbacks.onPieceDrop) {
                    event.preventDefault();
                    this.callbacks.onPieceDrop(row, col, event);
                }
                break;
        }
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
