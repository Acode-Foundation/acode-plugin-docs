# createKeyboardEvent

The `createKeyboardEvent` API allows you to programmatically create and dispatch keyboard events in Acode. This is useful for simulating keyboard interactions and testing keyboard-driven features.

## Import

```js
const createKeyboardEvent = acode.require('createKeyboardEvent');
```

## Usage

```js
// Create a keyboard event
const event = createKeyboardEvent('keydown', {
		key: 'Enter',
		ctrlKey: true
});

// Dispatch the event
document.dispatchEvent(event);
```

## API Reference

### createKeyboardEvent(type, options)

Creates a new keyboard event with the specified type and options.

#### Parameters

- `type` (*string*) - The type of keyboard event to create. Can be either:
	- `'keydown'` - Key pressed down
	- `'keyup'` - Key released

- `options` (*object*) - Configuration options for the keyboard event:
	- `key` (*string*) - The key value (e.g. 'Enter', 'a', 'ArrowLeft')
	- `keyCode` (*number*) - The key code (optional if key is specified)
	- `which` (*number*) - The which code (optional if key is specified)
	- `ctrlKey` (*boolean*) - Whether Ctrl key is pressed
	- `shiftKey` (*boolean*) - Whether Shift key is pressed
	- `altKey` (*boolean*) - Whether Alt key is pressed
	- `metaKey` (*boolean*) - Whether Meta/Command key is pressed
	- `bubbles` (*boolean*) - Whether event bubbles up through DOM
	- `cancelable` (*boolean*) - Whether event can be canceled

#### Returns

Returns a KeyboardEvent object that can be dispatched.

## Examples

### Basic Usage

```js
// Create Enter key press
const enterPress = createKeyboardEvent('keydown', {
		key: 'Enter'
});

// Create Ctrl+S combination
const ctrlS = createKeyboardEvent('keydown', {
		key: 's',
		ctrlKey: true
});

// Create arrow key event
const arrowLeft = createKeyboardEvent('keydown', {
		key: 'ArrowLeft'
});
```

### Simulating Shortcuts

```js
// Simulate Ctrl+Alt+Delete
const ctrlAltDel = createKeyboardEvent('keydown', {
		key: 'Delete',
		ctrlKey: true,
		altKey: true
});

// Simulate Shift+Enter
const shiftEnter = createKeyboardEvent('keydown', {
		key: 'Enter',
		shiftKey: true
});
```

### Working with Key Codes

```js
// Using key codes instead of key names
const backspace = createKeyboardEvent('keydown', {
		keyCode: 8 // Backspace key code
});

// Both key and keyCode can be used
const enter = createKeyboardEvent('keydown', {
		key: 'Enter',
		keyCode: 13
});
```

## Supported Keys

Common supported keys include:

- Arrow keys: `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`
- Special keys: `Enter`, `Tab`, `Backspace`, `Delete`, `Escape`, `Space`
- Modifier keys: `Shift`, `Control`, `Alt`, `Meta`
- Function keys: `F1`-`F12`
- Printable characters: `a-z`, `A-Z`, `0-9`, symbols
