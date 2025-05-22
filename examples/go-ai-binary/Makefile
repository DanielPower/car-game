# Makefile for TinyGo WebAssembly Car AI with Binary Interface

.PHONY: all clean

TINYGO ?= tinygo
OUTPUT_DIR = ./dist

all: $(OUTPUT_DIR) $(OUTPUT_DIR)/car_ai_binary.wasm

$(OUTPUT_DIR):
	mkdir -p $(OUTPUT_DIR)

$(OUTPUT_DIR)/car_ai_binary.wasm: main.go
	$(TINYGO) build -o $(OUTPUT_DIR)/car_ai_binary.wasm -target wasm -no-debug main.go

clean:
	rm -rf $(OUTPUT_DIR)

# Build command example:
# make TINYGO=path/to/tinygo