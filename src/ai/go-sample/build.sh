#!/bin/bash

# Check if TinyGo is available
if ! command -v tinygo &> /dev/null; then
    echo "Error: tinygo is not installed or not in PATH"
    echo "Please install TinyGo: https://tinygo.org/getting-started/install/"
    exit 1
fi

# Get the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/../../.."

# Create output directory
mkdir -p "$PROJECT_ROOT/public/wasm"

# Change to the go-sample directory
cd "$SCRIPT_DIR"

# Compile the Go code to WebAssembly using TinyGo
# TinyGo is used instead of standard Go compiler for smaller WASM files
tinygo build -o "$PROJECT_ROOT/public/wasm/go_sample.wasm" -target wasm -no-debug go_sample.go

echo "Compilation complete. WebAssembly module saved to public/wasm/go_sample.wasm"
