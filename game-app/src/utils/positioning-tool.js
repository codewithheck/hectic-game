/**
 * Updated Positioning Tool for Wooden Board
 * Now includes border size adjustment
 */

function createPositioningTool() {
    const toolPanel = document.createElement('div');
    toolPanel.id = 'positioning-tool';
    toolPanel.style.cssText = `
        position: fixed;
        top: 80px;
        left: 20px;
        background: white;
        border: 2px solid #007bff;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1001;
        font-family: 'Segoe UI', sans-serif;
        font-size: 14px;
        min-width: 280px;
    `;

    toolPanel.innerHTML = `
        <div style="margin-bottom: 15px; font-weight: bold; color: #007bff; border-bottom: 1px solid #007bff; padding-bottom: 5px;">
            🎯 Wooden Board Positioning
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #dc3545;">Border Size (main adjustment):</label>
            <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                <button onclick="adjustBorderSize(-2)" style="padding: 5px 8px; border: 1px solid #dc3545; background: white; cursor: pointer; border-radius: 3px;">- 2px</button>
                <button onclick="adjustBorderSize(-1)" style="padding: 5px 8px; border: 1px solid #dc3545; background: white; cursor: pointer; border-radius: 3px;">- 1px</button>
                <button onclick="adjustBorderSize(1)" style="padding: 5px 8px; border: 1px solid #dc3545; background: white; cursor: pointer; border-radius: 3px;">+ 1px</button>
                <button onclick="adjustBorderSize(2)" style="padding: 5px 8px; border: 1px solid #dc3545; background: white; cursor: pointer; border-radius: 3px;">+ 2px</button>
            </div>
            <div style="font-size: 12px; color: #666;">
                Current border: <span id="border-size">30</span>px, Square size: <span id="square-size">54</span>px
            </div>
        </div>

        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Fine-tune pieces:</label>
            <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                <button onclick="adjustPieces(-1, 0)" style="padding: 5px 8px; border: 1px solid #007bff; background: white; cursor: pointer; border-radius: 3px;">← X</button>
                <button onclick="adjustPieces(1, 0)" style="padding: 5px 8px; border: 1px solid #007bff; background: white; cursor: pointer; border-radius: 3px;">X →</button>
                <button onclick="adjustPieces(0, -1)" style="padding: 5px 8px; border: 1px solid #007bff; background: white; cursor: pointer; border-radius: 3px;">↑ Y</button>
                <button onclick="adjustPieces(0, 1)" style="padding: 5px 8px; border: 1px solid #007bff; background: white; cursor: pointer; border-radius: 3px;">Y ↓</button>
            </div>
            <div style="font-size: 12px; color: #666;">
                Piece offset: X=<span id="piece-x">0</span>, Y=<span id="piece-y">0</span>
            </div>
        </div>

        <div style="margin-bottom: 10px;">
            <button onclick="toggleSquareBorders()" style="padding: 6px 10px; border: 1px solid #ffc107; background: white; cursor: pointer; width: 100%; border-radius: 3px; font-size: 12px;">
                Toggle Square Borders
            </button>
        </div>

        <div style="margin-bottom: 10px;">
            <button onclick="showCurrentValues()" style="padding: 6px 10px; border: 1px solid #28a745; background: white; cursor: pointer; width: 100%; border-radius: 3px; font-size: 12px;">
                ✅ Show Perfect Values
            </button>
        </div>

        <div style="margin-bottom: 10px;">
            <button onclick="resetPositions()" style="padding: 6px 10px; border: 1px solid #6c757d; background: white; cursor: pointer; width: 100%; border-radius: 3px; font-size: 12px;">
                Reset All
            </button>
        </div>

        <div>
            <button onclick="removePositioningTool()" style="padding: 6px 10px; border: 1px solid #dc3545; background: #dc3545; color: white; cursor: pointer; width: 100%; border-radius: 3px; font-size: 12px;">
                Close Tool
            </button>
        </div>
    `;

    document.body.appendChild(toolPanel);
}

// Global variables
let currentPieceX = 0;
let currentPieceY = 0;
let currentBorderSize = 30;
let squareBordersVisible = false;

// Adjust border size (this is the main adjustment!)
window.adjustBorderSize = function(delta) {
    currentBorderSize += delta;
    
    if (window.game && window.game.board) {
        window.game.board.adjustBorderSize(currentBorderSize);
    }
    
    updateDisplayValues();
    console.log(`Border size adjusted to: ${currentBorderSize}px`);
}

// Fine-tune piece positioning
window.adjustPieces = function(deltaX, deltaY) {
    currentPieceX += deltaX;
    currentPieceY += deltaY;
    
    if (window.game && window.game.board) {
        window.game.board.adjustPiecePositioning(currentPieceX, currentPieceY);
    }
    
    updateDisplayValues();
    console.log(`Pieces fine-tuned: X=${currentPieceX}, Y=${currentPieceY}`);
}

// Toggle square borders
window.toggleSquareBorders = function() {
    squareBordersVisible = !squareBordersVisible;
    const squares = document.querySelectorAll('.board-square');
    
    squares.forEach(square => {
        if (squareBordersVisible) {
            square.style.border = '2px solid rgba(255,0,0,0.8)';
            square.style.boxSizing = 'border-box';
        } else {
            square.style.border = 'none';
        }
    });
    
    console.log(`Square borders ${squareBordersVisible ? 'enabled' : 'disabled'}`);
}

// Reset positions
window.resetPositions = function() {
    currentPieceX = 0;
    currentPieceY = 0;
    currentBorderSize = 30;
    
    if (window.game && window.game.board) {
        window.game.board.adjustBorderSize(30);
        window.game.board.adjustPiecePositioning(0, 0);
    }
    
    if (squareBordersVisible) {
        toggleSquareBorders();
    }
    
    updateDisplayValues();
    console.log('All positions reset to default');
}

// Show perfect values
window.showCurrentValues = function() {
    const values = {
        borderSize: currentBorderSize,
        pieceOffsetX: currentPieceX,
        pieceOffsetY: currentPieceY
    };
    
    const message = `🎯 Perfect Values for Your Wooden Board!

Border Size: ${currentBorderSize}px
Piece Offsets: X=${currentPieceX}, Y=${currentPieceY}

These values will be saved permanently!`;

    alert(message);
    console.log('🎯 Perfect wooden board values:', values);
    
    if (navigator.clipboard) {
        const copyText = `borderSize: ${currentBorderSize}, pieceOffsetX: ${currentPieceX}, pieceOffsetY: ${currentPieceY}`;
        navigator.clipboard.writeText(copyText);
        console.log('📋 Values copied to clipboard!');
    }
}

// Update display values
function updateDisplayValues() {
    const borderElement = document.getElementById('border-size');
    const squareSizeElement = document.getElementById('square-size');
    const pieceXElement = document.getElementById('piece-x');
    const pieceYElement = document.getElementById('piece-y');
    
    if (borderElement) borderElement.textContent = currentBorderSize;
    if (pieceXElement) pieceXElement.textContent = currentPieceX;
    if (pieceYElement) pieceYElement.textContent = currentPieceY;
    
    // Calculate and show square size
    if (window.game && window.game.board && squareSizeElement) {
        const calculatedSquareSize = Math.round(window.game.board.squareSize);
        squareSizeElement.textContent = calculatedSquareSize;
    }
}

// Remove tool
window.removePositioningTool = function() {
    const tool = document.getElementById('positioning-tool');
    if (tool) {
        tool.remove();
    }
    
    if (squareBordersVisible) {
        toggleSquareBorders();
    }
    
    console.log('Positioning tool removed');
}

// Initialize
function initializePositioningTool() {
    const checkGameReady = setInterval(() => {
        if (window.game && window.game.board) {
            clearInterval(checkGameReady);
            createPositioningTool();
            updateDisplayValues();
            console.log('🎯 Wooden board positioning tool ready!');
            console.log('💡 Start with border size adjustment (red buttons) to match your wooden squares');
        }
    }, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePositioningTool);
} else {
    initializePositioningTool();
}
