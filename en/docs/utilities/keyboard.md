# Keyboard API

The Keyboard API provides functionality for handling keyboard events and managing keyboard state in Acode plugins. It allows you to detect keyboard visibility, respond to keyboard events, and manage keyboard-related behaviors.

## Usage

```js
const keyboard = acode.require('keyboard');
```

## Events

The keyboard module emits the following events that you can listen to:

- `key` - Triggered when a keyboard key is pressed
- `keyboardShow` - Triggered when the soft keyboard becomes visible
- `keyboardHide` - Triggered when the soft keyboard is hidden
- `keyboardShowStart` - Triggered when the soft keyboard starts to show
- `keyboardHideStart` - Triggered when the soft keyboard starts to hide

## Methods

### on(eventName, callback)

Add an event listener for keyboard events.

```js
keyboard.on('keyboardShow', () => {
		// Handle keyboard show
		console.log('Keyboard is now visible');
});

keyboard.on('key', (event) => {
		// Handle key press
		if (event.key === 'Enter' && event.ctrlKey) {
				console.log('Ctrl+Enter pressed');
		}
});
```

Parameters:
- `eventName` (string) - Name of the event to listen for ('key', 'keyboardShow', 'keyboardHide', etc.)
- `callback` (Function) - Function to execute when the event occurs

### off(eventName, callback)

Remove an event listener.

```js
const keyboardCallback = () => {
		console.log('Keyboard shown');
};

// Add listener
keyboard.on('keyboardShow', keyboardCallback);

// Remove listener
keyboard.off('keyboardShow', keyboardCallback);
```

Parameters:
- `eventName` (string) - Name of the event to remove listener from
- `callback` (Function) - The callback function to remove

### escKey State

The keyboard API includes an `escKey` state that tracks whether the Escape key is currently pressed:

```js
// Check if Escape key is pressed
if (keyboard.escKey) {
		console.log('Escape key is pressed');
}
```

## Example Plugin

Here's a complete example of using the keyboard API in an Acode plugin:

```js
class KeyboardPlugin {
		constructor() {
				const keyboard = acode.require('keyboard');

				// Add keyboard show/hide listeners
				keyboard.on('keyboardShow', () => {
						acode.alert('Keyboard shown');
				});

				keyboard.on('keyboardHide', () => {
						acode.alert('Keyboard hidden');
				});

				// Listen for Ctrl+S shortcut
				keyboard.on('key', (e) => {
						if (e.key === 's' && e.ctrlKey) {
								acode.alert('Saving file...');
						}
				});
		}
}

if (window.acode) {
		const acodePlugin = new KeyboardPlugin();
		acode.setPluginInit("keyboard-example", (baseUrl, $page, { cacheFile, cacheFileUrl }) => {
				if (!acodePlugin.initialized) {
						acodePlugin.initialized = true;
						// Initialize plugin
				}
		});
}
```

This example demonstrates listening for keyboard visibility changes and implementing custom keyboard shortcuts in an Acode plugin.
