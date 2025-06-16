/**
 * International Draughts AI Engine
 * @author CodeWithHeck
 * Created: 2025-06-16 18:52:59 UTC
 */

import {
    AI_PARAMS,
    PIECE_VALUE,
    POSITION_VALUE,
    PIECE,
    PLAYER,
    BOARD_SIZE,
    SQUARE_NUMBERS
} from './constants.js';

class TranspositionTable {
    constructor(maxSize) {
        this.table = new Map();
        this.maxSize = maxSize;
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * Generates a unique key for a position
     * @param {Object} position - The board position
     * @returns {string} A unique hash key
     */
    generateKey(position) {
        return position.pieces.map(row => 
            row.join('')
        ).join('') + position.currentPlayer;
    }

    /**
     * Stores a position evaluation in the cache
     * @param {string} key - Position hash
     * @param {number} depth - Search depth
     * @param {number} value - Position evaluation
     * @param {number} type - Entry type (EXACT, LOWER_BOUND, UPPER_BOUND)
     * @param {Object} bestMove - Best move found
     */
    store(key, depth, value, type, bestMove) {
        if (this.table.size >= this.maxSize) {
            // Remove oldest entries if cache is full
            const oldestKey = this.table.keys().next().value;
            this.table.delete(oldestKey);
        }

        this.table.set(key, {
            depth,
            value,
            type,
            bestMove,
            timestamp: Date.now()
        });
    }

    /**
     * Retrieves a cached position evaluation
     * @param {string} key - Position hash
     * @param {number} depth - Required search depth
     * @param {number} alpha - Alpha value for alpha-beta pruning
     * @param {number} beta - Beta value for alpha-beta pruning
     * @returns {Object|null} Cached entry if valid
     */
    lookup(key, depth, alpha, beta) {
        const entry = this.table.get(key);
        
        if (!entry) {
            this.misses++;
            return null;
        }

        // Check if entry is still valid based on retention time
        const age = Date.now() - entry.timestamp;
        if (age > AI_PARAMS.CACHE.RETENTION_TIME[this.level]) {
            this.table.delete(key);
            return null;
        }

        if (entry.depth >= depth) {
            this.hits++;
            if (entry.type === AI_PARAMS.CACHE.ENTRY_TYPES.EXACT) {
                return entry;
            }
            if (entry.type === AI_PARAMS.CACHE.ENTRY_TYPES.LOWER_BOUND && entry.value >= beta) {
                return entry;
            }
            if (entry.type === AI_PARAMS.CACHE.ENTRY_TYPES.UPPER_BOUND && entry.value <= alpha) {
                return entry;
            }
        }

        return null;
    }

    /**
     * Cleans expired entries from the cache
     */
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.table.entries()) {
            if (now - entry.timestamp > AI_PARAMS.CACHE.RETENTION_TIME[this.level]) {
                this.table.delete(key);
            }
        }
    }

    /**
     * Returns cache statistics
     */
    getStats() {
        return {
            size: this.table.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: this.hits / (this.hits + this.misses || 1)
        };
    }
}

export class AI {
    constructor() {
        this.level = 1; // Default to beginner
        this.cache = new TranspositionTable(AI_PARAMS.CACHE.MAX_SIZE);
        this.openingBook = new Map(); // Will be initialized with opening positions
        this.nodeCount = 0;
        this.lastEvaluation = null;
        this.initializeOpeningBook();
    }

    /**
     * Sets the AI difficulty level
     * @param {number} level - Difficulty level (1-6)
     */
    setDifficulty(level) {
        this.level = Math.min(Math.max(1, level), 6);
        this.cache.level = this.level;
    }

    /**
     * Gets the best move for the current position
     * @param {Object} position - Current board position
     * @returns {Promise<Object>} Best move found
     */
    async getMove(position) {
        this.nodeCount = 0;
        const startTime = Date.now();

        // Check opening book first
        if (this.isInOpeningBook(position)) {
            return this.getOpeningBookMove(position);
        }

        // Start iterative deepening
        let bestMove = null;
        let bestScore = -Infinity;
        const maxDepth = AI_PARAMS.MAX_DEPTH[this.level];

        for (let depth = 1; depth <= maxDepth; depth++) {
            const result = await this.iterativeSearch(position, depth, startTime);
            if (result.timeout) break;

            bestMove = result.move;
            bestScore = result.score;

            // Check if we should continue searching based on time and complexity
            if (!this.shouldContinueSearch(startTime, position)) break;
        }

        this.lastEvaluation = {
            score: bestScore,
            depth: maxDepth,
            nodes: this.nodeCount,
            time: Date.now() - startTime
        };

        return bestMove;
    }

    /**
     * Performs iterative deepening search
     * @param {Object} position - Current position
     * @param {number} depth - Current depth
     * @param {number} startTime - Search start time
     * @returns {Object} Best move and score
     */
    async iterativeSearch(position, depth, startTime) {
        const alpha = -Infinity;
        const beta = Infinity;
        let bestMove = null;
        let bestScore = -Infinity;

        // Check time allocation
        if (this.isTimeExceeded(startTime, position)) {
            return { move: bestMove, score: bestScore, timeout: true };
        }

        // Allow UI updates every 1000 nodes
        if (this.nodeCount % 1000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        // Check transposition table
        const key = this.cache.generateKey(position);
        const cachedResult = this.cache.lookup(key, depth, alpha, beta);
        if (cachedResult) {
            return {
                move: cachedResult.bestMove,
                score: cachedResult.value,
                timeout: false
            };
        }

        const moves = this.generateMoves(position);
        
        for (const move of moves) {
            const newPosition = this.makeMove(position, move);
            const score = -this.negamax(newPosition, depth - 1, -beta, -alpha, startTime);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
            alpha = Math.max(alpha, score);
            
            if (alpha >= beta) break;
        }

        // Store result in transposition table
        this.cache.store(key, depth, bestScore, 
            bestScore <= alpha ? AI_PARAMS.CACHE.ENTRY_TYPES.UPPER_BOUND :
            bestScore >= beta ? AI_PARAMS.CACHE.ENTRY_TYPES.LOWER_BOUND :
            AI_PARAMS.CACHE.ENTRY_TYPES.EXACT,
            bestMove
        );

        return { move: bestMove, score: bestScore, timeout: false };
    }

    /**
     * Negamax algorithm with alpha-beta pruning
     * @param {Object} position - Current position
     * @param {number} depth - Remaining depth
     * @param {number} alpha - Alpha value
     * @param {number} beta - Beta value
     * @param {number} startTime - Search start time
     * @returns {number} Position evaluation
     */
    negamax(position, depth, alpha, beta, startTime) {
        this.nodeCount++;

        // Check time allocation
        if (this.isTimeExceeded(startTime, position)) {
            return 0;
        }

        // Check transposition table
        const key = this.cache.generateKey(position);
        const cachedResult = this.cache.lookup(key, depth, alpha, beta);
        if (cachedResult) {
            return cachedResult.value;
        }

        // Leaf node evaluation
        if (depth === 0) {
            return this.quiescenceSearch(position, alpha, beta, 
                AI_PARAMS.QUIESCENCE_DEPTH[this.level], startTime);
        }

        const moves = this.generateMoves(position);
        
        // Check for game end
        if (moves.length === 0) {
            return -Infinity; // Loss
        }

        let bestScore = -Infinity;
        for (const move of moves) {
            const newPosition = this.makeMove(position, move);
            const score = -this.negamax(newPosition, depth - 1, -beta, -alpha, startTime);
            
            bestScore = Math.max(bestScore, score);
            alpha = Math.max(alpha, score);
            
            if (alpha >= beta) break;
        }

        // Store position in cache
        this.cache.store(key, depth, bestScore,
            bestScore <= alpha ? AI_PARAMS.CACHE.ENTRY_TYPES.UPPER_BOUND :
            bestScore >= beta ? AI_PARAMS.CACHE.ENTRY_TYPES.LOWER_BOUND :
            AI_PARAMS.CACHE.ENTRY_TYPES.EXACT,
            null
        );

        return bestScore;
    }

    /**
     * Quiescence search to evaluate tactical positions
     * @param {Object} position - Current position
     * @param {number} alpha - Alpha value
     * @param {number} beta - Beta value
     * @param {number} depth - Maximum quiescence depth
     * @param {number} startTime - Search start time
     * @returns {number} Position evaluation
     */
    quiescenceSearch(position, alpha, beta, depth, startTime) {
        this.nodeCount++;

        // Standing pat
        const standPat = this.evaluatePosition(position);
        if (standPat >= beta) return beta;
        alpha = Math.max(alpha, standPat);

        if (depth === 0 || this.isTimeExceeded(startTime, position)) {
            return standPat;
        }

        // Only consider capture moves
        const captureMoves = this.generateCaptureMoves(position);
        
        for (const move of captureMoves) {
            const newPosition = this.makeMove(position, move);
            const score = -this.quiescenceSearch(newPosition, -beta, -alpha, depth - 1, startTime);
            
            if (score >= beta) return beta;
            alpha = Math.max(alpha, score);
        }

        return alpha;
    }

    /**
     * Evaluates a position
     * @param {Object} position - Position to evaluate
     * @returns {number} Evaluation score
     */
    evaluatePosition(position) {
        let score = 0;

        // Material evaluation
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                const piece = position.pieces[i][j];
                if (piece !== PIECE.NONE) {
                    score += PIECE_VALUE[piece];
                    
                    // Position evaluation
                    const isCenter = (i >= 3 && i <= 6) && (j >= 3 && j <= 6);
                    const isEdge = i === 0 || i === 9 || j === 0 || j === 9;
                    const isBackRow = (piece === PIECE.WHITE && i === 9) || 
                                    (piece === PIECE.BLACK && i === 0);
                    const isNearPromotion = (piece === PIECE.WHITE && i <= 2) ||
                                          (piece === PIECE.BLACK && i >= 7);

                    if (isCenter) score += POSITION_VALUE.CENTER;
                    if (isEdge) score += POSITION_VALUE.EDGE;
                    if (isBackRow) score += POSITION_VALUE.BACK_ROW;
                    if (isNearPromotion) score += POSITION_VALUE.PROMOTION;
                }
            }
        }

        return position.currentPlayer === PLAYER.WHITE ? score : -score;
    }

    /**
     * Checks if more time should be spent on the position
     * @param {number} startTime - Search start time
     * @param {Object} position - Current position
     * @returns {boolean} Whether to continue searching
     */
    shouldContinueSearch(startTime, position) {
        const elapsed = Date.now() - startTime;
        const baseTime = AI_PARAMS.ITERATIVE_DEEPENING.TIME_ALLOCATION[this.level];
        const complexity = this.assessPositionComplexity(position);
        const maxTime = baseTime * AI_PARAMS.ITERATIVE_DEEPENING.COMPLEX_POSITION_MULTIPLIER[this.level];
        
        return elapsed < maxTime * complexity;
    }

    /**
     * Assesses position complexity
     * @param {Object} position - Position to assess
     * @returns {number} Complexity factor (0.5-1.5)
     */
    assessPositionComplexity(position) {
        const moves = this.generateMoves(position);
        const captures = moves.filter(move => move.captures.length > 0);
        const materialCount = this.countMaterial(position);
        
        let complexity = 1.0;
        
        // More complex if many captures available
        if (captures.length > 2) complexity += 0.2;
        
        // More complex in endgame positions
        if (materialCount < 10) complexity += 0.3;
        
        // More complex with many possible moves
        if (moves.length > 15) complexity += 0.2;
        
        return Math.min(1.5, complexity);
    }

    /**
     * Initializes the opening book
     */
    initializeOpeningBook() {
        // Implementation of opening book initialization
        // This would load pre-calculated positions and their evaluated best moves
    }

    /**
     * Checks if a position is in the opening book
     * @param {Object} position - Position to check
     * @returns {boolean} Whether position is in book
     */
    isInOpeningBook(position) {
        const key = this.cache.generateKey(position);
        return this.openingBook.has(key);
    }

    /**
     * Gets a move from the opening book
     * @param {Object} position - Current position
     * @returns {Object} Selected book move
     */
    getOpeningBookMove(position) {
        const key = this.cache.generateKey(position);
        const bookMoves = this.openingBook.get(key);
        
        // Apply randomization based on level
        const randomization = AI_PARAMS.OPENING_BOOK.RANDOMIZATION[this.level];
        if (Math.random() < randomization) {
            return bookMoves[Math.floor(Math.random() * bookMoves.length)];
        }
        
        // Otherwise return the best book move
        return bookMoves[0];
    }

    /**
     * Gets the last evaluation statistics
     * @returns {Object} Evaluation statistics
     */
    getLastEvaluation() {
        return this.lastEvaluation;
    }

    // Additional helper methods would be implemented here:
    // - generateMoves()
    // - generateCaptureMoves()
    // - makeMove()
    // - countMaterial()
    // - isTimeExceeded()
        /**
     * Generates all legal moves for the current position
     * @param {Object} position - Current position
     * @returns {Array} Array of legal moves
     */
    generateMoves(position) {
        const moves = [];
        const captures = this.generateCaptureMoves(position);
        
        // If captures are available, they are mandatory
        if (captures.length > 0) {
            return captures;
        }

        // Generate normal moves if no captures are available
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                const piece = position.pieces[i][j];
                if (this.isPieceOfCurrentPlayer(piece, position.currentPlayer)) {
                    this.addNormalMovesForPiece(moves, position, i, j);
                }
            }
        }

        return moves;
    }

    /**
     * Generates all capture moves for the current position
     * @param {Object} position - Current position
     * @returns {Array} Array of capture moves
     */
    generateCaptureMoves(position) {
        const captures = [];
        
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                const piece = position.pieces[i][j];
                if (this.isPieceOfCurrentPlayer(piece, position.currentPlayer)) {
                    this.addCaptureMovesForPiece(captures, position, i, j, [], []);
                }
            }
        }

        // Sort captures by length (most captures first)
        captures.sort((a, b) => b.captures.length - a.captures.length);

        // If maximum capture rule is in effect, only return longest captures
        if (captures.length > 0) {
            const maxLength = captures[0].captures.length;
            return captures.filter(move => move.captures.length === maxLength);
        }

        return captures;
    }

    /**
     * Adds all possible normal moves for a piece
     * @param {Array} moves - Array to add moves to
     * @param {Object} position - Current position
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     */
    addNormalMovesForPiece(moves, position, row, col) {
        const piece = position.pieces[row][col];
        const directions = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING ?
            DIRECTIONS.KING_MOVES :
            (position.currentPlayer === PLAYER.WHITE ? DIRECTIONS.WHITE_MOVES : DIRECTIONS.BLACK_MOVES);

        for (const dir of directions) {
            const newRow = row + dir.dy;
            const newCol = col + dir.dx;

            if (this.isValidSquare(newRow, newCol) && 
                position.pieces[newRow][newCol] === PIECE.NONE) {
                moves.push({
                    from: { row, col },
                    to: { row: newRow, col: newCol },
                    captures: []
                });
            }
        }
    }

    /**
     * Recursively adds all possible capture moves for a piece
     * @param {Array} captures - Array to add captures to
     * @param {Object} position - Current position
     * @param {number} row - Current row
     * @param {number} col - Current column
     * @param {Array} currentCaptures - Captures made so far
     * @param {Array} visitedSquares - Squares visited in this sequence
     */
    addCaptureMovesForPiece(captures, position, row, col, currentCaptures, visitedSquares) {
        const piece = position.pieces[row][col];
        const directions = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING ?
            DIRECTIONS.KING_MOVES :
            (position.currentPlayer === PLAYER.WHITE ? DIRECTIONS.WHITE_MOVES : DIRECTIONS.BLACK_MOVES);

        let captureFound = false;

        for (const dir of directions) {
            const jumpRow = row + 2 * dir.dy;
            const jumpCol = col + 2 * dir.dx;
            const captureRow = row + dir.dy;
            const captureCol = col + dir.dx;

            if (this.isValidSquare(jumpRow, jumpCol) &&
                this.isOpponentPiece(position.pieces[captureRow][captureCol], position.currentPlayer) &&
                position.pieces[jumpRow][jumpCol] === PIECE.NONE &&
                !this.isSquareVisited(visitedSquares, jumpRow, jumpCol)) {
                
                captureFound = true;

                // Make the capture
                const newPosition = this.makeMove(position, {
                    from: { row, col },
                    to: { row: jumpRow, col: jumpCol },
                    captures: [...currentCaptures, { row: captureRow, col: captureCol }]
                });

                // Continue looking for more captures
                this.addCaptureMovesForPiece(
                    captures,
                    newPosition,
                    jumpRow,
                    jumpCol,
                    [...currentCaptures, { row: captureRow, col: captureCol }],
                    [...visitedSquares, { row, col }]
                );
            }
        }

        // If no more captures possible, add the sequence
        if (!captureFound && currentCaptures.length > 0) {
            captures.push({
                from: { row: visitedSquares[0].row, col: visitedSquares[0].col },
                to: { row, col },
                captures: currentCaptures
            });
        }
    }

    /**
     * Makes a move on a position
     * @param {Object} position - Current position
     * @param {Object} move - Move to make
     * @returns {Object} New position after move
     */
    makeMove(position, move) {
        const newPosition = {
            pieces: position.pieces.map(row => [...row]),
            currentPlayer: position.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        };

        const piece = newPosition.pieces[move.from.row][move.from.col];
        newPosition.pieces[move.from.row][move.from.col] = PIECE.NONE;
        newPosition.pieces[move.to.row][move.to.col] = piece;

        // Remove captured pieces
        for (const capture of move.captures) {
            newPosition.pieces[capture.row][capture.col] = PIECE.NONE;
        }

        // Handle promotions
        if (this.shouldPromote(piece, move.to.row)) {
            newPosition.pieces[move.to.row][move.to.col] = 
                piece === PIECE.WHITE ? PIECE.WHITE_KING : PIECE.BLACK_KING;
        }

        return newPosition;
    }

    /**
     * Counts total material on the board
     * @param {Object} position - Position to evaluate
     * @returns {number} Total piece count
     */
    countMaterial(position) {
        let count = 0;
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (position.pieces[i][j] !== PIECE.NONE) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Checks if time allocated for search has been exceeded
     * @param {number} startTime - Search start time
     * @param {Object} position - Current position
     * @returns {boolean} Whether time is exceeded
     */
    isTimeExceeded(startTime, position) {
        const elapsed = Date.now() - startTime;
        const baseTime = AI_PARAMS.ITERATIVE_DEEPENING.TIME_ALLOCATION[this.level];
        const complexity = this.assessPositionComplexity(position);
        const maxTime = baseTime * AI_PARAMS.ITERATIVE_DEEPENING.COMPLEX_POSITION_MULTIPLIER[this.level];
        
        return elapsed >= maxTime * complexity;
    }

    /**
     * Helper method to check if a square is valid
     * @param {number} row - Row to check
     * @param {number} col - Column to check
     * @returns {boolean} Whether square is valid
     */
    isValidSquare(row, col) {
        return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
    }

    /**
     * Helper method to check if a piece belongs to current player
     * @param {number} piece - Piece to check
     * @param {number} currentPlayer - Current player
     * @returns {boolean} Whether piece belongs to current player
     */
    isPieceOfCurrentPlayer(piece, currentPlayer) {
        if (currentPlayer === PLAYER.WHITE) {
            return piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        } else {
            return piece === PIECE.BLACK || piece === PIECE.BLACK_KING;
        }
    }

    /**
     * Helper method to check if a piece belongs to opponent
     * @param {number} piece - Piece to check
     * @param {number} currentPlayer - Current player
     * @returns {boolean} Whether piece belongs to opponent
     */
    isOpponentPiece(piece, currentPlayer) {
        if (currentPlayer === PLAYER.WHITE) {
            return piece === PIECE.BLACK || piece === PIECE.BLACK_KING;
        } else {
            return piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        }
    }

    /**
     * Helper method to check if a square has been visited
     * @param {Array} visitedSquares - Array of visited squares
     * @param {number} row - Row to check
     * @param {number} col - Column to check
     * @returns {boolean} Whether square has been visited
     */
    isSquareVisited(visitedSquares, row, col) {
        return visitedSquares.some(square => square.row === row && square.col === col);
    }

    /**
     * Helper method to check if a piece should be promoted
     * @param {number} piece - Piece to check
     * @param {number} row - Row where piece landed
     * @returns {boolean} Whether piece should be promoted
     */
    shouldPromote(piece, row) {
        return (piece === PIECE.WHITE && row === 0) || 
               (piece === PIECE.BLACK && row === BOARD_SIZE - 1);
    }
}
}
