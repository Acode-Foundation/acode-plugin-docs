# Context Menu API

The Context Menu API allows you to create and manage custom context menus in your plugin. This API provides an easy way to add menus and other contextual interfaces.

## Getting Started

To use the Context Menu API in your Acode plugin, first require it:

```js
acode.require('contextmenu')
```

## API Reference

### Creating a Context Menu

The main function to create a context menu:

```js
contextmenu(content, options)
```

**Parameters:**

- `content`: String - The HTML content to show in the menu
- `options`: Object - Configuration options (optional)

You can also create a menu with just options:

```js
contextmenu(options)
```

### Context Menu Options

The options object accepts these properties:

- `left`: Number - Left position in pixels
- `top`: Number - Top position in pixels
- `bottom`: Number - Bottom position in pixels
- `right`: Number - Right position in pixels
- `transformOrigin`: String - CSS transform-origin property
- `toggler`: HTMLElement - Element that toggles the menu
- `onshow`: Function - Called when menu is shown
- `onhide`: Function - Called when menu is hidden
- `items`: Array - Menu items as [text, action] pairs
- `onclick`: Function - Called when an item is clicked
- `onselect`: Function - Called when an item is selected
- `innerHTML`: Function - Returns HTML string for menu content

### Menu Methods

The returned menu object has these methods:

- `show()` - Display the menu
- `hide()` - Hide the menu
- `destroy()` - Remove the menu completely

## Basic Example

Here's a simple example of creating and using a context menu:

```js
const menu = contextmenu('Menu Content', {
		top: 50,
		left: 100,
		items: [
				['Item 1', 'action1'],
				['Item 2', 'action2']
		],
		onselect(action) {
				console.log('Selected:', action);
		}
});

// Show the menu
menu.show();

// Hide the menu
menu.hide();
```
