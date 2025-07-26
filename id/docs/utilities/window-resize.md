# Window Resize API

The Window Resize API allows plugins to handle window resize events in Acode. This is particularly useful for managing UI elements that need to respond to window size changes or keyboard visibility.

## Import

```js
const windowResize = acode.require('windowResize');
```

## Events

The API supports two types of events:

- `resize`: Triggered when window resizing is complete
- `resizeStart`: Triggered when window starts resizing

## Usage

### Adding Event Listeners

Use the `on()` method to listen for resize events:

```js
// Listen for resize complete
windowResize.on('resize', () => {
		// Handle resize complete
		console.log('Window resize finished');
});

// Listen for resize start
windowResize.on('resizeStart', () => {
		// Handle resize start
		console.log('Window started resizing');
});
```

### Removing Event Listeners

Use the `off()` method to remove event listeners:

```js
const handleResize = () => {
		// Resize handler logic
};

// Add listener
windowResize.on('resize', handleResize);

// Remove listener
windowResize.off('resize', handleResize);
```

## Example Use Case

Here's a example of using the Window Resize API to adjust a plugin's UI:

```js
class MyPlugin {
		constructor() {
				this.container = document.createElement('div');
				this.setupResizeHandling();
		}

		setupResizeHandling() {
				// Handle initial resize
				windowResize.on('resizeStart', () => {
						// Prepare UI for resize
						this.container.style.transition = 'none';
				});

				windowResize.on('resize', () => {
						// Update UI after resize
						this.container.style.transition = 'all 0.3s';
						this.updateLayout();
				});
		}

		updateLayout() {
				const windowWidth = window.innerWidth;
				if (windowWidth < 768) {
						this.container.classList.add('compact');
				} else {
						this.container.classList.remove('compact');
				}
		}
}
```

## Notes

- The resize event is debounced internally to prevent excessive callbacks
- Use `resizeStart` for immediate response to resize initiation
- Use `resize` for final adjustments after resizing completes
- Event listeners should be removed when no longer needed to prevent memory leaks
