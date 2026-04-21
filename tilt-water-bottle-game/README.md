# Tilt Water Bottle Game

## Overview
The Tilt Water Bottle Game is an interactive mobile game where players control a character holding a water bottle. By tilting their device, players can influence the amount of water that spills from the bottle as the character moves forward. The objective is to navigate through various challenges while managing the water level in the bottle.

## Project Structure
```
tilt-water-bottle-game
├── src
│   ├── index.html        # Main HTML document for the game
│   ├── css
│   │   └── style.css     # Styles for the game
│   ├── js
│   │   ├── main.js       # Entry point for the game's JavaScript
│   │   ├── physics.js    # Physics calculations for water behavior
│   │   └── input.js      # Handles user input and device tilt
│   └── assets
│       ├── audio         # Directory for audio files
│       └── data          # Directory for additional data files
├── package.json          # npm configuration file
├── .gitignore            # Git ignore file
└── README.md             # Project documentation
```

## Getting Started

### Prerequisites
- Node.js and npm installed on your machine.

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd tilt-water-bottle-game
   ```
3. Install the dependencies:
   ```
   npm install
   ```

### Running the Game
To start the game, open `src/index.html` in a web browser. For mobile devices, ensure that you allow access to device orientation to control the tilt.

### Controls
- Tilt your device to control the water spilling from the bottle.
- Navigate through the game while managing the water level.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.