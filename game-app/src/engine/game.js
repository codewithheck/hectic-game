/**
 * International Draughts Game Logic Implementation
 * @author codewithheck
 * Created: 2025-06-16 19:13:41 UTC
 * FLIPPED BOARD VERSION
 */

import {
    BOARD_SIZE,
    PIECE,
    PLAYER,
    GAME_STATE,
    SQUARE_NUMBERS,
    FEN,
    GAME_MODE,
    DIRECTIONS,
    isDarkSquare
} from './constants.js';

export class Game {
    constructor() {
        this.reset();
    }

    /**
     * Resets the game to initial state
     */
    reset() {
        this.pieces = Array(BOARD_SIZE).fill(null)
            .map(() => Array(BOARD_SIZE).fill(PIECE.NONE));
        this.currentPlayer = PLAYER.WHITE;
        this.gameState = GAME_STATE.ONGOING;
        this.moveHistory = [];
        this.capturedPieces = {
            [PLAYER.WHITE]: [],
            [PLAYER.BLACK]: []
        };
        this.gameMode = GAME_MODE.NORMAL;
        this.setupInitialPosition();
    }

    /**
     * Sets up the initial position for International Draughts on FLIPPED BOARD
     * 20 pieces per player, only on dark squares
     * On flipped board: dark squares are where (row + col) % 2 === 0
     */
    setupInitialPosition() {
        // Clear the board first
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                this.pieces[row][col] = PIECE.NONE;
            }
        }

        // Place black pieces (first 4 rows, dark squares only)
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                // Only place on dark squares (flipped board: row + col is even)
                if (isDarkSquare(row, col)) {
                    this.pieces[row][col] = PIECE.BLACK;
                }
            }
        }

        // Place white pieces (last 4 rows, dark squares only)
        for (let row = 6; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                // Only place on dark squares (flipped board: row + col is even)
                if (isDarkSquare(row, col)) {
                    this.pieces[row][col] = PIECE.WHITE;
                }
            }
        }

        console.log('Initial position set up with 20 pieces each on flipped board');
    }

    /**
     * Gets piece at position
     * @param {number} row 
     * @param {number} col 
     * @returns {number}
     */
    getPiece(row, col) {
        if (this.isValidPosition(row, col)) {
            return this.pieces[row][col];
        }
        return PIECE.NONE;
    }

    /**
     * Sets piece at position
     * @param {number} row 
     * @param {number} col 
     * @param {number} piece 
     */
    setPiece(row, col, piece) {
        if (this.isValidPosition(row, col)) {
            this.pieces[row][col] = piece;
        }
    }

    /**
     * Makes a move if valid
     * @param {Object} move Move object containing from and to positions
     * @returns {boolean} Whether move was successful
     */
    makeMove(move) {
        if (!this.isValidMove(move)) {
            console.log('Invalid move attempted:', move);
            return false;
        }

        const piece = this.getPiece(move.from.row, move.from.col);
        
        // Record move in history
        const moveRecord = {
            from: { ...move.from },
            to: { ...move.to },
            piece: piece,
            captures: move.captures ? [...move.captures] : [],
            notation: this.getMoveNotation(move)
        };
        this.moveHistory.push(moveRecord);

        // Execute move
        this.setPiece(move.from.row, move.from.col, PIECE.NONE);
        this.setPiece(move.to.row, move.to.col, piece);

        // Handle captures
        if (move.captures) {
            move.captures.forEach(capture => {
                const capturedPiece = this.getPiece(capture.row, capture.col);
                this.capturedPieces[this.currentPlayer].push(capturedPiece);
                this.setPiece(capture.row, capture.col, PIECE.NONE);
            });
        }

        // Handle promotion
        if (this.shouldPromote(piece, move.to.row)) {
            this.setPiece(move.to.row, move.to.col,
                piece === PIECE.WHITE ? PIECE.WHITE_KING : PIECE.BLACK_KING);
        }

        // Switch player if not in edit mode
        if (this.gameMode === GAME_MODE.NORMAL) {
            this.currentPlayer = this.currentPlayer === PLAYER.WHITE ? 
                PLAYER.BLACK : PLAYER.WHITE;
        }

        // Update game state
        this.updateGameState();

        console.log(`Move made: ${moveRecord.notation}, now ${this.currentPlayer === PLAYER.WHITE ? 'White' : 'Black'} to move`);
        return true;
    }

    /**
     * Validates if a move is legal
     * @param {Object} move 
     * @returns {boolean}
     */
    isValidMove(move) {
        // Check if positions are valid
        if (!this.isValidPosition(move.from.row, move.from.col) ||
            !this.isValidPosition(move.to.row, move.to.col)) {
            return false;
        }

        // Check if moving player's piece
        const piece = this.getPiece(move.from.row, move.from.col);
        if (!this.isPieceOfCurrentPlayer(piece)) {
            return false;
        }

        // Check if destination is empty
        if (this.getPiece(move.to.row, move.to.col) !== PIECE.NONE) {
            return false;
        }

        // Check if destination is on dark square (flipped board)
        if (!isDarkSquare(move.to.row, move.to.col)) {
            return false;
        }

        // Check if move is in list of legal moves
        const legalMoves = this.getLegalMoves();
        return legalMoves.some(legalMove =>
            legalMove.from.row === move.from.row &&
            legalMove.from.col === move.from.col &&
            legalMove.to.row === move.to.row &&
            legalMove.to.col === move.to.col
        );
    }

    /**
     * Gets all available capture moves
     * @returns {Array} Array of capture moves
     */
    getAvailableCaptures() {
        const captures = [];
        
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = this.getPiece(row, col);
                if (this.isPieceOfCurrentPlayer(piece)) {
                    this.findCaptureMoves(captures, row, col, [], []);
                }
            }
        }

        // Sort by number of captures (maximum capture rule)
        captures.sort((a, b) => b.captures.length - a.captures.length);
        
        if (captures.length > 0) {
            const maxCaptures = captures[0].captures.length;
            return captures.filter(move => move.captures.length === maxCaptures);
        }

        return captures;
    }

    /**
     * Gets all normal (non-capture) moves
     * @returns {Array} Array of normal moves
     */
    getNormalMoves() {
        const moves = [];
        
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = this.getPiece(row, col);
                if (this.isPieceOfCurrentPlayer(piece)) {
                    this.findNormalMoves(moves, row, col);
                }
            }
        }

        return moves;
    }

    /**
     * Gets all legal moves for current player
     * @returns {Array} Array of legal moves
     */
    getLegalMoves() {
        const captures = this.getAvailableCaptures();
        if (captures.length > 0) {
            return captures;
        }
        return this.getNormalMoves();
    }

    /**
     * Finds all normal moves for a piece
     * @param {Array} moves Array to store moves
     * @param {number} row Current row
     * @param {number} col Current column
     */
    findNormalMoves(moves, row, col) {
        const piece = this.getPiece(row, col);
        const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
        
        // Get directions based on piece type and player
        const directions = isKing ? DIRECTIONS.KING_MOVES :
            (this.currentPlayer === PLAYER.WHITE ? DIRECTIONS.WHITE_MOVES : DIRECTIONS.BLACK_MOVES);

        for (const dir of directions) {
            const newRow = row + dir.dy;
            const newCol = col + dir.dx;

            if (this.isValidPosition(newRow, newCol) &&
                this.getPiece(newRow, newCol) === PIECE.NONE &&
                isDarkSquare(newRow, newCol)) { // Must be on dark square (flipped board)
                moves.push({
                    from: { row, col },
                    to: { row: newRow, col: newCol },
                    captures: []
                });
            }
        }
    }

    /**
     * Recursively finds all possible capture moves for a piece
     * @param {Array} captures Array to store captures
     * @param {number} row Current row
     * @param {number} col Current column
     * @param {Array} currentCaptures Captures made so far
     * @param {Array} visitedSquares Squares visited in this sequence
     */
    findCaptureMoves(captures, row, col, currentCaptures, visitedSquares) {
        const piece = this.getPiece(row, col);
        const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
        let foundCapture = false;

        // Get directions based on piece type and player
        const directions = isKing ? DIRECTIONS.KING_MOVES :
            (this.currentPlayer === PLAYER.WHITE ? DIRECTIONS.WHITE_MOVES : DIRECTIONS.BLACK_MOVES);

        for (const dir of directions) {
            const captureRow = row + dir.dy;
            const captureCol = col + dir.dx;
            const landingRow = row + 2 * dir.dy;
            const landingCol = col + 2 * dir.dx;

            if (this.isValidCapture(row, col, captureRow, captureCol, landingRow, landingCol, visitedSquares)) {
                foundCapture = true;
                
                // Make temporary capture
                const capturedPiece = this.getPiece(captureRow, captureCol);
                this.setPiece(captureRow, captureCol, PIECE.NONE);
                
                // Continue finding captures from new position
                this.findCaptureMoves(
                    captures,
                    landingRow,
                    landingCol,
                    [...currentCaptures, { row: captureRow, col: captureCol }],
                    [...visitedSquares, { row, col }]
                );
                
                // Undo temporary capture
                this.setPiece(captureRow, captureCol, capturedPiece);
            }
        }

        // If no more captures possible and we made at least one capture, add the sequence
        if (!foundCapture && currentCaptures.length > 0) {
            captures.push({
                from: { row: visitedSquares[0].row, col: visitedSquares[0].col },
                to: { row, col },
                captures: currentCaptures
            });
        }
    }

    /**
     * Checks if a capture move is valid
     * @param {number} fromRow Starting row
     * @param {number} fromCol Starting column
     * @param {number} captureRow Row of captured piece
     * @param {number} captureCol Column of captured piece
     * @param {number} landingRow Landing row
     * @param {number} landingCol Landing column
     * @param {Array} visitedSquares Previously visited squares
     * @returns {boolean}
     */
    isValidCapture(fromRow, fromCol, captureRow, captureCol, landingRow, landingCol, visitedSquares) {
        // Check if landing square is within bounds, empty, and on dark square
        if (!this.isValidPosition(landingRow, landingCol) ||
            this.getPiece(landingRow, landingCol) !== PIECE.NONE ||
            !isDarkSquare(landingRow, landingCol)) { // Must be on dark square (flipped board)
            return false;
        }

        // Check if landing square hasn't been visited
        if (visitedSquares.some(sq => sq.row === landingRow && sq.col === landingCol)) {
            return false;
        }

        // Check if captured square contains opponent's piece
        const capturedPiece = this.getPiece(captureRow, captureCol);
        return this.isOpponentPiece(capturedPiece);
    }

    /**
     * Updates the game state
     */
    updateGameState() {
        if (this.gameMode === GAME_MODE.EDIT) {
            return;
        }

        const legalMoves = this.getLegalMoves();
        
        if (legalMoves.length === 0) {
            this.gameState = this.currentPlayer === PLAYER.WHITE ?
                GAME_STATE.BLACK_WIN : GAME_STATE.WHITE_WIN;
            return;
        }

        if (this.isDrawByRepetition() || this.isDrawByMaterial()) {
            this.gameState = GAME_STATE.DRAW;
            return;
        }

        this.gameState = GAME_STATE.ONGOING;
    }

    /**
     * Checks for draw by threefold repetition
     * @returns {boolean}
     */
    isDrawByRepetition() {
        if (this.moveHistory.length < 6) {
            return false;
        }

        const positions = {};
        positions[this.getFEN()] = 1;

        // Check last 20 moves for threefold repetition
        const start = Math.max(0, this.moveHistory.length - 20);
        for (let i = start; i < this.moveHistory.length; i++) {
            const position = this.getFEN();
            positions[position] = (positions[position] || 0) + 1;
            if (positions[position] >= 3) {
                return true;
            }
        }

        return false;
    }

    /**
     * Checks for draw by insufficient material
     * @returns {boolean}
     */
    isDrawByMaterial() {
        let whiteKings = 0, blackKings = 0;
        let whitePieces = 0, blackPieces = 0;

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = this.getPiece(row, col);
                switch (piece) {
                    case PIECE.WHITE_KING: whiteKings++; break;
                    case PIECE.BLACK_KING: blackKings++; break;
                    case PIECE.WHITE: whitePieces++; break;
                    case PIECE.BLACK: blackPieces++; break;
                }
            }
        }

        // Draw conditions for insufficient material
        if (whitePieces === 0 && blackPieces === 0) {
            if ((whiteKings === 1 && blackKings === 1) ||
                (whiteKings === 2 && blackKings === 1) ||
                (whiteKings === 1 && blackKings === 2)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Gets FEN notation for current position
     * @returns {string}
     */
    getFEN() {
        let fen = this.currentPlayer === PLAYER.WHITE ? 'W:W' : 'B:B';
        let white = [];
        let black = [];

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (isDarkSquare(row, col)) {  // Only dark squares on flipped board
                    const piece = this.getPiece(row, col);
                    const squareNumber = SQUARE_NUMBERS[row * BOARD_SIZE + col];
                    
                    if (piece === PIECE.WHITE || piece === PIECE.WHITE_KING) {
                        white.push(squareNumber + (piece === PIECE.WHITE_KING ? 'K' : ''));
                    } else if (piece === PIECE.BLACK || piece === PIECE.BLACK_KING) {
                        black.push(squareNumber + (piece === PIECE.BLACK_KING ? 'K' : ''));
                    }
                }
            }
        }

        return `${fen}${white.sort((a, b) => a - b).join(',')}:B${black.sort((a, b) => a - b).join(',')}`;
    }

    /**
     * Loads a position from FEN notation
     * @param {string} fen FEN string
     * @returns {boolean} Success
     */
    loadFEN(fen) {
        try {
            // Clear board
            this.pieces = Array(BOARD_SIZE).fill(null)
                .map(() => Array(BOARD_SIZE).fill(PIECE.NONE));

            const [player, white, black] = fen.split(':');
            this.currentPlayer = player === 'W' ? PLAYER.WHITE : PLAYER.BLACK;

            // Process white pieces
            if (white.length > 1) {
                white.substring(1).split(',').forEach(piece => {
                    if (piece) {
                        const isKing = piece.endsWith('K');
                        const number = parseInt(isKing ? piece.slice(0, -1) : piece);
                        const pos = this.getPositionFromNumber(number);
                        this.setPiece(pos.row, pos.col,
                            isKing ? PIECE.WHITE_KING : PIECE.WHITE);
                    }
                });
            }

            // Process black pieces
            if (black.length > 1) {
                black.substring(1).split(',').forEach(piece => {
                    if (piece) {
                        const isKing = piece.endsWith('K');
                        const number = parseInt(isKing ? piece.slice(0, -1) : piece);
                        const pos = this.getPositionFromNumber(number);
                        this.setPiece(pos.row, pos.col,
                            isKing ? PIECE.BLACK_KING : PIECE.BLACK);
                    }
                });
            }

            this.updateGameState();
            return true;
        } catch (e) {
            console.error('Invalid FEN notation:', e);
            return false;
        }
    }

    /**
     * Checks if position is valid
     * @param {number} row 
     * @param {number} col 
     * @returns {boolean}
     */
    isValidPosition(row, col) {
        return row >= 0 && row < BOARD_SIZE && 
               col >= 0 && col < BOARD_SIZE;
    }

    /**
     * Checks if piece belongs to current player
     * @param {number} piece 
     * @returns {boolean}
     */
    isPieceOfCurrentPlayer(piece) {
        return this.currentPlayer === PLAYER.WHITE ?
            (piece === PIECE.WHITE || piece === PIECE.WHITE_KING) :
            (piece === PIECE.BLACK || piece === PIECE.BLACK_KING);
    }

    /**
     * Checks if piece belongs to opponent
     * @param {number} piece 
     * @returns {boolean}
     */
    isOpponentPiece(piece) {
        return this.currentPlayer === PLAYER.WHITE ?
            (piece === PIECE.BLACK || piece === PIECE.BLACK_KING) :
            (piece === PIECE.WHITE || piece === PIECE.WHITE_KING);
    }

    /**
     * Gets board position from square number
     * @param {number} number 
     * @returns {Object}
     */
    getPositionFromNumber(number) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (SQUARE_NUMBERS[row * BOARD_SIZE + col] === number) {
                    return { row, col };
                }
            }
        }
        throw new Error(`Invalid square number: ${number}`);
    }

    /**
     * Gets move notation
     * @param {Object} move 
     * @returns {string}
     */
    getMoveNotation(move) {
        const fromSquare = SQUARE_NUMBERS[move.from.row * BOARD_SIZE + move.from.col];
        const toSquare = SQUARE_NUMBERS[move.to.row * BOARD_SIZE + move.to.col];
        return (move.captures && move.captures.length > 0) ? 
            `${fromSquare}x${toSquare}` : 
            `${fromSquare}-${toSquare}`;
    }

    /**
     * Checks if a piece should be promoted
     * @param {number} piece 
     * @param {number} row 
     * @returns {boolean}
     */
    shouldPromote(piece, row) {
        return (piece === PIECE.WHITE && row === 0) || 
               (piece === PIECE.BLACK && row === BOARD_SIZE - 1);
    }

    /**
     * Creates a deep copy of the game state
     * @returns {Game}
     */
    clone() {
        const newGame = new Game();
        newGame.pieces = this.pieces.map(row => [...row]);
        newGame.currentPlayer = this.currentPlayer;
        newGame.gameState = this.gameState;
        newGame.gameMode = this.gameMode;
        newGame.moveHistory = this.moveHistory.map(move => ({...move}));
        newGame.capturedPieces = {
            [PLAYER.WHITE]: [...this.capturedPieces[PLAYER.WHITE]],
            [PLAYER.BLACK]: [...this.capturedPieces[PLAYER.BLACK]]
        };
        return newGame;
    }
}
