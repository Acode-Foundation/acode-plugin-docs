# Select

The `select` ui component in Acode provides a user-friendly and customizable way to present a select dialog, allowing users to choose one or more options.

## Usage

To use the `select` component in your Acode plugin, you can require it using the following code:

```javascript
const select = acode.require('select');
```

Once you have the `select` component, you can create an instance with the following syntax:

```javascript
const mySelect = await select(
  'My Title',    // Title of the select menu
  items,         // Array of select items
  options        // Additional options
);
```

## Parameters

### `title` (string)
The header text shown at the top of the selection dialog.

### `items` (Array | String[])
Options to display in three supported formats:

1. **Simple strings**:
   ```javascript
   const items = ['Option 1', 'Option 2', 'Option 3'];
   ```

2. **Array format** `[value, text, icon, disabled, letters, checkbox]`:
   ```javascript
   const items = [
     ['value1', 'Display Text', 'icon-class', false, 'AB', null],
     ['value2', 'Another Option', null, true, null, true]
   ];
   ```

3. **Object format**:
   ```javascript
   const items = [
     {value: 'option1', text: 'First Option', icon: 'icon-class'},
     {value: 'option2', text: 'Second Option', disabled: true}
   ];
   ```

#### Item Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | String | Unique identifier returned when selected |
| `text` | String | Display text shown to the user |
| `icon` | String | CSS class for icon or 'letters' to use the letters parameter |
| `disabled` | Boolean | Whether the option can be selected |
| `letters` | String | Shows letter initials as an icon (when icon='letters') |
| `checkbox` | Boolean | Adds a checkbox to the option when set |

### `options` (Object | Boolean)
Configure dialog behavior:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `hideOnSelect` | Boolean | `true` | Close dialog after selection |
| `textTransform` | Boolean | `false` | Apply text transformation to options |
| `default` | String | `null` | Pre-selected option value |
| `onCancel` | Function | `null` | Called when dialog is cancelled |
| `onHide` | Function | `null` | Called when dialog is hidden |

Pass `true` to reject the promise on cancel instead of using an object.

## Examples

### Basic Selection
```javascript
const select = acode.require('select');
const result = await select('Pick a color', ['Red', 'Green', 'Blue']);
```

### Rich Selection
```javascript
const items = [
  ['edit', 'Edit File', 'edit', false],
  ['delete', 'Delete File', 'delete', false],
  ['share', 'Share File', 'share', true]
];

const options = {
  hideOnSelect: true,
  default: 'edit',
  onCancel: () => console.log('Selection cancelled')
};

const action = await select('File Actions', items, options);
```

### With Checkboxes
```javascript
const features = [
  {value: 'sync', text: 'Cloud Sync', checkbox: true},
  {value: 'backup', text: 'Auto Backup', checkbox: false},
  {value: 'formatting', text: 'Code Formatting', checkbox: true}
];

const selected = await select('Enable Features', features, {hideOnSelect: false});
```

### Using Letter Icons
```javascript
const users = [
  {value: 'john', text: 'John Smith', icon: 'letters', letters: 'JS'},
  {value: 'jane', text: 'Jane Doe', icon: 'letters', letters: 'JD'}
];

const selectedUser = await select('Choose User', users);
```

## Return Value
The `value` of the selected item as a string, or rejects if cancelled with `rejectOnCancel: true`.

## Notes

- When using checkboxes, consider setting `hideOnSelect: false` to allow multiple selections
- The dialog automatically scrolls to the default selected option when opened
- Use the `letters` parameter with `icon: 'letters'` to display initials as avatars
