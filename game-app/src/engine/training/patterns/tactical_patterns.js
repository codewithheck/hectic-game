// src/engine/training/patterns/tactical_patterns.js
// Last updated: 2025-06-14 01:49:01
// Author: codewithheck
// Version: 1.0.0

export const TACTICAL_PATTERNS = {
    SHOTS: {
        COUP_TURC: {
            name: "Coup Turc",
            description: "A tactical shot involving a sacrifice to gain positional advantage",
            pattern: [
                { from: [-2, -2], to: [2, 2], capture: [0, 0] },
                { requires: "empty", at: [2, 2] }
            ],
            value: 3
        },
        COUP_PHILIPPE: {
            name: "Coup Philippe",
            description: "A devastating multi-capture combination",
            pattern: [
                { from: [-1, -1], to: [1, 1], capture: [0, 0] },
                { from: [1, 1], to: [3, 3], capture: [2, 2] }
            ],
            value: 4
        },
        COUP_NAPOLEON: {
            name: "Coup Napoleon",
            description: "A powerful back-rank breakthrough",
            pattern: [
                { from: [-1, 1], to: [1, -1], capture: [0, 0] },
                { requires: "king", at: [-1, 1] }
            ],
            value: 5
        }
    },
    COMBINATIONS: {
        DOUBLE_CAPTURE: {
            name: "Double Capture",
            description: "A sequence involving two consecutive captures",
            pattern: [
                { sequence: true, captures: 2 }
            ],
            value: 2
        },
        TRIPLE_CAPTURE: {
            name: "Triple Capture",
            description: "A powerful sequence with three consecutive captures",
            pattern: [
                { sequence: true, captures: 3 }
            ],
            value: 3
        }
    },
    THREATS: {
        FORK: {
            name: "Fork",
            description: "Threatening two or more pieces simultaneously",
            pattern: [
                { threatens: 2, within: 2 }
            ],
            value: 2
        },
        BREAKTHROUGH: {
            name: "Breakthrough",
            description: "A forcing sequence leading to promotion",
            pattern: [
                { to: "promotion", forced: true }
            ],
            value: 4
        }
    }
};

export const PATTERN_VERSION = {
    version: "1.0.0",
    lastUpdated: "2025-06-14 01:49:01",
    author: "codewithheck",
    totalPatterns: Object.keys(TACTICAL_PATTERNS).reduce((sum, key) => 
        sum + Object.keys(TACTICAL_PATTERNS[key]).length, 0)
};
