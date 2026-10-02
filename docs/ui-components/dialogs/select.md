# Select

The `select` ui component in Acode provides a user-friendly and customizable way to present a select dialog, allowing users to choose one or more options.

::: info
Verified against Acode **v1.13.5**: `src/dialogs/select.js`. `acode.require("select")` and `acode.select(...)` are the same function and forward all three arguments.
:::

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

### Signature

| Signature | Returns |
| --- | --- |
| `select(title: string, items: Array<string \| SelectItem \| Array>, options?: SelectOptions \| boolean): Promise<any>` | Rejects with `undefined` only when `options` is the boolean `true` |

The third argument is overloaded:

```js
const select = acode.require('select');

// Object form — full feature set.
const a = await select('Pick', items, { default: 'b' });

// Boolean form — shorthand for `rejectOnCancel: true`.
// Cancel/backdrop/back now rejects instead of leaving the promise pending.
try {
  const b = await select('Pick', items, true);
} catch {
  // dismissed
}
```

## Parameters

### `title` (string)
The header text shown at the top of the selection dialog. If it is falsy the title element is omitted entirely and the list is the only content.

### `items` (Array | String[])
Options to display in three supported formats:

1. **Simple strings**:
   ```javascript
   const items = ['Option 1', 'Option 2', 'Option 3'];
   ```
   The string is used as both `value` and `text`.

2. **Array format** `[value, text, icon, disabled, letters, checkbox, …]`:
   ```javascript
   const items = [
     ['value1', 'Display Text', 'icon-class', true, 'AB', null],
     ['value2', 'Another Option', null, false, null, true]
   ];
   ```
   Positions are assigned in this fixed order: `value`, `text`, `icon`, `disabled`, `letters`, `checkbox`, `tailElement`, `ontailclick`, `subText`, `className`, `title`.

3. **Object format** (recommended — no inversion, full key set):
   ```javascript
   const items = [
     {value: 'option1', text: 'First Option', icon: 'icon-class'},
     {value: 'option2', text: 'Second Option', disabled: true}
   ];
   ```

::: warning
In the array format the `disabled` slot is **inverted**: any boolean at index `> 1` sets `disabled = !value`, and the last such boolean wins. `['v', 'Text', null, true]` is therefore **enabled**. Prefer the object format whenever you need `disabled` or `checkbox`.
:::

#### Item Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | any | Returned **verbatim** when the row is selected. May be a string, number or object. A row with no `value` is not selectable. |
| `text` | String | Display text shown to the user. Inserted as HTML, then DOMPurify-sanitized. |
| `subText` | String | Secondary line rendered under `text`. <Badge type="tip" text="new" /> |
| `icon` | String | CSS class for the icon, or the literal `'letters'` to use the `letters` parameter. Ignored when `fileIcon` is set. |
| `fileIcon` | `{name: string, kind?: "file" \| "folder"}` | Renders the icon from Acode's file-icon registry, and keeps it live if the registry re-renders. <Badge type="tip" text="new" /> |
| `className` | String | Extra class added to the row's `<li>`. |
| `title` | String | Native tooltip; also set as the row's `aria-label`. |
| `disabled` | Boolean | Whether the option can be selected (object format only — see the warning above for the array format). |
| `letters` | String | Shows letter initials as an icon (when `icon: 'letters'`). |
| `checkbox` | Boolean | Renders a checkbox in the row's tail slot. `false` renders an **unchecked** checkbox, `null`/`undefined` renders no tail. |
| `tailElement` | HTMLElement | Custom element rendered in the tail slot instead of the checkbox. |
| `ontailclick` | `(event: Event) => void` | Click handler for `tailElement`. Called with the row element as `this`; the click does not select the row. |

### `options` (Object | Boolean)
Configure dialog behavior:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `hideOnSelect` | Boolean | `true` | Close the dialog after a selection. |
| `textTransform` | Boolean | `false` | Select rows are uppercased by the theme. `false` adds the `no-text-transform` class, which restores `text-transform: initial`. Set `true` to keep the uppercase default. |
| `default` | any | `undefined` | Pre-selected option value. The matching row gets the `selected` class, is scrolled into view and receives focus. Compared with `===`. |
| `className` | String | `""` | Extra class on the dialog root (`.prompt.select`). <Badge type="tip" text="new" /> |
| `onCancel` | Function | `undefined` | Called when the dialog is cancelled (backdrop tap or Android Back / Esc). |
| `onHide` | Function | `undefined` | Called whenever the dialog hides, **including after a normal selection**. |

Pass `true` instead of an object to reject the promise on cancel. The rejection value is `undefined`, and every other option is then left at its default.

## Examples

### Basic Selection
```javascript
const select = acode.require('select');
const result = await select('Pick a color', ['Red', 'Green', 'Blue']);
```

### Rich Selection
```javascript
const items = [
  {value: 'edit', text: 'Edit File', icon: 'edit'},
  {value: 'delete', text: 'Delete File', icon: 'delete'},
  {value: 'share', text: 'Share File', icon: 'share', disabled: true}
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

### Per-row tail action <Badge type="tip" text="new" />

```javascript
const select = acode.require('select');

const clearBtn = document.createElement('span');
clearBtn.className = 'icon clearclose';
// `data-action` on the tail tells select.js to swallow the click
// instead of selecting the row.
clearBtn.setAttribute('data-action', 'clear');

const items = recentFiles.map((file) => ({
  value: file.url,
  text: file.name,
  subText: file.location,
  title: file.url,
  fileIcon: {name: file.name, kind: 'file'},
  tailElement: clearBtn.cloneNode(),
  ontailclick(e) {
    const $row = e.currentTarget.closest('.tile');
    $row?.remove();
    removeRecent(file.url);
  },
}));

const url = await select('Open recent', items, {textTransform: false});
```

## Return Value
The `value` of the selected item exactly as you supplied it — commonly a string, but any type passes through unchanged. If the dialog is dismissed it rejects with `undefined` when you passed the boolean shorthand `true`, otherwise the promise stays **pending** unless `onCancel` is set.

| Interaction | Outcome |
| --- | --- |
| **Row tap** | Resolves with that row's `value` |
| **Row with `value === undefined`** | Nothing happens — the click handler returns early |
| **`disabled` row** | Gets the `.disabled` class, which sets `pointer-events: none` and reduced opacity, so it is inert to touch |
| **Backdrop tap** | Cancels: calls `onCancel`, then rejects only when `rejectOnCancel` is set |
| **Android Back / Esc** | Same as backdrop tap — the action stack entry *is* the cancel handler |

## Notes

- `onHide` fires on **every** close, including a successful selection. Use `onCancel` if you only care about dismissal.
- Focus starts on the `default` row, or on the first row when no `default` is given.
- `text` is sanitized HTML, so you may embed small markup; scripts are stripped.

## Gotchas <Badge type="tip" text="new" />

- **`hideOnSelect: false` does not collect multiple selections.** The promise resolves on the *first* row tap; later taps call `res()` on an already-settled promise and are discarded. It only keeps the list on screen. For real multi-select, keep your own state and toggle it from each row's `ontailclick`/`onchange`.
- **Array-format `disabled` is inverted.** `['v', 'Text', null, true]` produces an **enabled** row, and `['v', 'Text', null, false]` produces a **disabled** one — because `select.js` reassigns `disabled = !o` for every boolean past index 1. Worse, `['v', 'Text', null, true, null, false]` disables the row because the trailing `checkbox: false` is the last boolean seen. Use the **object format** if you need `disabled` or `checkbox`.
- **Checkboxes live inside the clickable row.** The tail is appended inside the same `<li>` that carries the click handler, so ticking a checkbox also selects the row and resolves the promise.
- **`disabled` is applied as a class, not a check.** The click handler never re-reads the flag; it is the `.disabled` CSS rule (`pointer-events: none`) that makes the row inert. Don't treat it as a security boundary.
- **Cancel leaves the promise pending by default.** Without `onCancel` or the boolean `true` shorthand, dismissing the dialog means your `await` never continues — a classic source of "frozen plugin" reports.
- **The action-stack id is fixed (`"select"`).** Only one select is tracked for Back / Esc at a time, so nested selects can fight over dismissal.

## See also

- [`confirm`](./confirm.md) — yes/no dialog
- [`prompt`](./prompt.md) — free-text input
- [`multiPrompt`](./multi-prompt.md) — many inputs in one dialog
- [`alert`](./alert.md) — message with a single OK button
- [`colorPicker`](./color-picker.md) — pick a color
- [`dialogBox`](./custom-dialog.md) — build your own dialog
- [`loader`](./loader.md) — progress dialog
- [File Icons](../../utilities/file-icons.md) — what `fileIcon` resolves through