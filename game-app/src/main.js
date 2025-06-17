/**
 * International Draughts Game - Main Entry Point
 * @author codewithheck
 * Created: 2025-06-17 05:42:40 UTC
 */

import { Board } from './views/board.js';        // Fixed: was './view/board.js'
import { UI } from './views/ui.js';              // Fixed: was './view/ui.js'
import { Game } from './engine/game.js';
import { AI } from './engine/ai.js';
import { BOARD_SIZE, PLAYER, GAME_MODE } from './engine/constants.js';  // Fixed: PLAYER_COLOR -> PLAYER
import OpeningBook from './utils/opening-book.js';

class DraughtsGame {
    constructor() {
        this.initialize();
    }

    async initialize() {
        this.game = new Game();
        this.board = new Board();
        this.ui = new UI();
        this.ai = new AI();
        
        await this.ai.initialize();
        this.bindEvents();
        this.game.reset();  // Changed from newGame() to reset()
        this.board.initialize();
        this.ui.initialize();
        this.updateDisplay();
    }

    bindEvents() {
        this.board.on('squareClick', (square) => {
            if (this.isPlayerTurn()) {  // Fixed method call
                this.handleSquareClick(square);
            }
        });

        this.ui.on('difficultyChange', (level) => {
            this.ai.setDifficulty(level);
        });

        this.ui.on('maxCaptureToggle', (enabled) => {
            // Add this functionality to game if needed
            console.log('Max capture rule:', enabled);
        });

        this.ui.on('timeControlToggle', (enabled) => {
            // Add this functionality to game if needed
            console.log('Time control:', enabled);
        });

        this.ui.on('editModeToggle', (enabled) => {
            this.board.setEditMode(enabled);
            // Add edit mode to game if needed
        });

        this.ui.on('undo', () => {
            // Implement undo functionality
            console.log('Undo requested');
            this.updateDisplay();
        });

        this.ui.on('redo', () => {
            // Implement redo functionality
            console.log('Redo requested');
            this.updateDisplay();
        });

        this.ui.on('firstMove', () => {
            this.game.reset();
            this.updateDisplay();
        });

        this.ui.on('lastMove', () => {
            // Implement go to last move
            console.log('Go to last move');
            this.updateDisplay();
        });

        this.ui.on('importFEN', async () => {
            const fen = await this.ui.getFENInput();
            if (fen) {
                this.game.loadFEN(fen);
                this.updateDisplay();
            }
        });

        this.ui.on('exportFEN', () => {
            const fen = this.game.getFEN();
            this.ui.showFEN(fen);
        });

        this.ui.on('savePNG', () => {
            this.board.saveAsPNG();
        });

        this.ui.on('loadPNG', async (imageFile) => {
            const position = await this.board.loadFromPNG(imageFile);
            if (position) {
                // Set position on game
                console.log('Position loaded from PNG');
                this.updateDisplay();
            }
        });
    }

    async handleSquareClick(square) {
        const legalMoves = this.game.getLegalMoves();
        
        // Find a move that matches this square click
        const move = legalMoves.find(m => 
            (m.from.row === square.row && m.from.col === square.col) ||
            (m.to.row === square.row && m.to.col === square.col)
        );
        
        if (move) {
            const success = this.game.makeMove(move);
            if (success) {
                this.updateDisplay();
                
                if (!this.isGameOver() && !this.isPlayerTurn()) {
                    this.ui.showThinking(true);
                    const aiMove = await this.ai.getMove(this.getGamePosition());
                    this.ui.showThinking(false);
                    
                    if (aiMove) {
                        this.game.makeMove(aiMove);
                        this.updateDisplay();
                    }
                }
            }
        }
    }

    // Helper methods to bridge the gap between main.js expectations and game.js reality
    isPlayerTurn() {
        return this.game.currentPlayer === PLAYER.WHITE; // Assuming player is white
    }

    isGameOver() {
        return this.game.gameState !== 'ongoing';
    }

    getGamePosition() {
        return {
            pieces: this.game.pieces,
            currentPlayer: this.game.currentPlayer
        };
    }

    updateDisplay() {
        this.board.updatePosition(this.getGamePosition());
        this.ui.updateMoveHistory(this.game.moveHistory);
        this.ui.updateGameStatus(this.game.gameState);
        
        const evaluation = this.ai.getLastEvaluation();
        if (evaluation) {
            this.ui.updateAnalysis(evaluation);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new DraughtsGame();
});

export { DraughtsGame };
