# Test Helper

Generate tests for your functions with one click! Supports multiple languages and test frameworks.

## Features

- 🧪 **One-click test generation** - Click the button above any function to generate a test
- 🐍 **Python support** - pytest and unittest templates
- ⚡ **C++ support** - Google Test and Catch2 templates  
- 🎨 **Customizable templates** - Configure your own test templates
- 📁 **Smart file structure** - Automatically creates test files in `tests/` folder
- 🔧 **Multiple frameworks** - Support for different testing frameworks

## Usage

### For Python:
1. Open a Python file with functions
2. Click the "🧪 Generate Test" button above any function
3. Test file will be created in `tests/` folder

### For C++:
1. Open a C++ file with functions
2. Click the "🧪 Generate Test" button above any function  
3. Test file will be created with Google Test or Catch2 template

### Customizing Templates:
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "Configure Test Templates"
3. Modify templates for different languages
4. Save and generate tests with your custom templates

## Supported Languages

- Python (pytest, unittest)
- C++ (Google Test, Catch2)
- JavaScript/TypeScript (coming soon)

## Configuration

The extension provides these settings:

- `testHelper.testFramework`: Default test framework
- `testHelper.testLocation`: Where to create test files
- `testHelper.pythonTemplate`: Custom Python test template
- `testHelper.cppTemplate`: Custom C++ test template

## Example

**Before:**
```python
def calculate_sum(a, b):
    return a + b