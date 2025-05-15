#!/bin/bash

# Check if cargo is available
if ! command -v cargo &> /dev/null; then
    echo "Error: cargo (Rust) is not installed or not in PATH"
    echo "Please install Rust: https://www.rust-lang.org/tools/install"
    exit 1
fi

# Create output directory
mkdir -p ../../../public/wasm

# Build the Rust project in release mode
cargo build --release --target wasm32-unknown-unknown

# Check if wasm-bindgen-cli is available
if ! command -v wasm-bindgen &> /dev/null; then
    echo "Warning: wasm-bindgen-cli is not installed. Installing it now..."
    cargo install wasm-bindgen-cli
fi

# Optimize the wasm file (optional but recommended)
if command -v wasm-opt &> /dev/null; then
    echo "Optimizing WebAssembly file..."
    wasm-opt -Oz target/wasm32-unknown-unknown/release/rust_sample.wasm -o ../../../public/wasm/rust_sample.wasm
else
    echo "Warning: wasm-opt not found, skipping optimization"
    # Just copy the file if wasm-opt is not available
    cp target/wasm32-unknown-unknown/release/rust_sample.wasm ../../../public/wasm/rust_sample.wasm
fi

echo "Compilation complete. Standalone WebAssembly module saved to public/wasm/rust_sample.wasm"
