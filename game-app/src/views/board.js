/**
 * International Draughts Board Visualization
 * Note: This implementation handles the visual board representation for a horizontally flipped board
 * where square numbers increase from right to left
 * @author codewithheck
 * Created: 2025-06-16 19:29:48 UTC
 */

import {
    BOARD_SIZE,
    PIECE,
    SQUARE_NUMBERS,
    DOM_IDS
} from '../engine/constants.js';

export class Board {
    constructor(container) {
        this.container = container;
        this.squares = [];
        this.isFlipped = false;
        this.callbacks = {
            onSquareClick: null,
            onPieceDragStart: null,
            onPieceDragOver: null,
            onPieceDrop: null
        };
        
        this.initialize();
    }

    /**
     * Initializes the board visualization
     */
    initialize() {
        this.createBoard();
        this.attachEventListeners();
    }

    /**
     * Creates the board DOM structure
     */
    createBoard() {
        const board = document.createElement('div');
        board.id = DOM_IDS.GAME_BOARD;
        board.className = 'game-board';

        // Create squares grid
        for (let row = 0; row < BOARD_SIZE; row++) {
            const squareRow = [];
            for (let col = 0; col < BOARD_SIZE; col++) {
                const square = this.createSquare(row, col);
                board.appendChild(square.element);
                squareRow.push(square);
            }
            this.squares.push(squareRow);
        }

        this.container.appendChild(board);
        this.boardElement = board;
    }

    /**
     * Creates a single square element
     * @param {number} row 
     * @param {number} col 
     * @returns {Object} Square object with element and state
     */
    createSquare(row, col) {
        const square = document.createElement('div');
        square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
        square.dataset.row = row;
        square.dataset.col = col;

        // Add square number for dark squares
        if ((row + col) % 2 === 1) {
            const number = SQUARE_NUMBERS[row * BOARD_SIZE + col];
            const numberDiv = document.createElement('div');
            numberDiv.className = 'square-number';
            numberDiv.textContent = number;
            square.appendChild(numberDiv);
        }

        return {
            element: square,
            piece: null,
            highlight: null
        };
    }

    /**
     * Attaches event listeners to the board
     */
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

    /**
     * Sets event callbacks
     * @param {Object} callbacks 
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Updates piece on a square
     * @param {number} row 
     * @param {number} col 
     * @param {number} piece 
     * @param {boolean} isDraggable 
     */
    setPiece(row, col, piece, isDraggable = false) {
        const square = this.squares[row][col];
        const squareElement = square.element;

        // Remove existing piece
        if (square.piece) {
            squareElement.removeChild(square.piece);
            square.piece = null;
        }

        if (piece === PIECE.NONE) return;

        // Create new piece
        const pieceElement = document.createElement('div');
        pieceElement.className = 'piece';
        pieceElement.draggable = isDraggable;

        if (piece === PIECE.WHITE || piece === PIECE.WHITE_KING) {
            pieceElement.classList.add('white');
        } else {
            pieceElement.classList.add('black');
        }

        if (piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING) {
            pieceElement.classList.add('king');
        }

        squareElement.appendChild(pieceElement);
        square.piece = pieceElement;
    }

    /**
     * Highlights a square
     * @param {number} row 
     * @param {number} col 
     * @param {string} type Highlight type ('selected', 'possible-move', 'capture-move', 'captured')
     */
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

    /**
     * Clears all highlights
     */
    clearHighlights() {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                this.highlightSquare(row, col, null);
            }
        }
    }

    /**
     * Flips the board view
     */
    flipBoard() {
        this.isFlipped = !this.isFlipped;
        this.boardElement.classList.toggle('flipped');
    }

    /**
     * Clears the entire board
     */
    clear() {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                this.setPiece(row, col, PIECE.NONE);
            }
        }
        this.clearHighlights();
    }

    /**
     * Gets square element at coordinates
     * @param {number} row 
     * @param {number} col 
     * @returns {HTMLElement}
     */
    getSquareElement(row, col) {
        return this.squares[row][col].element;
    }
}
