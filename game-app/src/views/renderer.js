/**
 * International Draughts Renderer Implementation
 * Handles smooth piece animations and visual transitions
 * @author codewithheck
 * Created: 2025-06-16 19:51:12 UTC
 */

import { BOARD_SIZE } from '../engine/constants.js';

export class Renderer {
    constructor() {
        this.animations = new Map();
        this.lastTimestamp = 0;
        this.isAnimating = false;
        this.requestId = null;
    }

    /**
     * Animates a piece movement
     * @param {HTMLElement} piece The piece element to animate
     * @param {Object} from Starting position {row, col}
     * @param {Object} to Ending position {row, col}
     * @param {Function} onComplete Callback when animation completes
     * @param {number} duration Animation duration in ms (default: 300)
     */
    animateMove(piece, from, to, onComplete, duration = 300) {
        if (!piece) return;

        const fromPos = this.getSquarePosition(from.row, from.col);
        const toPos = this.getSquarePosition(to.row, to.col);
        
        const animation = {
            element: piece,
            startTime: null,
            duration: duration,
            startPos: fromPos,
            endPos: toPos,
            onComplete: onComplete
        };

        this.animations.set(piece, animation);
        this.startAnimationLoop();
    }

    /**
     * Animates a piece capture
     * @param {HTMLElement} piece The piece element to animate
     * @param {Function} onComplete Callback when animation completes
     * @param {number} duration Animation duration in ms (default: 300)
     */
    animateCapture(piece, onComplete, duration = 300) {
        if (!piece) return;

        const animation = {
            element: piece,
            startTime: null,
            duration: duration,
            startScale: 1,
            endScale: 0,
            onComplete: onComplete,
            type: 'capture'
        };

        this.animations.set(piece, animation);
        this.startAnimationLoop();
    }

    /**
     * Animates a piece promotion
     * @param {HTMLElement} piece The piece element to animate
     * @param {Function} onComplete Callback when animation completes
     * @param {number} duration Animation duration in ms (default: 500)
     */
    animatePromotion(piece, onComplete, duration = 500) {
        if (!piece) return;

        const animation = {
            element: piece,
            startTime: null,
            duration: duration,
            startScale: 1,
            midScale: 1.2,
            endScale: 1,
            onComplete: onComplete,
            type: 'promotion'
        };

        this.animations.set(piece, animation);
        this.startAnimationLoop();
    }

    /**
     * Starts the animation loop if not already running
     */
    startAnimationLoop() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.lastTimestamp = performance.now();
            this.requestId = requestAnimationFrame((timestamp) => this.animate(timestamp));
        }
    }

    /**
     * Main animation loop
     * @param {number} timestamp Current timestamp
     */
    animate(timestamp) {
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        for (const [piece, animation] of this.animations.entries()) {
            if (!animation.startTime) {
                animation.startTime = timestamp;
            }

            const progress = Math.min((timestamp - animation.startTime) / animation.duration, 1);
            const eased = this.easeInOutCubic(progress);

            if (animation.type === 'capture') {
                this.updateCaptureAnimation(piece, animation, eased);
            } else if (animation.type === 'promotion') {
                this.updatePromotionAnimation(piece, animation, eased);
            } else {
                this.updateMoveAnimation(piece, animation, eased);
            }

            if (progress >= 1) {
                if (animation.onComplete) {
                    animation.onComplete();
                }
                this.animations.delete(piece);
            }
        }

        if (this.animations.size > 0) {
            this.requestId = requestAnimationFrame((timestamp) => this.animate(timestamp));
        } else {
            this.isAnimating = false;
            this.requestId = null;
        }
    }

    /**
     * Updates the position of a moving piece
     * @param {HTMLElement} piece The piece element
     * @param {Object} animation Animation data
     * @param {number} eased Eased progress value
     */
    updateMoveAnimation(piece, animation, eased) {
        const currentX = animation.startPos.x + (animation.endPos.x - animation.startPos.x) * eased;
        const currentY = animation.startPos.y + (animation.endPos.y - animation.startPos.y) * eased;
        
        piece.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }

    /**
     * Updates the scale of a captured piece
     * @param {HTMLElement} piece The piece element
     * @param {Object} animation Animation data
     * @param {number} eased Eased progress value
     */
    updateCaptureAnimation(piece, animation, eased) {
        const currentScale = animation.startScale + (animation.endScale - animation.startScale) * eased;
        piece.style.transform = `scale(${currentScale})`;
        piece.style.opacity = 1 - eased;
    }

    /**
     * Updates the scale of a promoted piece
     * @param {HTMLElement} piece The piece element
     * @param {Object} animation Animation data
     * @param {number} eased Eased progress value
     */
    updatePromotionAnimation(piece, animation, eased) {
        let currentScale;
        if (eased < 0.5) {
            currentScale = animation.startScale + (animation.midScale - animation.startScale) * (eased * 2);
        } else {
            currentScale = animation.midScale + (animation.endScale - animation.midScale) * ((eased - 0.5) * 2);
        }
        piece.style.transform = `scale(${currentScale})`;
    }

    /**
     * Gets the pixel position of a square
     * @param {number} row Board row
     * @param {number} col Board column
     * @returns {Object} Position {x, y}
     */
    getSquarePosition(row, col) {
        const squareSize = 50; // Default square size in pixels
        return {
            x: col * squareSize,
            y: row * squareSize
        };
    }

    /**
     * Easing function for smooth animations
     * @param {number} t Progress value (0 to 1)
     * @returns {number} Eased value
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * Stops all current animations
     */
    stopAnimations() {
        if (this.requestId) {
            cancelAnimationFrame(this.requestId);
            this.requestId = null;
        }
        this.animations.clear();
        this.isAnimating = false;
    }

    /**
     * Updates the square size for calculations
     * @param {number} size New square size in pixels
     */
    updateSquareSize(size) {
        this.squareSize = size;
    }
}
