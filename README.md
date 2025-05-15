# Top-Down Car Game with AI Competition

A top-down car game built with TypeScript where players can drive manually or compete by submitting AI drivers compiled to WebAssembly.

## Features

- Drive the car using arrow keys
- Brake using the space bar
- Simple road environment
- Support for AI-controlled cars via WebAssembly
- Competition framework for submitting custom AI implementations

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine
- For AI development: A language that compiles to WebAssembly (C/C++, Rust, etc.)

### Installation

1. Clone this repository or download the source code
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Running the Game

Start the development server:

```bash
npm start
```

This will open the game in your default web browser.

### Building for Production

To build the project for production:

```bash
npm run build
```

## Controls

- **Up Arrow**: Accelerate
- **Down Arrow**: Reverse
- **Left/Right Arrows**: Turn the car
- **Space Bar**: Brake

## AI Competition

This project includes a framework for an AI competition where participants can submit their own AI implementations to control cars in the game.

### How It Works

1. Participants write AI code in any language that compiles to WebAssembly
2. The AI receives car and environment data as input
3. The AI returns control signals (accelerate, brake, turn left/right)
4. Cars compete based on performance metrics like lap time

See [COMPETITION.md](COMPETITION.md) for detailed instructions on creating and submitting your AI.

## Project Structure

- `src/`: Source code
  - `ai/`: AI implementation framework
    - `CarAI.ts`: Interface for AI implementations
    - `WasmAI.ts`: WebAssembly AI adapter
    - `c-sample/`: Sample C implementation for WebAssembly
    - `rust-sample/`: Sample Rust implementation for WebAssembly
    - `assemblyscript-sample/`: Sample AssemblyScript implementation for WebAssembly
  - `car.ts`: Car physics and rendering
  - `road.ts`: Road environment
  - `game.ts`: Game logic
  - `input.ts`: Input handling
- `public/wasm/`: Directory for WebAssembly AI modules

## Technologies Used

- TypeScript
- HTML5 Canvas
- Vite
- WebAssembly
