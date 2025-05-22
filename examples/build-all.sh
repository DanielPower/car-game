#!/bin/bash

# Build script for all WebAssembly AI examples

set -e

echo "Building all WebAssembly AI examples..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create public directory if it doesn't exist
mkdir -p ../public

# Build Rust example
echo -e "\n${GREEN}Building Rust AI...${NC}"
cd rust-ai-simple
if command -v cargo &> /dev/null; then
    if rustup target list --installed | grep -q wasm32-unknown-unknown; then
        make build
        make install
        echo -e "${GREEN}✓ Rust AI built successfully${NC}"
    else
        echo -e "${RED}✗ wasm32-unknown-unknown target not installed. Run: rustup target add wasm32-unknown-unknown${NC}"
    fi
else
    echo -e "${RED}✗ Cargo not found. Please install Rust.${NC}"
fi
cd ..

# Build C++ example
echo -e "\n${GREEN}Building C++ AI...${NC}"
cd cpp-ai-simple
if command -v emcc &> /dev/null; then
    make build
    make install
    echo -e "${GREEN}✓ C++ AI built successfully${NC}"
else
    echo -e "${RED}✗ Emscripten not found. Please install Emscripten.${NC}"
fi
cd ..

echo -e "\n${GREEN}Build complete!${NC}"
echo "WASM files have been copied to the public directory."
echo ""
echo "To use in the game, update the AI loading code to use:"
echo "  - ./car_ai_simple.wasm (Rust)"
echo "  - ./car_ai_simple.wasm (C++)"