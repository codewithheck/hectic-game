/**
 * International Draughts Game - Main Entry Point
 * @author codewithheck
 * Created: 2025-06-17 05:42:40 UTC
 */

import { Board } from './views/board.js';
import { UI } from './views/ui.js';
import { Game } from './engine/game.js';
import { AI } from './engine/ai.js';
import { BOARD_SIZE, PLAYER, GAME_MODE } from './engine/constants.js';
import OpeningBook from './utils/opening-book.js';

class DraughtsGame {
    constructor() {
        this.initialize();
    }

    async initialize() {
        try {
            this.game = new Game();
            this.board = new Board();
            this.ui = new UI();
            this.ai = new AI();
            
            console.log('Initializing AI...');
            await this.ai.initialize();
            
            console.log('Setting up game...');
            this.game.reset();
            
            console.log('Initializing board...');
            this.board.initialize();
            
            console.log('Initializing UI...');
            this.ui.initialize();
            
            console.log('Binding events...');
            this.bindEvents();
            
            console.log('Updating display...');
            this.updateDisplay();
            
            console.log('Game initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize game:', error);
        }
    }

    bindEvents() {
        // Handle move attempts from board
        this.board.on('moveAttempt', (moveData) => {
            this.handleMoveAttempt(moveData);
        });

        // Handle square selection for showing legal moves
        this.board.on('squareSelected', (square) => {
            this.showLegalMovesFor(square);
        });

        // UI Events
        this.ui.on('difficultyChange', (level) => {
            console.log('Setting AI difficulty to', level);
            this.ai.setDifficulty(level);
        });

        this.ui.on('maxCaptureToggle', (enabled) => {
            console.log('Max capture rule:', enabled);
        });

        this.ui.on('timeControlToggle', (enabled) => {
            console.log('Time control:', enabled);
        });

        this.ui.on('editModeToggle', (enabled) => {
            this.board.setEditMode(enabled);
        });

        this.ui.on('undo', () => {
            this.undoMove();
        });

        this.ui.on('redo', () => {
            this.redoMove();
        });

        this.ui.on('firstMove', () => {
            this.game.reset();
            this.updateDisplay();
        });

        this.ui.on('lastMove', () => {
            console.log('Go to last move - not implemented yet');
        });

        this.ui.on('importFEN', async () => {
            const fen = await this.ui.getFENInput();
            if (fen) {
                if (this.game.loadFEN(fen)) {
                    this.updateDisplay();
                    this.ui.showNotification('Position loaded successfully', 'success');
                } else {
                    this.ui.showNotification('Invalid FEN notation', 'error');
                }
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
            this.ui.showNotification('PNG loading not yet implemented', 'info');
        });
    }

    async handleMoveAttempt(moveData) {
        console.log('Move attempt:', moveData);
        
        // Check if it's the player's turn (assuming human is white)
        if (this.game.currentPlayer !== PLAYER.WHITE) {
            this.ui.showNotification("It's not your turn!", 'warning');
            return;
        }

        // Find if this move is legal
        const legalMoves = this.game.getLegalMoves();
        const requestedMove = legalMoves.find(move => 
            move.from.row === moveData.from.row && 
            move.from.col === moveData.from.col &&
            move.to.row === moveData.to.row && 
            move.to.col === moveData.to.col
        );

        if (requestedMove) {
            console.log('Making move:', requestedMove);
            const success = this.game.makeMove(requestedMove);
            
            if (success) {
                this.board.clearSelection();
                this.board.clearHighlights();
                this.updateDisplay();
                
                // Check if game is over
                if (this.isGameOver()) {
                    this.handleGameEnd();
                    return;
                }
                
                // AI turn
                if (this.game.currentPlayer === PLAYER.BLACK) {
                    this.ui.showThinking(true);
                    
                    setTimeout(async () => {
                        try {
                            console.log('AI is thinking...');
                            const aiMove = await this.ai.getMove(this.getGamePosition());
                            this.ui.showThinking(false);
                            
                            if (aiMove) {
                                console.log('AI move:', aiMove);
                                const aiSuccess = this.game.makeMove(aiMove);
                                if (aiSuccess) {
                                    this.updateDisplay();
                                    
                                    if (this.isGameOver()) {
                                        this.handleGameEnd();
                                    }
                                }
                            } else {
                                console.log('AI could not find a move');
                                this.ui.showNotification('AI could not find a move', 'warning');
                            }
                        } catch (error) {
                            console.error('AI error:', error);
                            this.ui.showThinking(false);
                            this.ui.showNotification('AI error occurred', 'error');
                        }
                    }, 100); // Small delay for UI responsiveness
                }
            } else {
                this.ui.showNotification('Invalid move', 'error');
            }
        } else {
            console.log('Illegal move attempted');
            this.ui.showNotification('Illegal move', 'warning');
        }
    }

    showLegalMovesFor(square) {
        const legalMoves = this.game.getLegalMoves();
        const movesFromSquare = legalMoves.filter(move => 
            move.from.row === square.row && move.from.col === square.col
        );
        
        this.board.highlightLegalMoves(movesFromSquare);
    }

    undoMove() {
        if (this.game.moveHistory.length > 0) {
            // Simple undo by going back to previous state
            // This is a simplified implementation
            console.log('Undo not fully implemented yet');
            this.ui.showNotification('Undo not yet implemented', 'info');
        }
    }

    redoMove() {
        console.log('Redo not implemented yet');
        this.ui.showNotification('Redo not yet implemented', 'info');
    }

    handleGameEnd() {
        let message = '';
        switch (this.game.gameState) {
            case 'whiteWin':
                message = 'White wins!';
                break;
            case 'blackWin':
                message = 'Black wins!';
                break;
            case 'draw':
                message = 'Game is a draw!';
                break;
        }
        
        if (message) {
            this.ui.showNotification(message, 'success', 5000);
        }
    }

    // Helper methods
    isPlayerTurn() {
        return this.game.currentPlayer === PLAYER.WHITE;
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
        try {
            console.log('Updating display...');
            
            // Update board position
            this.board.updatePosition(this.getGamePosition());
            
            // Update move history
            this.ui.updateMoveHistory(this.game.moveHistory);
            
            // Update game status
            this.ui.updateGameStatus(this.game.gameState);
            
            // Update analysis if available
            const evaluation = this.ai.getLastEvaluation();
            if (evaluation) {
                this.ui.updateAnalysis(evaluation);
            }
            
            console.log('Display updated successfully');
        } catch (error) {
            console.error('Error updating display:', error);
        }
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    window.game = new DraughtsGame();
});

export { DraughtsGame };
// Import positioning tool for development
import '../utils/positioning-tool.js';
