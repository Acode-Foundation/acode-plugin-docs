# Ace Modes

The Ace Modes is a utility method in Acode allows you to manage the language modes supported by the Ace editor. This includes adding new modes, removing existing ones, and configuring how the editor handles different file types.

## Importing Ace Modes

To use the Ace Modes utilities, you need to import them using the `acode.require` method:

```javascript
const aceModes = acode.require('aceModes');
```

## Methods

### `addMode(name: string, extensions: string | string[], caption: string)`

The `addMode` method adds a new mode to the Ace editor. This is useful when you want to support a custom language or file type.

- **name**: The name of the mode.
- **extensions**: The file extensions associated with this mode. This can be a string or an array of strings.
- **caption**: The display name of the mode.

#### Example

```javascript
const { addMode } = acode.require('aceModes');

addMode('myMode', ['mymode', 'mym'], 'My Custom Mode');
```

:::info
 The `extensions` parameter can be a single string or an array of strings, making it flexible to accommodate multiple file types.
:::

### `removeMode(name: string)`

The `removeMode` method removes a mode from the Ace editor. This is useful if you need to clean up or no longer need support for a particular mode.

- **name**: The name of the mode to be removed.

#### Example

```javascript
const { removeMode } = acode.require('aceModes');

removeMode('myMode');
```
:::tip
Removing a mode that is no longer needed can help keep editor environment clean and efficient.
:::

## Example

Here’s a more detailed example that demonstrates how to add and remove a custom mode, and how to utilize these modes within the Ace editor.

### Adding a Custom Mode

Let's say you have a custom language with the extension `.mymode` and you want it to be recognized by the Ace editor.

```javascript:line-numbers
const aceModes = acode.require('aceModes');

const onClick = () => {
  // Action to perform when the menu item is clicked
  console.log('Custom Mode Menu Item Clicked!');
};

// Adding the custom mode
aceModes.addMode('myMode', ['mymode'], 'My Custom Mode');

// Assuming you have the necessary mode definitions loaded for 'myMode'
// Example of using the custom mode in the editor
const editor = editorManager.editor;
editor.session.setMode('ace/mode/myMode');
```

### Removing a Custom Mode

If you decide to remove the custom mode from the Ace editor:

```javascript:line-numbers
const aceModes = acode.require('aceModes');

// Removing the custom mode
aceModes.removeMode('myMode');

// The mode will no longer be available for use
```
