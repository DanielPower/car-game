.PHONY: build clean install

# Emscripten compiler
EMCC = emcc

# Compiler flags
CFLAGS = -O3 -s WASM=1 -s EXPORTED_FUNCTIONS='["_process"]' -s EXPORTED_RUNTIME_METHODS='[]' --no-entry

# Target
TARGET = car_ai_simple.wasm

# Default target
build:
	$(EMCC) $(CFLAGS) -o $(TARGET) car_ai.cpp
	@echo "Built: $(TARGET)"

# Clean build artifacts
clean:
	rm -f $(TARGET) $(TARGET:.wasm=.js)

# Copy to public directory
install: build
	cp $(TARGET) ../../../public/

# Install dependencies
deps:
	@echo "Install Emscripten from https://emscripten.org/docs/getting_started/downloads.html"