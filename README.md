# Test Helper

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=evgeniiandronov.test-helper)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/EvgeniiAndronov/test-halper/blob/main/LICENSE)

Generate tests for your functions with one click! Supports multiple languages and test frameworks.

## Features

- 🧪 **One-click test generation** - Click the button above any function to generate a test
- 🐍 **Python support** - pytest and unittest templates
- 🎨 **Customizable templates** - Configure your own test templates
- 📁 **Smart file structure** - Automatically creates test files in `tests/` folder
- 🔧 **Multiple frameworks** - Support for different testing frameworks

## Quick Start

1. **Install the extension**
2. **Open a Python file** with functions:
```python
def calculate_sum(a, b):
    return a + b
```
3. **Click** the "🧪 Generate Test" button above the function
4. **Test file** is created in *tests/* folder
```python
import pytest

def test_calculate_sum():
    """Test for calculate_sum function"""
    # TODO: Add test implementation
    # result = calculate_sum(a, b)
    # assert result == expected_value
    pass
```