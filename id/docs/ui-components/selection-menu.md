# Selection Menu

The Selection Menu in Acode appears when you select any text within the editor. This UI component allows you to enhance the functionality of text selection by adding custom actions to the selection menu.

## Methods

### `add(onclick: () => void, text: string, mode: 'selected' | 'all', readOnly: boolean)`

The `add` method allows you to add new items to the selection menu. It takes the following parameters:

- **onclick**: A function that gets executed when the menu item is clicked.
- **text**: The icon or text to display in the menu.
- **mode**: Specifies when this item should be shown in the selection menu. The possible values are:
  - `'selected'`: Show when some text is selected.
  - `'all'`: Show regardless of text selection.
- **readOnly**: A boolean value that determines whether the item should be shown in read-only mode.

### Example

```javascript
const selectionMenu = acode.require('selectionMenu');

const onclick = () => {
  // Action to perform when the menu item is clicked
  console.log('Menu item clicked!');
};

// Adding a new item to the selection menu
selectionMenu.add(onclick, 'Hi', 'all');
```
