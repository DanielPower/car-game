.PHONY: build clean install deps

# Default target
build:
	cargo build --target wasm32-unknown-unknown --release
	@echo "Built: target/wasm32-unknown-unknown/release/car_ai_simple.wasm"

# Clean build artifacts
clean:
	cargo clean

# Copy to public directory
install: build
	cp target/wasm32-unknown-unknown/release/car_ai_simple.wasm ../../public/

# Install dependencies
deps:
	rustup target add wasm32-unknown-unknown

# Test build
test: build
	@echo "Build successful. Use 'make install' to copy to public directory."