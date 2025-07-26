# Color Picker

The `colorPicker` dialog box in Acode offers a way for users to choose colors within your plugins. This feature-rich color picker opens a dialog box showcasing a spectrum of color options, providing users with an intuitive and visually pleasing experience.

## Usage

To integrate the `colorPicker` component into your Acode plugin, you can require it using the following code:

```javascript
const colorPicker = acode.require('colorPicker');
```

Once you have the `colorPicker` component, you can utilize it by calling the function and passing in the desired default color as a string argument:

```javascript
let selectedColor = await colorPicker('#ff0000');
```

In this example, the color picker dialog box will open with the default color set to red (`#ff0000`).

## Parameters

- **`defaultColor (string):`**
  - The default color that the color picker will display initially. It should be a string representing a color in hexadecimal format or rgba or hsl.

- **`onhide (Function):`**
  - An optional callback function to be called when the color picker dialog box is closed.

## Returns

The `colorPicker` component returns a promise that resolves to a string representing the `selected color`. This color can then be used in your plugin based on user input.

## Example

```javascript:line-numbers{1,3}
const colorPicker = acode.require('colorPicker');

let selectedColor = await colorPicker('#ff0000');
console.log(`Selected Color: ${selectedColor}`);
```

In this example, the `colorPicker` component is used to open a color picker dialog box with the default color set to red. The selected color is then logged to the console, demonstrating how to retrieve and utilize the user's color selection.