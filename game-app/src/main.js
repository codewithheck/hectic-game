import { Game } from './engine/game.js';
import { AI } from './engine/ai.js';
import { Renderer } from './views/renderer.js';
import { UI } from './views/ui.js';
import { Board } from './views/board.js';

// Main application controller for Hectic Game
class DraughtsGame {
    constructor() {
        // Core logic
        this.game = new Game();
        this.ai = new AI();

        // DOM elements
        this.boardElement = document.getElementById('game-board'); // The main board
        this.historyElement = document.getElementById('move-history'); // Move log
        this.statusElement = document.getElementById('status'); // Optional status bar

        // Renderer: centralizes all rendering
        this.renderer = new Renderer(
            this.game,
            this.boardElement,
            this.historyElement,
            this.statusElement
        );

        // UI: handles control buttons and options
        this.ui = new UI();

        // Board: handles board user interactions
        this.board = new Board(this.boardElement);

        // Board click event
        this.board.setCallbacks({
            onSquareClick: (row, col) => this.handleSquareClick(row, col),
            onPieceDragStart: (row, col, event) => this.handlePieceDragStart(row, col, event),
            onPieceDragOver: (event, square, row, col) => this.handlePieceDragOver(event, square, row, col),
            onPieceDrop: (row, col, event) => this.handlePieceDrop(row, col, event)
        });

        // UI event bindings (buttons, FEN import/export, etc)
        this.attachUIEvents();

        // Initial game render
        this.renderer.renderAll();
    }

    async handleSquareClick(row, col) {
        const move = this.game.handleSquareSelection({ row, col });
        if (move) {
            this.renderer.renderAll();
            if (!this.game.isGameOver() && !this.game.isPlayerTurn()) {
                await this.handleAIMove();
            }
        } else {
            this.renderer.renderAll();
        }
    }

    async handlePieceDragStart(row, col, event) {
        // Selection logic is handled in renderer/UI, but you can highlight here if needed
    }

    async handlePieceDragOver(event, square, row, col) {
        // Optionally highlight drop targets here
        event.preventDefault();
    }

    async handlePieceDrop(row, col, event) {
        const data = event.dataTransfer ? event.dataTransfer.getData('text/plain') : null;
        let from;
        if (data) {
            try {
                from = JSON.parse(data);
            } catch {
                from = null;
            }
        }
        // Fallback: use last selected piece if no drag data
        if (!from && this.game.selectedSquare) {
            from = this.game.selectedSquare;
        }
        if (!from) return;

        // Try making the move
        this.game.handleSquareSelection(from); // select source
        const move = this.game.handleSquareSelection({ row, col }); // select destination
        if (move) {
            this.renderer.renderAll();
            if (!this.game.isGameOver() && !this.game.isPlayerTurn()) {
                await this.handleAIMove();
            }
        } else {
            this.renderer.renderAll();
        }
    }

    async handleAIMove() {
        const aiMove = await this.ai.getMove(this.game.getPosition());
        if (aiMove) {
            this.game.makeMove(aiMove);
            this.renderer.renderAll();
        }
    }

    attachUIEvents() {
        // New Game
        const newGameBtn = document.getElementById('new-game');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                this.game.reset();
                this.renderer.renderAll();
            });
        }
        // Undo
        const undoBtn = document.getElementById('undo');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.game.undo();
                this.renderer.renderAll();
            });
        }
        // Redo
        const redoBtn = document.getElementById('redo');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                this.game.redo();
                this.renderer.renderAll();
            });
        }
        // Import FEN
        const importFENBtn = document.getElementById('import-fen');
        if (importFENBtn) {
            importFENBtn.addEventListener('click', () => {
                const fen = window.prompt('Paste FEN string:');
                if (fen) {
                    this.game.loadFEN(fen);
                    this.renderer.renderAll();
                }
            });
        }
        // Export FEN
        const exportFENBtn = document.getElementById('export-fen');
        if (exportFENBtn) {
            exportFENBtn.addEventListener('click', () => {
                const fen = this.game.getFEN();
                window.prompt('FEN string:', fen);
            });
        }
        // First/Prev/Next/Last move navigation (if you use these)
        const firstMoveBtn = document.getElementById('first-move');
        const prevMoveBtn = document.getElementById('prev-move');
        const nextMoveBtn = document.getElementById('next-move');
        const lastMoveBtn = document.getElementById('last-move');
        if (firstMoveBtn) {
            firstMoveBtn.addEventListener('click', () => {
                this.game.jumpToStart();
                this.renderer.renderAll();
            });
        }
        if (prevMoveBtn) {
            prevMoveBtn.addEventListener('click', () => {
                this.game.previousMove();
                this.renderer.renderAll();
            });
        }
        if (nextMoveBtn) {
            nextMoveBtn.addEventListener('click', () => {
                this.game.nextMove();
                this.renderer.renderAll();
            });
        }
        if (lastMoveBtn) {
            lastMoveBtn.addEventListener('click', () => {
                this.game.jumpToEnd();
                this.renderer.renderAll();
            });
        }
        // Difficulty selector (if present)
        const difficultySelect = document.getElementById('difficulty-level');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                const level = parseInt(e.target.value, 10);
                this.ai.setDifficulty(level);
            });
        }
        // Max capture rule (if present)
        const maxCaptureCheckbox = document.getElementById('max-capture-rule');
        if (maxCaptureCheckbox) {
            maxCaptureCheckbox.addEventListener('change', (e) => {
                this.game.maxCaptureRule = e.target.checked;
                this.renderer.renderAll();
            });
        }
    }
}

// Initialize game on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new DraughtsGame();
});
