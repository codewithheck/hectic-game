/**
 * International Draughts (10x10) Game Constants
 * Last Updated: 2025-06-16 18:46:49 UTC
 * Note: Board is MIRROR FLIPPED HORIZONTALLY - FIXED
 */

// Board configuration
export const BOARD_SIZE = 10;
export const TOTAL_SQUARES = BOARD_SIZE * BOARD_SIZE;
export const PLAYABLE_SQUARES = 50; // Only dark squares are playable

// Players
export const PLAYER = {
    WHITE: 0,
    BLACK: 1
};

// Piece types
export const PIECE = {
    NONE: 0,
    WHITE: 1,
    BLACK: 2,
    WHITE_KING: 3,
    BLACK_KING: 4
};

// Game modes
export const GAME_MODE = {
    NORMAL: 'normal',
    EDIT: 'edit'
};

// Move types
export const MOVE_TYPE = {
    NORMAL: 'normal',
    CAPTURE: 'capture',
    MULTI_CAPTURE: 'multiCapture'
};

// Game states
export const GAME_STATE = {
    ONGOING: 'ongoing',
    WHITE_WIN: 'whiteWin',
    BLACK_WIN: 'blackWin',
    DRAW: 'draw'
};

// Time control
export const TIME_CONTROL = {
    MOVE_TIME: 60, // seconds per move
    WARNING_TIME: 10 // seconds remaining for warning
};

// AI difficulty levels
export const AI_LEVEL = {
    BEGINNER: 1,
    EASY: 2,
    INTERMEDIATE: 3,
    ADVANCED: 4,
    EXPERT: 5,
    GRANDMASTER: 6
};

// AI search parameters
export const AI_PARAMS = {
    MAX_DEPTH: {
        1: 2,   // Beginner
        2: 4,   // Easy (-2 from Intermediate)
        3: 6,   // Intermediate (-2 from Advanced)
        4: 8,   // Advanced (-2 from Expert)
        5: 10,  // Expert (-2 from Grandmaster)
        6: 12   // Grandmaster
    },
    QUIESCENCE_DEPTH: {
        1: 0,   // Beginner - No quiescence search
        2: 1,   // Easy
        3: 3,   // Intermediate
        4: 5,   // Advanced
        5: 6,   // Expert
        6: 8    // Grandmaster
    },
    // Parameters for transposition table (memory cache)
    CACHE: {
        MAX_SIZE: 10000000,  // Maximum number of positions to store in memory
        ENTRY_TYPES: {
            EXACT: 0,        // Exact evaluation
            LOWER_BOUND: 1,  // Beta cutoff - actual value might be higher
            UPPER_BOUND: 2   // Alpha cutoff - actual value might be lower
        },
        // How long to keep positions in cache (in milliseconds)
        RETENTION_TIME: {
            1: 0,            // Beginner - No caching
            2: 0,            // Easy - No caching
            3: 60000,        // Intermediate - 1 minute
            4: 900000,       // Advanced - 15 minutes
            5: 1800000,      // Expert - 30 minutes
            6: 3600000       // Grandmaster - 1 hour
        }
    },
    // Parameters for iterative deepening
    ITERATIVE_DEEPENING: {
        TIME_ALLOCATION: {
            1: 500,         // Beginner - 0.5 seconds
            2: 1000,        // Easy - 1 second
            3: 2000,        // Intermediate - 2 seconds
            4: 15000,       // Advanced - 15 seconds
            5: 20000,       // Expert - 20 seconds
            6: 30000        // Grandmaster - 30 seconds
        },
        // Additional time for complex positions
        COMPLEX_POSITION_MULTIPLIER: {
            1: 1,           // Beginner - No additional time
            2: 1,           // Easy - No additional time
            3: 1.5,         // Intermediate
            4: 2.5,         // Advanced - Increased multiplier
            5: 2.8,         // Expert - Increased multiplier
            6: 3            // Grandmaster - Up to 3x time for complex positions
        }
    },
    // Opening book parameters
    OPENING_BOOK: {
        MAX_MOVES: {
            1: 4,          // Beginner - Only first 4 moves
            2: 6,          // Easy
            3: 8,          // Intermediate
            4: 12,         // Advanced - Increased book depth
            5: 14,         // Expert - Increased book depth
            6: 15          // Grandmaster - First 15 moves from book
        },
        RANDOMIZATION: {
            1: 0.8,        // Beginner - High randomization
            2: 0.6,        // Easy
            3: 0.4,        // Intermediate
            4: 0.15,       // Advanced - Lower randomization
            5: 0.08,       // Expert - Very low randomization
            6: 0.05        // Grandmaster - Minimal randomization
        }
    }
};

// Piece values for AI evaluation
export const PIECE_VALUE = {
    [PIECE.WHITE]: 100,
    [PIECE.BLACK]: -100,
    [PIECE.WHITE_KING]: 300,
    [PIECE.BLACK_KING]: -300
};

// Board position values for AI evaluation
export const POSITION_VALUE = {
    CENTER: 10,      // Center squares
    EDGE: -5,        // Edge squares
    BACK_ROW: 5,     // Back row protection
    PROMOTION: 15    // Squares close to promotion
};

// Direction vectors for moves (Standard international draughts)
export const DIRECTIONS = {
    WHITE_MOVES: [
        { dx: -1, dy: -1 },  // Up-left
        { dx: 1, dy: -1 }    // Up-right
    ],
    BLACK_MOVES: [
        { dx: -1, dy: 1 },   // Down-left
        { dx: 1, dy: 1 }     // Down-right
    ],
    KING_MOVES: [
        { dx: -1, dy: -1 },  // Up-left
        { dx: 1, dy: -1 },   // Up-right
        { dx: -1, dy: 1 },   // Down-left
        { dx: 1, dy: 1 }     // Down-right
    ]
};

// Square numbering (Standard International Draughts notation)
export const SQUARE_NUMBERS = [
    0,  1,  0,  2,  0,  3,  0,  4,  0,  5,
    6,  0,  7,  0,  8,  0,  9,  0,  10, 0,
    0,  11, 0,  12, 0,  13, 0,  14, 0,  15,
    16, 0,  17, 0,  18, 0,  19, 0,  20, 0,
    0,  21, 0,  22, 0,  23, 0,  24, 0,  25,
    26, 0,  27, 0,  28, 0,  29, 0,  30, 0,
    0,  31, 0,  32, 0,  33, 0,  34, 0,  35,
    36, 0,  37, 0,  38, 0,  39, 0,  40, 0,
    0,  41, 0,  42, 0,  43, 0,  44, 0,  45,
    46, 0,  47, 0,  48, 0,  49, 0,  50, 0
];

// DOM element IDs
export const DOM_IDS = {
    GAME_BOARD: 'game-board',
    BLACK_TIMER: 'black-timer',
    WHITE_TIMER: 'white-timer',
    MOVE_HISTORY: 'move-history',
    BEST_MOVE: 'best-move',
    EVAL_SCORE: 'eval-score',
    DIFFICULTY_LEVEL: 'difficulty-level',
    MAX_CAPTURE_RULE: 'max-capture-rule',
    TIME_CONTROL: 'time-control',
    EDIT_MODE: 'edit-mode',
    PNG_PROCESSOR: 'png-processor'
};

// FEN notation constants (Standard International Draughts starting position)
export const FEN = {
    // Standard starting position with 20 pieces each
    START_POSITION: 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20',
    PIECE_CHARS: {
        [PIECE.WHITE]: 'w',
        [PIECE.BLACK]: 'b',
        [PIECE.WHITE_KING]: 'W',
        [PIECE.BLACK_KING]: 'B'
    }
};

// PNG analysis constants
export const PNG_ANALYSIS = {
    SAMPLE_SIZE: 5,           // Pixels to sample for piece detection
    COLOR_THRESHOLD: 30,      // RGB difference threshold for color matching
    CROWN_OFFSET_Y: -10,      // Vertical offset for crown detection
    EMPTY_THRESHOLD: 240      // Brightness threshold for empty square detection
};
