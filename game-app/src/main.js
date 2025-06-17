import { Game } from './engine/game.js';
import { AI } from './engine/ai.js';
import { Renderer } from './views/renderer.js';
import { UI } from './views/ui.js';
import { Board } from './views/board.js';

class DraughtsGame {
    constructor() {
        // Core logic
        this.game = new Game();
        this.ai = new AI();

        // DOM elements
        this.boardElement = document.getElementById('board');
        this.historyElement = document.getElementById('history');
        this.statusElement = document.getElementById('status');

        // Renderer (handles all rendering)
        this.renderer = new Renderer(
            this.game,
            this.boardElement,
            this.historyElement,
            this.statusElement
        );

        // UI controls (new game, undo, redo, FEN import/export, etc.)
        this.ui = new UI();

        // Board interaction (clicks, drag & drop)
        this.board = new Board(this.boardElement);

        // Initial render
        this.newGame();
    }

    async handleSquareClick({ row, col }) {
        // Handle selection or move by clicking
        const move = this.game.handleSquareSelection({ row, col });
        if (move) {
            this.renderer.renderAll();

            // AI Move if needed
            if (!this.game.isGameOver() && !this.game.isPlayerTurn()) {
                const aiMove = await this.ai.getMove(this.game.getPosition());
                if (aiMove) {
                    this.game.makeMove(aiMove);
                    this.renderer.renderAll();
                }
            }
        } else {
            // Rerender to clear selection/highlights if click had no effect
            this.renderer.renderAll();
        }
    }

    async handlePieceDrop({ from, to }) {
        // Try to select the piece at 'from'
        this.game.handleSquareSelection(from);
        // Try to move to 'to'
        const attemptedMove = this.game.handleSquareSelection(to);

        if (attemptedMove) {
            this.renderer.renderAll();

            // AI Move if needed
            if (!this.game.isGameOver() && !this.game.isPlayerTurn()) {
                const aiMove = await this.ai.getMove(this.game.getPosition());
                if (aiMove) {
                    this.game.makeMove(aiMove);
                    this.renderer.renderAll();
                }
            }
        } else {
            // Even if move not valid, re-render to clear selection/highlights
            this.renderer.renderAll();
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
