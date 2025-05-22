# CMake build file for Car AI WebAssembly module with binary interface
cmake_minimum_required(VERSION 3.13)
project(car_ai_binary)

# Set C++ standard
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find Emscripten
if(NOT DEFINED EMSCRIPTEN)
    message(FATAL_ERROR "This CMake file is designed to be used with Emscripten. Please use emcmake.")
endif()

# Add executable
add_executable(car_ai_binary car_ai.cpp)

# Configure Emscripten-specific flags
set_target_properties(car_ai_binary PROPERTIES
    SUFFIX ".wasm"
    LINK_FLAGS "-s WASM=1 -s EXPORTED_FUNCTIONS=['_initialize','_process','_allocate','_deallocate'] -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap'] -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 -s EXPORT_ES6=1 -s USE_ES6_IMPORT_META=0 -s ENVIRONMENT='web' -O3"
)

# Install the compiled WASM to the output directory
install(TARGETS car_ai_binary DESTINATION ${CMAKE_CURRENT_SOURCE_DIR}/../..)