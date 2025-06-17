/**
 * Refactored History class for hectic-game
 * Handles move history logic only; no DOM rendering.
 * Works with Renderer-based architecture.
 */

export class History {
    constructor(game) {
        this.game = game;
        this.history = [];
        this.currentIndex = -1;
    }

    recordMove(move, notation) {
        // Remove any future moves if rewinding and then making a new move
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        this.history.push({
            move,
            notation,
            fen: this.game.getFEN(),
            gameState: this.game.gameState
        });
        this.currentIndex = this.history.length - 1;
    }

    jumpToMove(index) {
        if (index < 0 || index >= this.history.length) return;
        this.game.loadFEN(this.history[index].fen);
        this.currentIndex = index;
        if (window.game && window.game.renderer) {
            window.game.renderer.renderAll();
        }
    }

    jumpToStart() {
        if (this.history.length === 0) return;
        this.game.reset();
        this.currentIndex = -1;
        if (window.game && window.game.renderer) {
            window.game.renderer.renderAll();
        }
    }

    jumpToEnd() {
        this.jumpToMove(this.history.length - 1);
    }

    previousMove() {
        if (this.currentIndex > 0) {
            this.jumpToMove(this.currentIndex - 1);
        }
    }

    nextMove() {
        if (this.currentIndex < this.history.length - 1) {
            this.jumpToMove(this.currentIndex + 1);
        }
    }

    clear() {
        this.history = [];
        this.currentIndex = -1;
    }

    getHistory() {
        return this.history;
    }

    getCurrentIndex() {
        return this.currentIndex;
    }
}
