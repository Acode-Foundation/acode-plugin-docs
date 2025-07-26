# Action Stack

The Action Stack is a crucial component for managing back button behavior in Acode. It allows you to handle navigation and state management by maintaining a stack of actions that can be executed when users press the back button.

## Getting Started

To use the Action Stack in your plugin, first require it:

```js
const actionStack = acode.require('actionStack');
```

## Core Concepts

The Action Stack works by maintaining a LIFO (Last In First Out) queue of actions. When the back button is pressed, the most recently added action is executed and removed from the stack.

## API Reference

### push(action)

Adds a new action to the stack.

**Parameters:**
- `action` (Object)
		- `id` (string): Unique identifier for the action
		- `action` (Function): Callback function to execute when back is pressed

**Example:**
```js
actionStack.push({
		id: 'close-search',
		action() {
				searchPanel.hide();
				editor.focus();
		}
});
```

### pop(repeat?)

Executes and removes the most recent action from the stack.

**Parameters:**
- `repeat` (number, optional): Number of actions to pop and execute

**Example:**
```js
// Pop single action
actionStack.pop();

// Pop multiple actions
actionStack.pop(3);
```

### get(id)

Retrieves an action from the stack by its ID.

**Parameters:**
- `id` (string): The action identifier

**Returns:** Action object if found, undefined otherwise

**Example:**
```js
const searchAction = actionStack.get('close-search');
if (searchAction) {
		// Action exists
}
```

### remove(id)

Removes an action from the stack without executing it.

**Parameters:**
- `id` (string): The action identifier

**Returns:** boolean - True if action was found and removed

**Example:**
```js
actionStack.remove('close-search');
```

### has(id)

Checks if an action exists in the stack.

**Parameters:**
- `id` (string): The action identifier

**Returns:** boolean - True if action exists

**Example:**
```js
if (actionStack.has('close-search')) {
		// Action exists in stack
}
```

### Stack Markers

The Action Stack provides methods to mark positions and clear actions above them:

#### setMark()
Sets a marker at the current stack position.

#### clearFromMark()
Removes all actions added after the last marker.

**Example:**
```js
// Mark current position
actionStack.setMark();

// Add temporary actions
actionStack.push({
		id: 'temp-action',
		action() {
				// Handle temporary state
		}
});

// Clear all actions added since mark
actionStack.clearFromMark();
```

## Example

Here's a complete example showing how to use the Action Stack for managing a file preview feature:

```js
class FilePreviewPlugin {
		async showPreview(file) {
				// Create preview UI
				const preview = document.createElement('div');
				preview.className = 'preview-container';
				preview.innerHTML = await this.renderPreview(file);
				document.body.appendChild(preview);

				// Add to action stack
				actionStack.push({
						id: `preview-${file.name}`,
						action: () => {
								// Clean up preview when back is pressed
								preview.remove();
								editor.focus();
						}
				});
		}

		async renderPreview(file) {
				// Preview rendering logic
		}
}
```

When the user clicks the back button, the preview will be automatically cleaned up and focus returned to editor.
