// src/utils/opening-book.js

class OpeningBook {
    static instance = null;
    openings = [];
    
    constructor() {
        if (OpeningBook.instance) {
            throw new Error('Use OpeningBook.getInstance() instead of new constructor');
        }
    }
    
    static async getInstance() {
        if (!OpeningBook.instance) {
            OpeningBook.instance = new OpeningBook();
            await OpeningBook.instance.initialize();
        }
        return OpeningBook.instance;
    }
    
    async initialize() {
        try {
            const response = await fetch('/src/data/openings.json');
            if (!response.ok) {
                throw new Error('Failed to load opening book');
            }
            this.openings = await response.json();
        } catch (error) {
            console.error('Opening book parse error:', error);
            this.openings = [];
        }
    }

    getOpeningMoves(position) {
        // Add method to get moves for current position
        return this.openings.openings
            .filter(opening => opening.fen === position)
            .map(opening => opening.moves)
            .flat();
    }

    getEvaluation(position) {
        // Add method to get position evaluation
        const opening = this.openings.openings.find(o => o.fen === position);
        return opening ? opening.evaluation : null;
    }
}

export default OpeningBook;
