/**
 * International Draughts Game - Main Entry Point
 * @author codewithheck
 * Created: 2025-06-17 05:42:40 UTC
 */

import { Board } from './view/board.js';
import { UI } from './view/ui.js';
import { Game } from './engine/game.js';
import { AI } from './engine/ai.js';
import { BOARD_SIZE, PLAYER_COLOR, GAME_MODE } from './engine/constants.js';
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
        this.game.newGame();
        this.board.initialize();
        this.ui.initialize();
        this.updateDisplay();
    }

    bindEvents() {
        this.board.on('squareClick', (square) => {
            if (this.game.isPlayerTurn()) {
                this.handleSquareClick(square);
            }
        });

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
                this.game.setPosition(position);
                this.updateDisplay();
            }
        });
    }

    async handleSquareClick(square) {
        const move = this.game.handleSquareSelection(square);
        
        if (move) {
            this.updateDisplay();
            
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
        this.board.updatePosition(this.game.getPosition());
        this.ui.updateMoveHistory(this.game.getMoveHistory());
        this.ui.updateTimers(this.game.getTimers());
        this.ui.updateGameStatus(this.game.getStatus());
        
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
