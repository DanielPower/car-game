#!/bin/bash

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed or not in PATH"
    echo "Please install Node.js and npm: https://nodejs.org/"
    exit 1
fi

# Check if AssemblyScript compiler is installed
if ! npm list -g assemblyscript &> /dev/null; then
    echo "Installing AssemblyScript compiler..."
    npm install -g assemblyscript
fi

# Create output directory
mkdir -p ../../../public/wasm

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Compile the AssemblyScript code to WebAssembly
echo "Compiling AssemblyScript to WebAssembly..."
npx asc simple_ai.ts --target release -o ../../../public/wasm/simple_ai.wasm --use abort= --optimize

echo "Compilation complete. WebAssembly module saved to public/wasm/simple_ai.wasm"
