# Intent

The Intent API provides functionality to handle intents from other apps and implement custom URI scheme handling in Acode plugins.

## Overview

The Intent API allows plugins to:
- Handle intents when Acode is opened from other apps
- Process custom URI schemes in the format `acode://<module>/<action>/<value>`
- Control intent behavior through event handlers
- Enable deep linking and file sharing between applications

For example, you could:
- Open specific files directly from your file manager
- Accept shared text content from messaging apps
- Implement "Open in Acode" functionality in other apps
- Create custom URI schemes for your plugin features

::: warning Compatibility Note
The Intent API is not supported in older versions of Acode. Always check if it's available before using.
:::

## Usage

### Importing the API

```js
const intent = acode.require('intent');
```

### Methods

#### addHandler
Adds an intent handler function that will be called when intents are received.

```ts
addHandler(handler: (event: IntentEvent) => void): void
```

#### removeHandler
Removes a previously added intent handler.

```ts
removeHandler(handler: (event: IntentEvent) => void): void
```

### The IntentEvent Object

The handler receives an `IntentEvent` object with these properties:

- `module` (string): The module name from the URI
- `action` (string): The action to perform
- `value` (string): Additional data value

And these methods:

- `preventDefault()`: Prevents default intent handling
- `stopPropagation()`: Stops other handlers from executing

### Examples

Basic intent handling:
```js
const intent = acode.require('intent');

const handler = (event) => {
				const { module, action, value } = event;

				// Optional: prevent default behavior
				// event.preventDefault();

				// Optional: stop other handlers
				// event.stopPropagation();

				console.log(`Intent received: ${module}/${action}/${value}`);
};

// Register handler
intent?.addHandler(handler);

// Later: remove handler if needed
intent?.removeHandler(handler);
```

File opening handler:
```js
const fileHandler = (event) => {
				if (event.module === 'file' && event.action === 'open') {
								// Open the file specified in event.value
								editorManager.openFile(event.value);
								event.preventDefault(); // Prevent default handling
				}
};

intent?.addHandler(fileHandler);
```

Custom URI scheme handler:
```js
const pluginHandler = (event) => {
				if (event.module === 'myplugin') {
								switch(event.action) {
												case 'search':
																// Handle search URI: acode://myplugin/search/query
																performSearch(event.value);
																break;
												case 'create':
																// Handle file creation: acode://myplugin/create/filename
																createNewFile(event.value);
																break;
								}
								event.preventDefault();
				}
};

intent?.addHandler(pluginHandler);
```

## Common Use Cases

1. Opening specific files when launched from other apps:
			- File managers can open files directly in Acode
			- Handle shared files from other applications

2. Handling custom URI schemes for plugin functionality:
			- Implement deep linking to specific plugin features
			- Create custom commands accessible via URIs
			- Enable cross-app integration workflows

3. Intercepting intents to implement custom behaviors:
			- Custom file type handlers
			- Special handling for shared content
			- Integration with external tools and services
