#!/bin/bash

# Check if emcc is available
if ! command -v emcc &> /dev/null; then
    echo "Error: Emscripten compiler (emcc) not found."
    echo "Please install Emscripten: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Create output directory
mkdir -p ../../../public/wasm

# Compile the C code to WebAssembly
emcc sample_ai.c \
    -o ../../../public/wasm/sample_ai.wasm \
    -s WASM=1 \
    -s EXPORTED_FUNCTIONS="['_allocate_input', '_allocate_output', '_process', '_cleanup', '_malloc', '_free']" \
    -s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap']" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="SampleAI" \
    -O3

echo "Compilation complete. WebAssembly module saved to public/wasm/sample_ai.wasm"
