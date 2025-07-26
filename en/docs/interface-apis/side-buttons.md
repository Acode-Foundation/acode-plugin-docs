# Side Buttons <Badge type="tip" text="v316+" />

The side buttons are buttons that appear vertically along the right side of the editor screen.

## Description

`acode.require("sideButton")` creates and renders custom side buttons that users can interact with.

## Usage

```js
const SideButton = acode.require('sideButton');

const sideButton = SideButton({
  text: 'My Side Button',
  icon: 'my-icon',
  onclick() {
    console.log('clicked');
  },
  backgroundColor: '#fff',
  textColor: '#000',
});

// Show the side button
sideButton.show();

// Hide the side button
sideButton.hide();
```

## API Reference

### Options

| Name | Type | Description |
|------|------|-------------|
| text | `string` | The text label for the button |
| icon | `string` | CSS class name for the button icon |
| onclick | `() => void` | Click handler function |
| backgroundColor | `string` | Background color of the button |
| textColor | `string` | Text color of the button |

### Returns

Returns an object with the following methods:

| Method | Type | Description |
|--------|------|-------------|
| show | `() => void` | Shows the side button |
| hide | `() => void` | Hides the side button |
