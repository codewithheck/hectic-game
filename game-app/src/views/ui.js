/**
 * Refactored UI class for hectic-game
 * Handles UI controls and emits events; no rendering or state management.
 * Ready to use with Renderer-based architecture.
 */

export class UI {
    constructor() {
        this.initElements();
        this.attachEventListeners();
    }

    initElements() {
        this.newGameButton = document.getElementById('new-game');
        this.undoButton = document.getElementById('undo');
        this.redoButton = document.getElementById('redo');
        this.importFENButton = document.getElementById('import-fen');
        this.exportFENButton = document.getElementById('export-fen');
        // Add other control elements as needed
    }

    attachEventListeners() {
        // Main game object and renderer assumed available globally as window.game and window.game.renderer
        if (this.newGameButton) {
            this.newGameButton.addEventListener('click', () => {
                window.game.game.reset();
                window.game.renderer.renderAll();
            });
        }
        if (this.undoButton) {
            this.undoButton.addEventListener('click', () => {
                window.game.game.undo();
                window.game.renderer.renderAll();
            });
        }
        if (this.redoButton) {
            this.redoButton.addEventListener('click', () => {
                window.game.game.redo();
                window.game.renderer.renderAll();
            });
        }
        if (this.importFENButton) {
            this.importFENButton.addEventListener('click', () => {
                const fen = window.prompt('Paste FEN string:');
                if (fen) {
                    window.game.game.loadFEN(fen);
                    window.game.renderer.renderAll();
                }
            });
        }
        if (this.exportFENButton) {
            this.exportFENButton.addEventListener('click', () => {
                const fen = window.game.game.getFEN();
                window.prompt('FEN string:', fen);
            });
        }
        // Add more controls as needed
    }
}
