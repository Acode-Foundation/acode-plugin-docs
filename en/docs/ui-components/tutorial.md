# Tutorial

The tutorial module provides functionality to display one-time tutorial messages to users.

## Import

```js
const tutorial = acode.require('tutorial');
```

## Usage

The tutorial function shows a message only once to the user by storing its state in localStorage.

### Syntax

```js
tutorial(id: string, message: string | HTMLElement | Function)
```

### Parameters

- `id` (string): Unique identifier for the tutorial message
- `message`: The content to display, can be:
		- string: Plain text message
		- HTMLElement: Custom HTML content
		- Function: A function that returns HTMLElement and receives hide callback

### Example

```js
// Basic text message
tutorial('welcome-msg', 'Welcome to my plugin!');

// HTML message
const msgEl = document.createElement('div');
msgEl.innerHTML = `
		<h3>Getting Started</h3>
		<p>Click the button below to begin:</p>
		<button onclick="startTutorial()">Start</button>
`;
tutorial('start-guide', msgEl);

// Function with hide callback
tutorial('feature-intro', (hide) => {
		const container = document.createElement('div');
		const closeBtn = document.createElement('button');
		closeBtn.textContent = 'Got it';
		closeBtn.onclick = hide;
		container.appendChild(closeBtn);
		return container;
});
```

The message will only be shown once - subsequent calls with the same ID will not display the message again.

## Notes

- The tutorial state is persisted using localStorage
- Messages are displayed as toast notifications
- Default colors are blue (#17c) background with white (#fff) text
- The hide callback allows custom control of message dismissal
