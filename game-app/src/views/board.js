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
        // Click event for selecting squares
        this.container.addEventListener('click', (event) => {
            const square = event.target.closest('.board-square');
            if (!square) return;
            const row = parseInt(square.dataset.row, 10);
            const col = parseInt(square.dataset.col, 10);
            if (window.game && typeof window.game.handleSquareClick === 'function') {
                window.game.handleSquareClick({ row, col });
            }
        });

        // Drag start event for pieces
        this.container.addEventListener('dragstart', (event) => {
            const piece = event.target.closest('.piece');
            if (!piece) return;
            const square = piece.parentElement;
            const row = parseInt(square.dataset.row, 10);
            const col = parseInt(square.dataset.col, 10);
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', JSON.stringify({ row, col }));
        });

        // Drag over event for squares
        this.container.addEventListener('dragover', (event) => {
            const square = event.target.closest('.board-square');
            if (!square) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        });

        // Drop event for squares
        this.container.addEventListener('drop', (event) => {
            const square = event.target.closest('.board-square');
            if (!square) return;
            event.preventDefault();
            const data = event.dataTransfer.getData('text/plain');
            if (!data) return;
            const { row: fromRow, col: fromCol } = JSON.parse(data);
            const toRow = parseInt(square.dataset.row, 10);
            const toCol = parseInt(square.dataset.col, 10);
            if (window.game && typeof window.game.handlePieceDrop === 'function') {
                window.game.handlePieceDrop({ from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } });
            }
        });
    }
}
