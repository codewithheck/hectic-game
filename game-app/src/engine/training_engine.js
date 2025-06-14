// src/engine/training_engine.js
// Last updated: 2025-06-14 01:49:01
// Author: codewithheck
// Version: 2.0.0

import { TacticalRecognizer } from './training/tactical_recognizer.js';
import { TrainingAnalyzer } from './training/training_analyzer.js';
import trainingConfig from '../data/training_mode.json';

export class TrainingEngine {
    constructor() {
        this.analyzer = new TrainingAnalyzer();
        this.tacticalRecognizer = new TacticalRecognizer();
        this.config = trainingConfig;
        this.currentSession = null;
        this.userMetrics = this.initializeUserMetrics();
    }

    initializeUserMetrics() {
        return {
            tacticalRating: this.config.progressTracking.ratings.tactical.initial,
            positionalRating: this.config.progressTracking.ratings.positional.initial,
            accuracy: [],
            tacticalAwareness: [],
            timeManagement: [],
            strengths: new Set(),
            weaknesses: new Set(),
            lastUpdated: new Date().toISOString()
        };
    }

    async startTrainingSession(mode = 'adaptive') {
        this.currentSession = {
            mode,
            startTime: Date.now(),
            exercises: [],
            currentExercise: null,
            analysis: null,
            score: 0,
            mistakes: [],
            feedback: [],
            statistics: {
                totalMoves: 0,
                correctMoves: 0,
                tacticalOpportunities: 0,
                tacticalMissed: 0
            }
        };

        return this.generateNextExercise();
    }

    async evaluateMove(move, timeSpent) {
        if (!this.currentSession?.currentExercise) {
            throw new Error('No active exercise');
        }

        const board = this.currentSession.currentExercise.board;
        const player = this.currentSession.currentExercise.player;

        const tacticalAnalysis = this.tacticalRecognizer.analyzeTacticalPositions(board, player);
        const positionAnalysis = await this.analyzer.analyzePosition(board, player, 
            this.currentSession.currentExercise.moveHistory);

        const evaluation = {
            accuracy: this.calculateMoveAccuracy(move, tacticalAnalysis),
            tactical: this.evaluateTacticalAwareness(move, tacticalAnalysis),
            positional: this.evaluatePositionalUnderstanding(move, positionAnalysis),
            timing: this.evaluateTiming(timeSpent),
            improvement: this.calculateImprovement(),
            timestamp: new Date().toISOString()
        };

        this.updateMetrics(evaluation);
        this.updateSessionStatistics(evaluation, tacticalAnalysis);

        return {
            evaluation,
            feedback: this.generateFeedback(evaluation, tacticalAnalysis, positionAnalysis),
            improvements: this.suggestImprovements(evaluation),
            statistics: this.currentSession.statistics
        };
    }

    calculateMoveAccuracy(move, tacticalAnalysis) {
        const bestValue = Math.max(
            ...tacticalAnalysis.shots.map(s => s.value),
            ...tacticalAnalysis.combinations.map(c => c.value),
            ...tacticalAnalysis.threats.map(t => t.value)
        );

        if (bestValue === 0) return 1.0; // No tactical opportunities

        const moveValue = this.getMoveValue(move, tacticalAnalysis);
        return moveValue / bestValue;
    }

    evaluateTacticalAwareness(move, tacticalAnalysis) {
        const tacticalOpportunities = tacticalAnalysis.tacticalValue > 0;
        const tookTacticalMove = this.getMoveValue(move, tacticalAnalysis) > 0;

        return tacticalOpportunities ? (tookTacticalMove ? 1.0 : 0.0) : 1.0;
    }

    evaluatePositionalUnderstanding(move, positionAnalysis) {
        return positionAnalysis.strategic.evaluation;
    }

    evaluateTiming(timeSpent) {
        const optimalTime = this.currentSession.currentExercise.optimalTime || 30000;
        return Math.max(0, 1 - Math.abs(timeSpent - optimalTime) / optimalTime);
    }

    calculateImprovement() {
        if (this.userMetrics.accuracy.length < 2) return 0;
        
        const recentAccuracy = this.userMetrics.accuracy.slice(-10);
        const average = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
        
        return average(recentAccuracy) - average(this.userMetrics.accuracy.slice(-20, -10));
    }

    getMoveValue(move, tacticalAnalysis) {
        const allMoves = [
            ...tacticalAnalysis.shots,
            ...tacticalAnalysis.combinations,
            ...tacticalAnalysis.threats
        ];

        const matchingMove = allMoves.find(m => 
            m.move.from === move.from && m.move.to === move.to);

        return matchingMove ? matchingMove.value : 0;
    }

    updateMetrics(evaluation) {
        this.userMetrics.accuracy.push(evaluation.accuracy);
        this.userMetrics.tacticalAwareness.push(evaluation.tactical);
        this.userMetrics.timeManagement.push(evaluation.timing);
        this.userMetrics.lastUpdated = new Date().toISOString();

        // Update ratings
        const kFactor = this.config.progressTracking.ratings.tactical.kFactor;
        const expectedScore = 1 / (1 + Math.pow(10, 
            (this.config.progressTracking.ratings.tactical.initial - 
             this.userMetrics.tacticalRating) / 400));
        
        this.userMetrics.tacticalRating += kFactor * (evaluation.tactical - expectedScore);
    }

    updateSessionStatistics(evaluation, tacticalAnalysis) {
        this.currentSession.statistics.totalMoves++;
        if (evaluation.accuracy > 0.8) {
            this.currentSession.statistics.correctMoves++;
        }
        if (tacticalAnalysis.tacticalValue > 0) {
            this.currentSession.statistics.tacticalOpportunities++;
            if (evaluation.tactical < 0.5) {
                this.currentSession.statistics.tacticalMissed++;
            }
        }
    }

    generateFeedback(evaluation, tacticalAnalysis, positionAnalysis) {
        const feedback = [];

        // Tactical feedback
        if (tacticalAnalysis.tacticalValue > 0) {
            if (evaluation.tactical < 0.5) {
                feedback.push({
                    type: 'tactical',
                    priority: 'high',
                    message: `Missed tactical opportunity: ${
                        tacticalAnalysis.shots[0]?.description || 
                        tacticalAnalysis.combinations[0]?.description || 
                        tacticalAnalysis.threats[0]?.description
                    }`
                });
            } else {
                feedback.push({
                    type: 'tactical',
                    priority: 'medium',
                    message: 'Good tactical awareness shown in this move.'
                });
            }
        }

        // Positional feedback
        feedback.push({
            type: 'positional',
            priority: 'medium',
            message: this.generatePositionalFeedback(positionAnalysis)
        });

        // Timing feedback
        if (evaluation.timing < 0.5) {
            feedback.push({
                type: 'timing',
                priority: 'low',
                message: 'Consider managing your time more effectively.'
            });
        }

        return feedback;
    }

    generatePositionalFeedback(positionAnalysis) {
        const { centerControl, mobility, structure } = positionAnalysis.strategic;
        
        if (centerControl < 0.3) {
            return 'Focus on controlling the center squares.';
        }
        if (mobility < 0.3) {
            return 'Look for ways to improve piece mobility.';
        }
        if (structure < 0.3) {
            return 'Work on maintaining a solid pawn structure.';
        }
        
        return 'Good positional understanding shown.';
    }

    suggestImprovements(evaluation) {
        const suggestions = [];

        if (evaluation.tactical < 0.5) {
            suggestions.push({
                area: 'Tactical',
                message: 'Practice tactical pattern recognition',
                exercises: ['Combination Spotting', 'Tactical Puzzles']
            });
        }

        if (evaluation.positional < 0.5) {
            suggestions.push({
                area: 'Positional',
                message: 'Study positional concepts',
                exercises: ['Center Control', 'Piece Coordination']
            });
        }

        if (evaluation.timing < 0.5) {
            suggestions.push({
                area: 'Time Management',
                message: 'Practice time management',
                exercises: ['Rapid Analysis', 'Decision Making']
            });
        }

        return suggestions;
    }

    getTrainingReport() {
        return {
            currentRating: this.userMetrics.tacticalRating,
            accuracy: {
                recent: average(this.userMetrics.accuracy.slice(-10)),
                overall: average(this.userMetrics.accuracy)
            },
            tacticalAwareness: {
                recent: average(this.userMetrics.tacticalAwareness.slice(-10)),
                overall: average(this.userMetrics.tacticalAwareness)
            },
            timeManagement: {
                recent: average(this.userMetrics.timeManagement.slice(-10)),
                overall: average(this.userMetrics.timeManagement)
            },
            improvement: this.calculateImprovement(),
            statistics: this.currentSession?.statistics || {},
            lastUpdated: this.userMetrics.lastUpdated
        };
    }

    cleanup() {
        this.tacticalRecognizer.clearCache();
        this.currentSession = null;
    }
}

function average(arr) {
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

export const TRAINING_ENGINE_VERSION = {
    version: "2.0.0",
    lastUpdated: "2025-06-14 01:49:01",
    author: "codewithheck",
    features: {
        tacticalRecognition: true,
        positionAnalysis: true,
        adaptiveDifficulty: true,
        progressTracking: true,
        feedback: true
    }
};
