/**
 * International Draughts AI Engine
 * @author codewithheck
 * Created: 2025-06-17 05:44:46 UTC
 */

import OpeningBook from '../utils/opening-book.js';
import {
    AI_PARAMS,
    PIECE_VALUE,
    POSITION_VALUE,
    PIECE,
    PLAYER,
    BOARD_SIZE,
    DIRECTIONS
} from './constants.js';

class TranspositionTable {
    constructor(maxSize) {
        this.table = new Map();
        this.maxSize = maxSize;
        this.hits = 0;
        this.misses = 0;
        this.level = 1;
    }

    generateKey(position) {
        return position.pieces.map(row => 
            row.join('')
        ).join('') + position.currentPlayer;
    }

    store(key, depth, value, type, bestMove) {
        if (this.table.size >= this.maxSize) {
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

    lookup(key, depth, alpha, beta) {
        const entry = this.table.get(key);
        
        if (!entry) {
            this.misses++;
            return null;
        }

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

    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.table.entries()) {
            if (now - entry.timestamp > AI_PARAMS.CACHE.RETENTION_TIME[this.level]) {
                this.table.delete(key);
            }
        }
    }

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
        this.level = 1;
        this.cache = new TranspositionTable(AI_PARAMS.CACHE.MAX_SIZE);
        this.openingBook = null;
        this.nodeCount = 0;
        this.lastEvaluation = null;
    }

    async initialize() {
        try {
            this.openingBook = await OpeningBook.getInstance();
            console.log('AI initialized with opening book');
        } catch (error) {
            console.error('Failed to initialize opening book:', error);
            this.openingBook = null;
        }
    }

    setDifficulty(level) {
        this.level = Math.min(Math.max(1, level), 6);
        this.cache.level = this.level;
        console.log(`AI difficulty set to level ${this.level}`);
    }

    async getMove(position) {
        this.nodeCount = 0;
        const startTime = Date.now();

        if (this.openingBook && this.isInOpeningBook(position)) {
            const bookMove = this.getOpeningBookMove(position);
            if (bookMove) {
                console.log('Using opening book move');
                return bookMove;
            }
        }

        let bestMove = null;
        let bestScore = -Infinity;
        const maxDepth = AI_PARAMS.MAX_DEPTH[this.level];

        for (let depth = 1; depth <= maxDepth; depth++) {
            const result = await this.iterativeSearch(position, depth, startTime);
            if (result.timeout) {
                console.log(`Search timeout at depth ${depth}`);
                break;
            }

            bestMove = result.move;
            bestScore = result.score;

            if (!this.shouldContinueSearch(startTime, position)) {
                console.log(`Stopping search at depth ${depth}`);
                break;
            }
        }

        this.lastEvaluation = {
            score: bestScore,
            depth: maxDepth,
            nodes: this.nodeCount,
            time: Date.now() - startTime
        };

        this.cache.cleanup(); // <-- ADDED: Clean up cache after each move search

        return bestMove;
    }

    async iterativeSearch(position, depth, startTime) {
        const alpha = -Infinity;
        const beta = Infinity;
        let bestMove = null;
        let bestScore = -Infinity;

        if (this.isTimeExceeded(startTime, position)) {
            return { move: bestMove, score: bestScore, timeout: true };
        }

        if (this.nodeCount % 1000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }

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

        this.cache.store(key, depth, bestScore, 
            bestScore <= alpha ? AI_PARAMS.CACHE.ENTRY_TYPES.UPPER_BOUND :
            bestScore >= beta ? AI_PARAMS.CACHE.ENTRY_TYPES.LOWER_BOUND :
            AI_PARAMS.CACHE.ENTRY_TYPES.EXACT,
            bestMove
        );

        return { move: bestMove, score: bestScore, timeout: false };
    }

    negamax(position, depth, alpha, beta, startTime) {
        this.nodeCount++;

        if (this.isTimeExceeded(startTime, position)) {
            return 0;
        }

        const key = this.cache.generateKey(position);
        const cachedResult = this.cache.lookup(key, depth, alpha, beta);
        if (cachedResult) {
            return cachedResult.value;
        }

        if (depth === 0) {
            return this.quiescenceSearch(position, alpha, beta, 
                AI_PARAMS.QUIESCENCE_DEPTH[this.level], startTime);
        }

        const moves = this.generateMoves(position);
        
        if (moves.length === 0) {
            return -Infinity;
        }

        let bestScore = -Infinity;
        for (const move of moves) {
            const newPosition = this.makeMove(position, move);
            const score = -this.negamax(newPosition, depth - 1, -beta, -alpha, startTime);
            
            bestScore = Math.max(bestScore, score);
            alpha = Math.max(alpha, score);
            
            if (alpha >= beta) break;
        }

        this.cache.store(key, depth, bestScore,
            bestScore <= alpha ? AI_PARAMS.CACHE.ENTRY_TYPES.UPPER_BOUND :
            bestScore >= beta ? AI_PARAMS.CACHE.ENTRY_TYPES.LOWER_BOUND :
            AI_PARAMS.CACHE.ENTRY_TYPES.EXACT,
            null
        );

        return bestScore;
    }

    quiescenceSearch(position, alpha, beta, depth, startTime) {
        this.nodeCount++;

        const standPat = this.evaluatePosition(position);
        if (standPat >= beta) return beta;
        alpha = Math.max(alpha, standPat);

        if (depth === 0 || this.isTimeExceeded(startTime, position)) {
            return standPat;
        }

        const captureMoves = this.generateCaptureMoves(position);
        
        for (const move of captureMoves) {
            const newPosition = this.makeMove(position, move);
            const score = -this.quiescenceSearch(newPosition, -beta, -alpha, depth - 1, startTime);
            
            if (score >= beta) return beta;
            alpha = Math.max(alpha, score);
        }

        return alpha;
    }

    evaluatePosition(position) {
        let score = 0;

        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                const piece = position.pieces[i][j];
                if (piece !== PIECE.NONE) {
                    score += PIECE_VALUE[piece];
                    
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

    shouldContinueSearch(startTime, position) {
        const elapsed = Date.now() - startTime;
        const baseTime = AI_PARAMS.ITERATIVE_DEEPENING.TIME_ALLOCATION[this.level];
        const complexity = this.assessPositionComplexity(position);
        const maxTime = baseTime * AI_PARAMS.ITERATIVE_DEEPENING.COMPLEX_POSITION_MULTIPLIER[this.level];
        
        return elapsed < maxTime * complexity;
    }

    assessPositionComplexity(position) {
        const moves = this.generateMoves(position);
        const captures = moves.filter(move => move.captures.length > 0);
        const materialCount = this.countMaterial(position);
        
        let complexity = 1.0;
        
        if (captures.length > 2) complexity += 0.2;
        if (materialCount < 10) complexity += 0.3;
        if (moves.length > 15) complexity += 0.2;
        
        return Math.min(1.5, complexity);
    }

    isInOpeningBook(position) {
        return this.openingBook && this.openingBook.getOpeningMoves(position).length > 0;
    }

    getOpeningBookMove(position) {
        if (!this.openingBook) return null;
        
        const moves = this.openingBook.getOpeningMoves(position);
        if (!moves.length) return null;

        const randomization = AI_PARAMS.OPENING_BOOK.RANDOMIZATION[this.level];
        if (Math.random() < randomization) {
            return moves[Math.floor(Math.random() * moves.length)];
        }
        
        return moves[0];
    }

    generateMoves(position) {
        const moves = [];
        const captures = this.generateCaptureMoves(position);
        
        if (captures.length > 0) {
            return captures;
        }

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

        captures.sort((a, b) => b.captures.length - a.captures.length);

        if (captures.length > 0) {
            const maxLength = captures[0].captures.length;
            return captures.filter(move => move.captures.length === maxLength);
        }

        return captures;
    }

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

                const newPosition = this.makeMove(position, {
                    from: { row, col },
                    to: { row: jumpRow, col: jumpCol },
                    captures: [...currentCaptures, { row: captureRow, col: captureCol }]
                });

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

        if (!captureFound && currentCaptures.length > 0) {
            captures.push({
                from: { row: visitedSquares[0].row, col: visitedSquares[0].col },
                to: { row, col },
                captures: currentCaptures
            });
        }
    }

    makeMove(position, move) {
        const newPosition = {
            pieces: position.pieces.map(row => [...row]),
            currentPlayer: position.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        };

        const piece = newPosition.pieces[move.from.row][move.from.col];
        newPosition.pieces[move.from.row][move.from.col] = PIECE.NONE;
        newPosition.pieces[move.to.row][move.to.col] = piece;

        for (const capture of move.captures) {
            newPosition.pieces[capture.row][capture.col] = PIECE.NONE;
        }

        if (this.shouldPromote(piece, move.to.row)) {
            newPosition.pieces[move.to.row][move.to.col] = 
                piece === PIECE.WHITE ? PIECE.WHITE_KING : PIECE.BLACK_KING;
        }

        return newPosition;
    }

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

    isTimeExceeded(startTime, position) {
        const elapsed = Date.now() - startTime;
        const baseTime = AI_PARAMS.ITERATIVE_DEEPENING.TIME_ALLOCATION[this.level];
        const complexity = this.assessPositionComplexity(position);
        const maxTime = baseTime * AI_PARAMS.ITERATIVE_DEEPENING.COMPLEX_POSITION_MULTIPLIER[this.level];
        
        return elapsed >= maxTime * complexity;
    }

    isValidSquare(row, col) {
        return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
    }

    isPieceOfCurrentPlayer(piece, currentPlayer) {
        if (currentPlayer === PLAYER.WHITE) {
            return piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        } else {
            return piece === PIECE.BLACK || piece === PIECE.BLACK_KING;
        }
    }

    isOpponentPiece(piece, currentPlayer) {
        if (currentPlayer === PLAYER.WHITE) {
            return piece === PIECE.BLACK || piece === PIECE.BLACK_KING;
        } else {
            return piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        }
    }

    isSquareVisited(visitedSquares, row, col) {
        return visitedSquares.some(square => square.row === row && square.col === col);
    }

    shouldPromote(piece, row) {
        return (piece === PIECE.WHITE && row === 0) || 
               (piece === PIECE.BLACK && row === BOARD_SIZE - 1);
    }

    getLastEvaluation() {
        return this.lastEvaluation;
    }
}
