// Main entry point for the International Draughts game

import { Game } from './engine/game.js';
import { AI } from './engine/ai.js';
import { Renderer } from './views/renderer.js';

class DraughtsGame {
    constructor() {
        // Initialize core game components
        this.game = new Game();
        this.ai = new AI();

        // Initialize renderer with DOM elements
        this.renderer = new Renderer(
            this.game,
            document.getElementById('board'),
            document.getElementById('history'),
            document.getElementById('status')
        );

        // Bind event handlers
        this.bindEvents();

        // Start game
        this.newGame();
    }

    bindEvents() {
        // Example: Square click event (replace with your actual board click logic)
        document.getElementById('board').addEventListener('click', async (e) => {
            const squareEl = e.target.closest('.board-square');
            if (!squareEl) return;
            const row = parseInt(squareEl.dataset.row, 10);
            const col = parseInt(squareEl.dataset.col, 10);

            // Assume you have a method to handle selection
            const move = this.game.handleSquareSelection({ row, col });
            if (move) {
                this.renderer.renderAll();

                // If it's the AI's turn, make AI move
                if (!this.game.isGameOver() && !this.game.isPlayerTurn()) {
                    const aiMove = await this.ai.getMove(this.game.getPosition());
                    if (aiMove) {
                        this.game.makeMove(aiMove);
                        this.renderer.renderAll();
                    }
                }
            }
        });

        // Example: Undo button
        const undoBtn = document.getElementById('undo');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.game.undo();
                this.renderer.renderAll();
            });
        }

        // Example: Redo button
        const redoBtn = document.getElementById('redo');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                this.game.redo();
                this.renderer.renderAll();
            });
        }

        // Example: New game button
        const newGameBtn = document.getElementById('new-game');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                this.newGame();
            });
        }

        // Example: Import FEN
        const importFENBtn = document.getElementById('import-fen');
        if (importFENBtn) {
            importFENBtn.addEventListener('click', () => {
                const fen = prompt('Paste FEN string:');
                if (fen) {
                    this.game.loadFEN(fen);
                    this.renderer.renderAll();
                }
            });
        }

        // Example: Export FEN
        const exportFENBtn = document.getElementById('export-fen');
        if (exportFENBtn) {
            exportFENBtn.addEventListener('click', () => {
                const fen = this.game.getFEN();
                window.prompt('FEN string:', fen);
            });
        }
    }

    newGame() {
        this.game.reset();
        this.renderer.renderAll();
    }
}

// Start the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new DraughtsGame();
});
