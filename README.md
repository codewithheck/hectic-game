# hectic-game
10x10 draught game with mirror flipped horizontal board
# Hectic - International Draughts Game

![Board Preview](https://github.com/codewithheck/hectic-game/blob/main/game-app/assets/images/flipped_board.jpg)

## Overview
Modern implementation of International Draughts (10x10) with AI powered by neural networks and advanced game analysis. Created by [@codewithheck](https://github.com/codewithheck).

**Last Updated:** 2025-06-16 23:11:39 UTC

## Features

### Game Play
- 🎮 Full International Draughts rules implementation
- 👑 Support for kings and mandatory captures
- 🔄 Move history with undo/redo functionality
- ⏱️ Optional time control with 60-second moves
- 📸 Export/import positions as PNG

### AI Engine
- 🧠 6 AI difficulty levels (Beginner to Grandmaster)
- 🤖 Neural network-based evaluation
- 📚 Comprehensive opening book with modern variations
- 🔍 Deep position analysis with quiescence search
- 💡 AI-influenced opening recommendations

### User Interface
- 🎨 Responsive and intuitive design
- 📱 Mobile-friendly layout
- 🎯 Visual move suggestions
- 📊 Real-time position evaluation
- 🔔 In-game notifications

## Installation

```bash
# Clone the repository
git clone https://github.com/codewithheck/hectic-game.git

# Navigate to game directory
cd hectic-game/game-app

# If you're using a local server (e.g., Python's built-in server)
python -m http.server 8000
```

## Project Structure

```
game-app/
├── assets/            # Game assets (images)
├── css/              # Global styles
├── src/              # Source code
│   ├── data/         # Game data (openings)
│   ├── engine/       # Game logic and AI
│   ├── utils/        # Utility functions
│   ├── views/        # UI components
│   └── main.js       # Entry point
└── vendors/          # Third-party libraries
```

## Game Modes

### Player vs AI
- 6 difficulty levels
- Adaptive AI thinking time
- Opening book knowledge
- Position evaluation display

### Player vs Player
- Local multiplayer
- Time control option
- Maximum capture rule
- Move validation

### Analysis Mode
- Import/export positions
- Engine analysis
- Opening explorer
- Move suggestions

## AI Difficulty Levels

| Level | Name | Depth | Features |
|-------|------|-------|----------|
| 1 | Beginner | 2 | Basic evaluation |
| 2 | Easy | 4 | Basic positional understanding |
| 3 | Intermediate | 6 | Tactical awareness |
| 4 | Advanced | 8 | Strategic planning |
| 5 | Expert | 10 | Deep calculation |
| 6 | Grandmaster | 12 | Full engine strength |

## Technical Details

### AI Implementation
- Negamax algorithm with alpha-beta pruning
- Transposition table for position caching
- Iterative deepening for time management
- Neural network position evaluation
- Advanced quiescence search

### Game Engine
- Complete rules implementation
- FEN position support
- Move generation optimization
- History tracking system

## Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 88+ |
| Firefox | 85+ |
| Safari | 14+ |
| Edge | 88+ |

## Development

### Prerequisites
- Modern web browser
- Local development server
- Basic understanding of JavaScript modules

### Running Tests
```bash
# Coming in future updates
```

## Contributing
1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- International Draughts Federation for rules and standards
- Modern AI research in game playing
- Open-source draughts engines for inspiration
- Contributors and testers

## Contact
- GitHub: [@codewithheck](https://github.com/codewithheck)
- Project Link: [https://github.com/codewithheck/hectic-game](https://github.com/codewithheck/hectic-game)

## Version History
- 2.0.0 (2025-06-16): Added AI engine improvements and modern opening analysis
- 1.1.0 (2025-05-15): Enhanced UI and added time control
- 1.0.0 (2025-04-01): Initial release
