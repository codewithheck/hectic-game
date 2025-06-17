/**
 * Positioning Adjustment Tool
 * Temporary tool to help fine-tune board and piece positioning
 */

function createPositioningTool() {
    // Create positioning tool panel
    const toolPanel = document.createElement('div');
    toolPanel.id = 'positioning-tool';
    toolPanel.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: white;
        border: 2px solid #007bff;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1001;
        font-family: 'Segoe UI', sans-serif;
        font-size: 14px;
        min-width: 250px;
    `;

    toolPanel.innerHTML = `
        <div style="margin-bottom: 15px; font-weight: bold; color: #007bff; border-bottom: 1px solid #007bff; padding-bottom: 5px;">
            Positioning Tool
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Piece Position:</label>
            <div style="display: flex; gap: 10px; margin-bottom: 5px;">
                <button onclick="adjustPieces(-1, 0)" style="padding: 5px 10px; border: 1px solid #007bff; background: white; cursor: pointer;">← X</button>
                <button onclick="adjustPieces(1, 0)" style="padding: 5px 10px; border: 1px solid #007bff; background: white; cursor: pointer;">X →</button>
                <button onclick="adjustPieces(0, -1)" style="padding: 5px 10px; border: 1px solid #007bff; background: white; cursor: pointer;">↑ Y</button>
                <button onclick="adjustPieces(0, 1)" style="padding: 5px 10px; border: 1px solid #007bff; background: white; cursor: pointer;">Y ↓</button>
            </div>
            <div style="font-size: 12px; color: #666;">
                Current: X=<span id="piece-x">0</span>, Y=<span id="piece-y">0</span>
            </div>
        </div>

        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Board Grid:</label>
            <div style="display: flex; gap: 10px; margin-bottom: 5px;">
                <button onclick="adjustBoard(-1, 0)" style="padding: 5px 10px; border: 1px solid #28a745; background: white; cursor: pointer;">← X</button>
                <button onclick="adjustBoard(1, 0)" style="padding: 5px 10px; border: 1px solid #28a745; background: white; cursor: pointer;">X →</button>
                <button onclick="adjustBoard(0, -1)" style="padding: 5px 10px; border: 1px solid #28a745; background: white; cursor: pointer;">↑ Y</button>
                <button onclick="adjustBoard(0, 1)" style="padding: 5px 10px; border: 1px solid #28a745; background: white; cursor: pointer;">Y ↓</button>
            </div>
            <div style="font-size: 12px; color: #666;">
                Current: X=<span id="board-x">0</span>, Y=<span id="board-y">0</span>
            </div>
        </div>

        <div style="margin-bottom: 15px;">
            <button onclick="toggleSquareBorders()" style="padding: 8px 12px; border: 1px solid #ffc107; background: white; cursor: pointer; width: 100%;">
                Toggle Square Borders
            </button>
        </div>

        <div style="margin-bottom: 15px;">
            <button onclick="resetPositions()" style="padding: 8px 12px; border: 1px solid #dc3545; background: white; cursor: pointer; width: 100%;">
                Reset All
            </button>
        </div>

        <div style="margin-bottom: 10px;">
            <button onclick="showCurrentValues()" style="padding: 8px 12px; border: 1px solid #6c757d; background: white; cursor: pointer; width: 100%;">
                Show Values for Code
            </button>
        </div>

        <div>
            <button onclick="removePositioningTool()" style="padding: 8px 12px; border: 1px solid #dc3545; background: #dc3545; color: white; cursor: pointer; width: 100%;">
                Close Tool
            </button>
        </div>
    `;

    document.body.appendChild(toolPanel);
}

// Global variables to track current offsets
let currentPieceX = 0;
let currentPieceY = 0;
let currentBoardX = 0;
let currentBoardY = 0;
let squareBordersVisible = false;

// Adjust piece positioning
function adjustPieces(deltaX, deltaY) {
    currentPieceX += deltaX;
    currentPieceY += deltaY;
    
    if (window.game && window.game.board) {
        window.game.board.adjustPiecePositioning(currentPieceX, currentPieceY);
    }
    
    updateDisplayValues();
}

// Adjust board grid positioning
function adjustBoard(deltaX, deltaY) {
    currentBoardX += deltaX;
    currentBoardY += deltaY;
    
    if (window.game && window.game.board) {
        window.game.board.adjustBoardGrid(currentBoardX, currentBoardY);
    }
    
    updateDisplayValues();
}

// Toggle square borders for debugging
function toggleSquareBorders() {
    squareBordersVisible = !squareBordersVisible;
    const squares = document.querySelectorAll('.board-square');
    
    squares.forEach(square => {
        if (squareBordersVisible) {
            square.style.border = '1px solid rgba(255,0,0,0.5)';
        } else {
            square.style.border = 'none';
        }
    });
}

// Reset all positions
function resetPositions() {
    currentPieceX = 0;
    currentPieceY = 0;
    currentBoardX = 0;
    currentBoardY = 0;
    
    if (window.game && window.game.board) {
        window.game.board.adjustPiecePositioning(0, 0);
        window.game.board.adjustBoardGrid(0, 0);
    }
    
    // Remove square borders
    squareBordersVisible = false;
    const squares = document.querySelectorAll('.board-square');
    squares.forEach(square => {
        square.style.border = 'none';
    });
    
    updateDisplayValues();
}

// Show current values for code implementation
function showCurrentValues() {
    const message = `Current positioning values:

Piece Offsets: X=${currentPieceX}, Y=${currentPieceY}
Board Offsets: X=${currentBoardX}, Y=${currentBoardY}

To make these permanent, update board.js:
this.pieceOffsetX = ${currentPieceX};
this.pieceOffsetY = ${currentPieceY};
this.boardOffsetX = ${currentBoardX};
this.boardOffsetY = ${currentBoardY};`;

    alert(message);
    console.log('Positioning Values:', {
        pieceX: currentPieceX,
        pieceY: currentPieceY,
        boardX: currentBoardX,
        boardY: currentBoardY
    });
}

// Update display values in the tool
function updateDisplayValues() {
    const pieceXElement = document.getElementById('piece-x');
    const pieceYElement = document.getElementById('piece-y');
    const boardXElement = document.getElementById('board-x');
    const boardYElement = document.getElementById('board-y');
    
    if (pieceXElement) pieceXElement.textContent = currentPieceX;
    if (pieceYElement) pieceYElement.textContent = currentPieceY;
    if (boardXElement) boardXElement.textContent = currentBoardX;
    if (boardYElement) boardYElement.textContent = currentBoardY;
}

// Remove the positioning tool
function removePositioningTool() {
    const tool = document.getElementById('positioning-tool');
    if (tool) {
        tool.remove();
    }
    
    // Remove square borders if visible
    if (squareBordersVisible) {
        toggleSquareBorders();
    }
}

// Initialize the tool when the game is ready
function initializePositioningTool() {
    // Wait for game to be ready
    const checkGameReady = setInterval(() => {
        if (window.game && window.game.board) {
            clearInterval(checkGameReady);
            createPositioningTool();
            updateDisplayValues();
            console.log('Positioning tool ready! Use the floating panel to adjust piece and board positioning.');
        }
    }, 100);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePositioningTool);
} else {
    initializePositioningTool();
}
