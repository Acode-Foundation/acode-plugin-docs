# Palette

The Palette component provides an interactive search interface with dynamic suggestions for your Acode plugin. It creates a searchable input field with a dropdown list of options that updates as the user types. This is what used in command palettes, find files etc.

## Importing

```js
const palette = acode.require('palette');
```

## Usage

The palette function accepts four parameters to configure its behavior:

```js
palette(getList, onSelect, placeholder, onRemove);
```

### Parameters

- `getList` : `() => Array<string|string[]>` - Function that returns an array of options or Promises resolving to options. Called whenever the search input changes.

- `onSelect` : `(value: string) => void` - Callback function executed when the user selects an option. Receives the selected option value.

- `placeholder?` : `string` - Optional text to display in the input field when empty.

- `onRemove?` : `() => void` - Optional callback triggered when the palette is closed/removed.

## Example

Here's a example showing how to create a file search palette:

```js
const palette = acode.require('palette');

// Generate list of files
function getFileList() {
		return [
				'src/components/header.js',
				'src/pages/home.js',
				'src/utils/helpers.js',
				'package.json',
				'README.md'
		];
}

// Handle file selection
function handleFileSelect(filePath) {
		console.log(`Opening file: ${filePath}`);
		// Add logic to open the selected file
}

// Create the palette
palette(
		getFileList,
		handleFileSelect,
		'Search files...'
);
```

The palette will automatically handle:
- Keyboard navigation (arrow keys)
- Search filtering
- Selection via enter/click
- Closing via escape key or clicking outside
- Proper cleanup on remove
