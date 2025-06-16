// Main entry point for the International Draughts game

import { Board } from './view/board.js';
import { UI } from './view/ui.js';
import { Game } from './engine/game.js';
import { AI } from './engine/ai.js';
import { BOARD_SIZE, PLAYER_COLOR, GAME_MODE } from './engine/constants.js';

class DraughtsGame {
    constructor() {
        // Initialize core game components
        this.game = new Game();
        this.board = new Board();
        this.ui = new UI();
        this.ai = new AI();

        // Bind event handlers
        this.bindEvents();
        
        // Initialize the game
        this.initialize();
    }

    bindEvents() {
        // Board events
        this.board.on('squareClick', (square) => {
            if (this.game.isPlayerTurn()) {
                this.handleSquareClick(square);
            }
        });

        // UI Control events
        this.ui.on('difficultyChange', (level) => {
            this.ai.setDifficulty(level);
        });

        this.ui.on('maxCaptureToggle', (enabled) => {
            this.game.setMaxCaptureRule(enabled);
        });

        this.ui.on('timeControlToggle', (enabled) => {
            this.game.setTimeControl(enabled);
        });

        this.ui.on('editModeToggle', (enabled) => {
            this.board.setEditMode(enabled);
            this.game.setEditMode(enabled);
        });

        // Navigation events
        this.ui.on('undo', () => {
            this.game.undo();
            this.updateDisplay();
        });

        this.ui.on('redo', () => {
            this.game.redo();
            this.updateDisplay();
        });

        this.ui.on('firstMove', () => {
            this.game.goToStart();
            this.updateDisplay();
        });

        this.ui.on('lastMove', () => {
            this.game.goToEnd();
            this.updateDisplay();
        });

        // FEN import/export events
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

        // PNG import/export events
        this.ui.on('savePNG', () => {
            this.board.saveAsPNG();
        });

        this.ui.on('loadPNG', async (imageFile) => {
            const position = await this.board.loadFromPNG(imageFile);
            if (position) {
                this.game.setPosition(position);
                this.updateDisplay();
            }
        });
    }

    initialize() {
        // Set up the initial game state
        this.game.newGame();
        
        // Initialize the board display
        this.board.initialize();
        
        // Set up UI components
        this.ui.initialize();
        
        // Initial display update
        this.updateDisplay();
    }

    async handleSquareClick(square) {
        const move = this.game.handleSquareSelection(square);
        
        if (move) {
            // Update the display after the player's move
            this.updateDisplay();
            
            // If it's AI's turn, get and make AI move
            if (!this.game.isGameOver() && !this.game.isPlayerTurn()) {
                this.ui.showThinking(true);
                const aiMove = await this.ai.getMove(this.game.getPosition());
                this.ui.showThinking(false);
                
                if (aiMove) {
                    this.game.makeMove(aiMove);
                    this.updateDisplay();
                }
            }
        }
    }

    updateDisplay() {
        // Update the board display
        this.board.updatePosition(this.game.getPosition());
        
        // Update UI elements
        this.ui.updateMoveHistory(this.game.getMoveHistory());
        this.ui.updateTimers(this.game.getTimers());
        this.ui.updateGameStatus(this.game.getStatus());
        
        // Update analysis if AI evaluation is available
        const evaluation = this.ai.getLastEvaluation();
        if (evaluation) {
            this.ui.updateAnalysis(evaluation);
        }
    }
}

// Start the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new DraughtsGame();
});

// Export for testing purposes
export { DraughtsGame };
