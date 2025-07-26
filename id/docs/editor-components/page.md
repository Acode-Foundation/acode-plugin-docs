# Page Component

The Page Component in Acode allows you to create customizable pages with headers, titles, and optional navigation elements. This is useful for building plugin interfaces and new pages within the editor.

## Importing

```js
const page = acode.require('page');
```

## Usage

To create a new page:

```js
// Create basic page with title
const myPage = page('My Plugin Page');

// Create page with back button and menu icon
const backBtn = tag('span', {className: 'icon back'});
const menuBtn = tag('span', {className: 'icon menu'});

const myPage = page('My Plugin Page', {
		lead: backBtn,
		tail: menuBtn
});
```

## Parameters

- `title` (string) - The title text shown in the page header
- `options` (object) - Optional configuration object:
		- `lead` (HTMLElement) - Element shown before the title (e.g. back button)
		- `tail` (HTMLElement) - Element shown after the title (e.g. menu icon)

## Methods

| Method | Description |
|--------|-------------|
| `appendBody(...elements)` | Adds elements to the main page content area |
| `appendOuter(...elements)` | Adds elements outside the main content area |
| `on(event, callback)` | Adds an event listener to the page |
| `off(event, callback)` | Removes an event listener from the page |
| `setTitle(title)` | Updates the page title |
| `hide()` | Hides the page |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `body` | HTMLElement | The main content container |
| `header` | HTMLElement | The header container element |
| `innerHTML` | string | The page's inner HTML content |
| `textContent` | string | The page's text content |
| `lead` | HTMLElement | The lead element if defined |

:::info
You'll need to implement `show` method according to your situation at your own.
:::

## Example

Here's a complete example of creating a settings page for a plugin:

```js
function createSettingsPage() {
		// Create page elements
		const backButton = tag('span', {
				className: 'icon back',
				dataset: {
        				action: "back-btn"
      				}
				onclick: () => settingsPage.hide()
		});

		const saveButton = tag('span', {
				className: 'icon save',
				dataset: {
        				action: "save-btn"
      				}
				onclick: () => {console.log("save settings")}
		});

		// Initialize page
		const settingsPage = page('Plugin Settings', {
				lead: backButton,
				tail: saveButton
		});

		// Add content
		const form = tag('form');
		const input = tag('input', {
				type: 'text',
				value: 'Default value'
		});

		form.append(input);
		settingsPage.appendBody(form);
                settingsPage.show = () => {
			// to have proper behaviour for mobile back button press, check actionStack doc for more
                        const actionStack = acode.require("actionStack");
			actionStack.push({
        			id: "some_id",
        			action: settingsPage.hide,
      			});
			app.append(settingsPage);
    		};

		// Show the page
		settingsPage.show();
}
```
