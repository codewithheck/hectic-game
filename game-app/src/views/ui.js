/**
 * UI class for hectic-game
 * Compatible with main.js expectations
 */

export class UI {
    constructor() {
        this.listeners = new Map();
        this.elements = {};
    }

    initialize() {
        this.initElements();
        this.attachEventListeners();
    }

    initElements() {
        this.elements = {
            difficultyLevel: document.getElementById('difficulty-level'),
            maxCaptureRule: document.getElementById('max-capture-rule'),
            timeControl: document.getElementById('time-control'),
            editMode: document.getElementById('edit-mode'),
            undoButton: document.getElementById('undo'),
            redoButton: document.getElementById('redo'),
            firstMoveButton: document.getElementById('first-move'),
            lastMoveButton: document.getElementById('last-move'),
            prevMoveButton: document.getElementById('prev-move'),
            nextMoveButton: document.getElementById('next-move'),
            importFENButton: document.getElementById('import-fen'),
            exportFENButton: document.getElementById('export-fen'),
            savePNGButton: document.getElementById('save-png'),
            loadPNGInput: document.getElementById('load-png'),
            moveHistory: document.getElementById('move-history'),
            bestMove: document.getElementById('best-move'),
            evaluationScore: document.getElementById('evaluation-score'),
            searchDepth: document.getElementById('search-depth'),
            blackTimer: document.getElementById('black-timer'),
            whiteTimer: document.getElementById('white-timer'),
            notification: document.getElementById('notification')
        };
    }

    attachEventListeners() {
        // Difficulty selector
        if (this.elements.difficultyLevel) {
            this.elements.difficultyLevel.addEventListener('change', (e) => {
                this.emit('difficultyChange', parseInt(e.target.value));
            });
        }

        // Game options
        if (this.elements.maxCaptureRule) {
            this.elements.maxCaptureRule.addEventListener('change', (e) => {
                this.emit('maxCaptureToggle', e.target.checked);
            });
        }

        if (this.elements.timeControl) {
            this.elements.timeControl.addEventListener('change', (e) => {
                this.emit('timeControlToggle', e.target.checked);
            });
        }

        if (this.elements.editMode) {
            this.elements.editMode.addEventListener('click', () => {
                const isActive = this.elements.editMode.classList.toggle('active');
                this.emit('editModeToggle', isActive);
            });
        }

        // Navigation buttons
        if (this.elements.undoButton) {
            this.elements.undoButton.addEventListener('click', () => {
                this.emit('undo');
            });
        }

        if (this.elements.redoButton) {
            this.elements.redoButton.addEventListener('click', () => {
                this.emit('redo');
            });
        }

        if (this.elements.firstMoveButton) {
            this.elements.firstMoveButton.addEventListener('click', () => {
                this.emit('firstMove');
            });
        }

        if (this.elements.lastMoveButton) {
            this.elements.lastMoveButton.addEventListener('click', () => {
                this.emit('lastMove');
            });
        }

        if (this.elements.prevMoveButton) {
            this.elements.prevMoveButton.addEventListener('click', () => {
                this.emit('prevMove');
            });
        }

        if (this.elements.nextMoveButton) {
            this.elements.nextMoveButton.addEventListener('click', () => {
                this.emit('nextMove');
            });
        }

        // FEN buttons
        if (this.elements.importFENButton) {
            this.elements.importFENButton.addEventListener('click', () => {
                this.emit('importFEN');
            });
        }

        if (this.elements.exportFENButton) {
            this.elements.exportFENButton.addEventListener('click', () => {
                this.emit('exportFEN');
            });
        }

        // PNG buttons
        if (this.elements.savePNGButton) {
            this.elements.savePNGButton.addEventListener('click', () => {
                this.emit('savePNG');
            });
        }

        if (this.elements.loadPNGInput) {
            this.elements.loadPNGInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.emit('loadPNG', file);
                }
            });
        }
    }

    updateMoveHistory(history) {
        if (!this.elements.moveHistory) return;

        this.elements.moveHistory.innerHTML = '';
        
        history.forEach((move, index) => {
            const moveEl = document.createElement('div');
            moveEl.className = 'move-entry';
            moveEl.textContent = `${index + 1}. ${move.notation || 'Move'}`;
            this.elements.moveHistory.appendChild(moveEl);
        });

        // Scroll to bottom
        this.elements.moveHistory.scrollTop = this.elements.moveHistory.scrollHeight;
    }

    updateTimers(timers) {
        if (timers && timers.white !== undefined && this.elements.whiteTimer) {
            this.updateTimer(this.elements.whiteTimer, timers.white);
        }
        
        if (timers && timers.black !== undefined && this.elements.blackTimer) {
            this.updateTimer(this.elements.blackTimer, timers.black);
        }
    }

    updateTimer(element, seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        element.textContent = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
        
        if (seconds <= 10) {
            element.classList.add('warning');
        } else {
            element.classList.remove('warning');
        }
    }

    updateGameStatus(status) {
        let statusText = '';
        switch (status) {
            case 'ongoing':
                statusText = 'Game in progress';
                break;
            case 'whiteWin':
                statusText = 'White wins!';
                break;
            case 'blackWin':
                statusText = 'Black wins!';
                break;
            case 'draw':
                statusText = 'Game drawn';
                break;
            default:
                statusText = 'Ready to play';
        }
        
        this.showNotification(statusText, 'info');
    }

    updateAnalysis(evaluation) {
        if (this.elements.bestMove && evaluation.bestMove) {
            this.elements.bestMove.textContent = evaluation.bestMove.notation || '--';
        }

        if (this.elements.evaluationScore && evaluation.score !== undefined) {
            const score = Math.round(evaluation.score * 100) / 100;
            this.elements.evaluationScore.textContent = score > 0 ? `+${score}` : score;
        }

        if (this.elements.searchDepth && evaluation.depth !== undefined) {
            this.elements.searchDepth.textContent = evaluation.depth;
        }
    }

    showThinking(isThinking) {
        if (isThinking) {
            this.showNotification('AI is thinking...', 'info');
        } else {
            this.hideNotification();
        }
    }

    async getFENInput() {
        return new Promise((resolve) => {
            const fen = prompt('Enter FEN notation:');
            resolve(fen);
        });
    }

    showFEN(fen) {
        prompt('FEN notation (copy this):', fen);
    }

    showNotification(message, type = 'info', duration = 3000) {
        if (!this.elements.notification) return;

        this.elements.notification.textContent = message;
        this.elements.notification.className = `notification ${type}`;
        this.elements.notification.classList.remove('hidden');

        if (duration > 0) {
            setTimeout(() => {
                this.hideNotification();
            }, duration);
        }
    }

    hideNotification() {
        if (this.elements.notification) {
            this.elements.notification.classList.add('hidden');
        }
    }

    // Event emitter methods
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
}
