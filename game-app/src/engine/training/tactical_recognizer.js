// src/engine/training/tactical_recognizer.js
// Last updated: 2025-06-14 01:49:01
// Author: codewithheck
// Version: 1.0.0

import { PIECES, getRow, getCol, pieceColor } from '../utils.js';
import { TACTICAL_PATTERNS } from './patterns/tactical_patterns.js';
import { generateMoves } from '../movegen.js';

export class TacticalRecognizer {
    constructor() {
        this.patterns = TACTICAL_PATTERNS;
        this.patternCache = new Map();
        this.moveCache = new Map();
        this.statistics = {
            patternsChecked: 0,
            matchesFound: 0,
            cacheHits: 0
        };
    }

    analyzeTacticalPositions(board, player) {
        const positionKey = this.getPositionKey(board, player);
        
        if (this.patternCache.has(positionKey)) {
            this.statistics.cacheHits++;
            return this.patternCache.get(positionKey);
        }

        const analysis = {
            shots: this.findShots(board, player),
            combinations: this.findCombinations(board, player),
            threats: this.findThreats(board, player),
            tacticalValue: 0,
            timestamp: Date.now(),
            statistics: { ...this.statistics }
        };

        analysis.tacticalValue = this.calculateTacticalValue(analysis);
        this.patternCache.set(positionKey, analysis);
        
        return analysis;
    }

    findShots(board, player) {
        const shots = [];
        const moves = this.getCachedMoves(board, player);

        for (const move of moves) {
            for (const [shotType, pattern] of Object.entries(this.patterns.SHOTS)) {
                this.statistics.patternsChecked++;
                if (this.matchesPattern(board, move, pattern.pattern)) {
                    this.statistics.matchesFound++;
                    shots.push({
                        type: shotType,
                        move: move,
                        pattern: pattern,
                        value: pattern.value,
                        description: this.generateShotDescription(pattern, move)
                    });
                }
            }
        }

        return shots;
    }

    findCombinations(board, player) {
        const combinations = [];
        const moves = this.getCachedMoves(board, player);

        for (const move of moves) {
            if (!move.captures || move.captures.length < 2) continue;

            for (const [comboType, pattern] of Object.entries(this.patterns.COMBINATIONS)) {
                this.statistics.patternsChecked++;
                if (move.captures.length >= pattern.pattern[0].captures) {
                    this.statistics.matchesFound++;
                    combinations.push({
                        type: comboType,
                        move: move,
                        pattern: pattern,
                        value: pattern.value,
                        description: this.generateCombinationDescription(pattern, move)
                    });
                }
            }
        }

        return combinations;
    }

    findThreats(board, player) {
        const threats = [];
        const moves = this.getCachedMoves(board, player);

        for (const move of moves) {
            for (const [threatType, pattern] of Object.entries(this.patterns.THREATS)) {
                this.statistics.patternsChecked++;
                if (this.matchesPattern(board, move, pattern.pattern)) {
                    this.statistics.matchesFound++;
                    threats.push({
                        type: threatType,
                        move: move,
                        pattern: pattern,
                        value: pattern.value,
                        description: this.generateThreatDescription(pattern, move)
                    });
                }
            }
        }

        return threats;
    }

    matchesPattern(board, move, pattern) {
        for (const condition of pattern) {
            if (condition.from && condition.to) {
                const fromRow = getRow(move.from);
                const fromCol = getCol(move.from);
                const targetRow = fromRow + condition.from[0];
                const targetCol = fromCol + condition.from[1];
                
                if (!this.isValidPosition(targetRow, targetCol)) return false;
                
                const targetIndex = this.getIndex(targetRow, targetCol);
                if (board[targetIndex] === PIECES.EMPTY) return false;
            }

            if (condition.requires) {
                const piece = board[move.from];
                if (condition.requires === "king" && !this.isKing(piece)) return false;
                if (condition.requires === "empty" && board[move.to] !== PIECES.EMPTY) return false;
            }

            if (condition.sequence) {
                if (!move.captures || move.captures.length !== condition.captures) return false;
            }

            if (condition.threatens) {
                const threatenedPieces = this.countThreatenedPieces(board, move);
                if (threatenedPieces < condition.threatens) return false;
            }
        }

        return true;
    }

    calculateTacticalValue(analysis) {
        let value = 0;
        value += analysis.shots.reduce((sum, shot) => sum + shot.value, 0);
        value += analysis.combinations.reduce((sum, combo) => sum + combo.value, 0);
        value += analysis.threats.reduce((sum, threat) => sum + threat.value, 0);
        return value;
    }

    getCachedMoves(board, player) {
        const key = this.getPositionKey(board, player);
        if (!this.moveCache.has(key)) {
            this.moveCache.set(key, generateMoves(board, player));
        }
        return this.moveCache.get(key);
    }

    generateShotDescription(pattern, move) {
        return `${pattern.name}: A tactical shot from square ${move.from} to ${move.to} ${
            move.captures ? `capturing pieces at ${move.captures.join(', ')}` : ''
        }`;
    }

    generateCombinationDescription(pattern, move) {
        return `${pattern.name}: A ${move.captures.length}-piece combination starting from square ${move.from}`;
    }

    generateThreatDescription(pattern, move) {
        return `${pattern.name}: Creates a tactical threat from square ${move.from} to ${move.to}`;
    }

    countThreatenedPieces(board, move) {
        let count = 0;
        const opponent = pieceColor(board[move.from]) === 'white' ? 'black' : 'white';
        
        for (let i = 0; i < board.length; i++) {
            if (pieceColor(board[i]) === opponent && this.isSquareThreatened(board, i, move)) {
                count++;
            }
        }
        return count;
    }

    isSquareThreatened(board, square, move) {
        const targetRow = getRow(square);
        const targetCol = getCol(square);
        const moveRow = getRow(move.to);
        const moveCol = getCol(move.to);
        
        return Math.abs(targetRow - moveRow) <= 2 && Math.abs(targetCol - moveCol) <= 2;
    }

    getPositionKey(board, player) {
        return `${board.join('')}-${player}`;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 10 && col >= 0 && col < 10;
    }

    getIndex(row, col) {
        return row * 10 + col;
    }

    isKing(piece) {
        return piece === PIECES.WHITE_KING || piece === PIECES.BLACK_KING;
    }

    clearCache() {
        this.patternCache.clear();
        this.moveCache.clear();
        this.statistics = {
            patternsChecked: 0,
            matchesFound: 0,
            cacheHits: 0
        };
    }

    getStatistics() {
        return { ...this.statistics };
    }
}

export const TACTICAL_RECOGNIZER_VERSION = {
    version: "1.0.0",
    lastUpdated: "2025-06-14 01:49:01",
    author: "codewithheck",
    features: {
        patternMatching: true,
        caching: true,
        statistics: true,
        descriptions: true
    }
};
