#!/bin/bash

# Check if emcc (Emscripten compiler) is available
if ! command -v emcc &> /dev/null; then
    echo "Error: emcc (Emscripten) is not installed or not in PATH"
    echo "Please install Emscripten: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Create output directory
mkdir -p ../../../public/wasm

# Compile the C code to a standalone WebAssembly file
# Using minimal flags for maximum compatibility
emcc c_sample.c \
    -o ../../../public/wasm/c_sample.wasm \
    -s WASM=1 \
    -s STANDALONE_WASM \
    -s INITIAL_MEMORY=65536 \
    -s TOTAL_STACK=16384 \
    -s EXPORTED_FUNCTIONS=[] \
    -s EXPORTED_RUNTIME_METHODS=[] \
    --no-entry \
    -O3

echo "Compilation complete. Standalone WebAssembly module saved to public/wasm/c_sample.wasm"
