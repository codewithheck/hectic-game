/**
 * Refactored Board class for hectic-game
 * Handles only user interactions; no DOM rendering.
 * Designed for Renderer-based setup.
 */

export class Board {
    constructor(container) {
        this.container = container;
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.container.addEventListener('click', (event) => {
            const square = event.target.closest('.board-square');
            if (!square) return;
            const row = parseInt(square.dataset.row, 10);
            const col = parseInt(square.dataset.col, 10);
            // Delegate to main game logic
            if (window.game && typeof window.game.handleSquareClick === 'function') {
                window.game.handleSquareClick({ row, col });
            }
        });

        // You can add drag and drop handlers here if needed, similar pattern:
        // this.container.addEventListener('dragstart', ...)
        // this.container.addEventListener('dragover', ...)
        // this.container.addEventListener('drop', ...)
    }
}
