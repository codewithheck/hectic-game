/**
 * International Draughts Board UI Implementation
 * Note: This implementation handles the UI for a horizontally flipped board where:
 * - Square numbers increase from right to left
 * - The board is rendered flipped horizontally from the traditional view
 * @author codewithheck
 * Created: 2025-06-16 19:22:55 UTC
 */

import {
    BOARD_SIZE,
    PIECE,
    PLAYER,
    GAME_STATE,
    SQUARE_NUMBERS,
    DOM_IDS
} from '../engine/constants.js';

export class BoardView {
    constructor(game, container) {
        this.game = game;
        this.container = container;
        this.selectedSquare = null;
        this.highlightedSquares = [];
        this.possibleMoves = [];
        this.boardElement = null;
        this.isFlipped = false;
        this.initialize();
    }

    /**
     * Initializes the board UI
     */
    initialize() {
        this.createBoard();
        this.attachEventListeners();
        this.render();
    }

    /**
     * Creates the board DOM structure
     */
    createBoard() {
        this.boardElement = document.createElement('div');
        this.boardElement.id = DOM_IDS.GAME_BOARD;
        this.boardElement.className = 'game-board';

        // Create squares
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
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

                this.boardElement.appendChild(square);
            }
        }

        this.container.appendChild(this.boardElement);
    }

    /**
     * Attaches event listeners to the board
     */
    attachEventListeners() {
        this.boardElement.addEventListener('click', (e) => {
            const square = e.target.closest('.square');
            if (!square) return;

            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            this.handleSquareClick(row, col);
        });

        // Add drag and drop support
        this.boardElement.addEventListener('dragstart', (e) => {
            const square = e.target.closest('.square');
            if (!square) return;

            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            if (this.canSelectSquare(row, col)) {
                this.selectedSquare = { row, col };
                this.updatePossibleMoves();
                this.highlightSquares();
            }
        });

        this.boardElement.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        this.boardElement.addEventListener('drop', (e) => {
            e.preventDefault();
            const square = e.target.closest('.square');
            if (!square) return;

            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            this.handleSquareDrop(row, col);
        });
    }

    /**
     * Handles square click events
     * @param {number} row 
     * @param {number} col 
     */
    handleSquareClick(row, col) {
        if (this.selectedSquare) {
            // If clicking the same square, deselect it
            if (this.selectedSquare.row === row && this.selectedSquare.col === col) {
                this.clearSelection();
                return;
            }

            // Try to make a move
            const move = this.findMove(this.selectedSquare, { row, col });
            if (move) {
                this.makeMove(move);
                this.clearSelection();
                return;
            }
        }

        // Select new square if it has a piece of the current player
        if (this.canSelectSquare(row, col)) {
            this.selectedSquare = { row, col };
            this.updatePossibleMoves();
            this.highlightSquares();
        }
    }

    /**
     * Handles square drop events for drag and drop
     * @param {number} row 
     * @param {number} col 
     */
    handleSquareDrop(row, col) {
        if (!this.selectedSquare) return;

        const move = this.findMove(this.selectedSquare, { row, col });
        if (move) {
            this.makeMove(move);
        }
        this.clearSelection();
    }

    /**
     * Checks if a square can be selected
     * @param {number} row 
     * @param {number} col 
     * @returns {boolean}
     */
    canSelectSquare(row, col) {
        const piece = this.game.getPiece(row, col);
        return piece !== PIECE.NONE && 
               this.game.isPieceOfCurrentPlayer(piece) &&
               this.game.gameState === GAME_STATE.ONGOING;
    }

    /**
     * Updates the list of possible moves for selected piece
     */
    updatePossibleMoves() {
        if (!this.selectedSquare) {
            this.possibleMoves = [];
            return;
        }

        const legalMoves = this.game.getLegalMoves();
        this.possibleMoves = legalMoves.filter(move => 
            move.from.row === this.selectedSquare.row &&
            move.from.col === this.selectedSquare.col
        );
    }

    /**
     * Finds a legal move between two squares
     * @param {Object} from 
     * @param {Object} to 
     * @returns {Object|null}
     */
    findMove(from, to) {
        return this.possibleMoves.find(move =>
            move.to.row === to.row && move.to.col === to.col
        );
    }

    /**
     * Makes a move and updates the UI
     * @param {Object} move 
     */
    makeMove(move) {
        if (this.game.makeMove(move)) {
            this.render();
            this.notifyMoveListeners(move);
        }
    }

    /**
     * Highlights squares based on selection and possible moves
     */
    highlightSquares() {
        // Clear previous highlights
        this.clearHighlights();

        if (!this.selectedSquare) return;

        // Highlight selected square
        const selectedElement = this.getSquareElement(this.selectedSquare.row, this.selectedSquare.col);
        selectedElement.classList.add('selected');
        this.highlightedSquares.push(selectedElement);

        // Highlight possible moves
        for (const move of this.possibleMoves) {
            const element = this.getSquareElement(move.to.row, move.to.col);
            element.classList.add('possible-move');
            if (move.captures.length > 0) {
                element.classList.add('capture-move');
            }
            this.highlightedSquares.push(element);

            // Highlight captured pieces
            for (const capture of move.captures) {
                const captureElement = this.getSquareElement(capture.row, capture.col);
                captureElement.classList.add('captured');
                this.highlightedSquares.push(captureElement);
            }
        }
    }

    /**
     * Clears selection and highlights
     */
    clearSelection() {
        this.selectedSquare = null;
        this.possibleMoves = [];
        this.clearHighlights();
    }

    /**
     * Clears highlighted squares
     */
    clearHighlights() {
        this.highlightedSquares.forEach(element => {
            element.classList.remove('selected', 'possible-move', 'capture-move', 'captured');
        });
        this.highlightedSquares = [];
    }

    /**
     * Gets a square element by coordinates
     * @param {number} row 
     * @param {number} col 
     * @returns {HTMLElement}
     */
    getSquareElement(row, col) {
        return this.boardElement.querySelector(
            `.square[data-row="${row}"][data-col="${col}"]`
        );
    }

    /**
     * Renders the entire board
     */
    render() {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const square = this.getSquareElement(row, col);
                this.renderSquare(square, row, col);
            }
        }
    }

    /**
     * Renders a single square
     * @param {HTMLElement} square 
     * @param {number} row 
     * @param {number} col 
     */
    renderSquare(square, row, col) {
        // Clear existing piece
        const existing = square.querySelector('.piece');
        if (existing) {
            square.removeChild(existing);
        }

        const piece = this.game.getPiece(row, col);
        if (piece === PIECE.NONE) return;

        const pieceElement = document.createElement('div');
        pieceElement.className = 'piece';
        pieceElement.draggable = this.canSelectSquare(row, col);

        // Add appropriate classes for piece type
        if (piece === PIECE.WHITE || piece === PIECE.WHITE_KING) {
            pieceElement.classList.add('white');
        } else {
            pieceElement.classList.add('black');
        }

        if (piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING) {
            pieceElement.classList.add('king');
        }

        square.appendChild(pieceElement);
    }

    /**
     * Flips the board view
     */
    flipBoard() {
        this.isFlipped = !this.isFlipped;
        this.boardElement.classList.toggle('flipped');
        this.render();
    }

    /**
     * Updates the board state and re-renders
     */
    update() {
        this.clearSelection();
        this.render();
    }

    /**
     * Notifies move listeners
     * @param {Object} move 
     */
    notifyMoveListeners(move) {
        // Event dispatch for move made
        const event = new CustomEvent('moveMade', {
            detail: {
                move: move,
                notation: this.game.getMoveNotation(move),
                gameState: this.game.gameState
            }
        });
        this.boardElement.dispatchEvent(event);
    }
}
