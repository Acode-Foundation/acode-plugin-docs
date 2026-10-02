# Selection Menu

The Selection Menu in Acode appears when you select any text within the editor. This UI component allows you to enhance the functionality of text selection by adding custom actions to the selection menu.

## Import

```js
const selectionMenu = acode.require('selectionMenu');
```

:::info
`selectionMenu` is registered with `this.define("selectionMenu", selectionMenu)`, so the module **is** the menu-builder function itself, with `.add()` and `.exec()` attached to it. There is no wrapper object.

`acode.require` lower-cases the module name, so `acode.require('selectionmenu')` returns the same function.
:::

## Methods

### `add(onclick: () => void, text: string | HTMLElement, mode: 'selected' | 'all', readOnly: boolean, options: { id?: string, label?: string }): void`

The `add` method allows you to add new items to the selection menu. It takes the following parameters:

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onclick` | `() => void` | Yes | – | A function that gets executed when the menu item is clicked. Called with **no arguments**. |
| `text` | `string` \| `HTMLElement` | Yes | – | The icon or text to display in the menu. A `string` becomes the row's text (and its label fallback); a `Node` is `cloneNode(true)`-ed into the button. |
| `mode` | `'selected' \| 'all'` | No | `'all'` | Specifies when this item should be shown in the selection menu. The possible values are:<br>`'selected'` — only when some text is selected.<br>`'all'` — regardless of text selection. |
| `readOnly` | `boolean` | No | `false` | A boolean value that determines whether the item should be shown in read-only mode. `true` means **"show it in a read-only editor"**. |
| `options` | `{ id?: string, label?: string }` | No | `{}` | Display metadata, spread onto the item after `onclick`/`text`/`mode`/`readOnly`. |

**Returns:** `undefined`. The item is pushed onto a module-level array, so there is no handle and no remove API.

### `exec(command: string): void`

Runs a CodeMirror command on the active editor, then focuses the editor if it is editable.

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `command` | `string` | Yes | – | A CodeMirror command name, e.g. `"copy"`, `"cut"`, `"paste"`, `"selectall"`, `"share"`, `"undo"`, `"redo"`. |

`command === "selectall"` additionally scrolls to the end of the document, re-applies the selection and re-arms the touch selection menu.

**Returns:** `undefined`.

:::warning
`exec` reads `editorManager.editor` without a guard. With no active editor it throws a `TypeError`, and it always targets the **active** editor — never the file a plugin opened itself.
:::

### `selectionMenu(options?: { codeActionsAvailable?: boolean, lspActionsAvailable?: boolean }): SelectionMenuItem[]`

The module itself is also callable. It builds the **complete** item list that the editor's touch selection menu renders — the built-in entries first, then every item registered through `add()`.

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `options` | `object` | No | `{}` | See the table above for `codeActionsAvailable` (default `true`) and `lspActionsAvailable` (default `true`). |

**Returns:** an array of `{ onclick, text, mode, readOnly, ...options }` objects.

:::tip
Plugins normally only need `add`. The app calls `selectionMenu({ codeActionsAvailable, lspActionsAvailable })` itself every time the menu opens (`src/cm/touchSelectionMenu.js`), which is why items registered later still appear.
:::

### Built-in items

| `id` | Icon | `mode` | `readOnly` | Notes |
|---|---|---|---|---|
| `copy` | `icon copy` | `selected` | `true` | Editor `copy` command |
| `cut` | `icon cut` | `selected` | `false` | Editor `cut` command |
| `paste` | `icon paste` | `all` | `false` | Editor `paste` command |
| `select-all` | `icon text_format` | `all` | `true` | Editor `selectall` command |
| `share` | `icon share` | `selected` | `true` | Only present when `appSettings.get("showShareButton")` is truthy |
| `insert-color` | `icon color_lenspalette` | `all` | `false` | Calls `acode.exec("insert-color", color)` |
| `code-actions` | `icon lightbulb` | `all` | `true` | Only present when `codeActionsAvailable` is truthy (default `true`) |
| `lsp-actions` | `icon zap` | `all` | `true` | Only present when `lspActionsAvailable` is truthy (default `true`) |

Everything registered with `add()` is appended **after** these, in registration order.

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

## How items are filtered and placed <Badge type="tip" text="new" />

The editor filters and partitions the array before rendering:

1. **Read-only editors** drop every item whose `readOnly` is falsy.
2. **No selection** drops every item whose `mode` is `'selected'`. When there *is* a selection, a `mode` that is neither `'selected'` nor `'all'` is also dropped.
3. **Primary row vs. "More"** — only items whose `id` is one of `copy`, `cut`, `paste`, `select-all` render in the main toolbar row. **Every other item, including all plugin items, is placed in the overflow "More" grid** behind the keyboard-control button.
4. The label used for `aria-label`, `title` and for menu re-render detection is `item.label`, then a non-empty `item.text` string, then the `aria-label` / `title` / `textContent` of an `Element` `text`, and finally the literal `"More action"`.

## Complete Plugin Example <Badge type="tip" text="new" />

```javascript
acode.setPluginInit('com.example.texttools', () => {
  const selectionMenu = acode.require('selectionMenu');
  const sidebarApps = acode.require('sidebarApps');

  const getSelection = () => {
    const { state } = editorManager.editor;
    const range = state.selection.main;
    return state.sliceDoc(range.from, range.to);
  };

  // 1. Text action, only while something is selected.
  selectionMenu.add(
    () => {
      const text = getSelection();
      acode.require('toast')(`Selected ${text.length} characters`);
    },
    'Length',
    'selected',
  );

  // 2. Icon-only action with an explicit label, also available read-only.
  const icon = document.createElement('span');
  icon.className = 'icon edit';
  icon.title = 'Uppercase selection';

  selectionMenu.add(
    () => {
      const { state, dispatch } = editorManager.editor;
      const range = state.selection.main;
      dispatch({
        changes: {
          from: range.from,
          to: range.to,
          insert: getSelection().toUpperCase(),
        },
      });
    },
    icon,
    'selected',
    true,
    { id: 'example.uppercase', label: 'Uppercase selection' },
  );

  // 3. Editor command shortcut, shown whether or not there is a selection.
  selectionMenu.add(
    () => selectionMenu.exec('undo'),
    'Undo',
    'all',
    false,
    { id: 'example.undo', label: 'Undo' },
  );

  sidebarApps.add(
    'notes',
    'com.example.texttools',
    'Text Tools',
    (container) => {
      container.innerHTML = '<p>Open the sidebar to see selection tools.</p>';
    },
  );
});
```

## Gotchas

:::warning
There is **no** remove/unregister API. `add()` pushes onto a module-level array that lives for the whole app session, so items cannot be taken back. Register once, on plugin load, and guard with a flag if your `init` can run twice.
:::

:::warning
Every plugin item lands in the overflow **"More"** grid, not the primary toolbar row, because partitioning is keyed on `id` and only `copy` / `cut` / `paste` / `select-all` are treated as primary. Do not invent an `id` like `"copy"` to escape this — you would collide with the built-in row.
:::

:::warning
`readOnly: true` means **"visible in read-only editors"**, not "read-only action". If you leave it `false` (the default) the item disappears entirely as soon as the file is opened read-only.
:::

:::warning
`onclick` is invoked with no arguments (`item.onclick?.()`). The built-in "insert color" row declares a `color` parameter, but no caller supplies one in this menu.
:::

:::tip
The editor re-renders the menu only when the set of visible items changes (it compares `id`/label values). Give every item a stable `id` and `label` so identical-looking items do not force needless rebuilds, and so the row has a real accessible name.
:::

## Built-in Icons <Badge type="tip" text="new" />

| Icon class | Used by | Markup |
|---|---|---|
| `copy` | Copy row | `<span class="icon copy">` |
| `cut` | Cut row | `<span class="icon cut">` |
| `paste` | Paste row | `<span class="icon paste">` |
| `text_format` | Select all row | `<span class="icon text_format">` |
| `share` | Share row | `<span class="icon share">` |
| `color_lenspalette` | Insert color row | `<span class="icon color_lenspalette">` |
| `lightbulb` | Code actions row | `<span class="icon lightbulb">` |
| `zap` | LSP actions row | `<span class="icon zap">` |
| `keyboard_arrow_right` | LSP "go to definition/declaration/implementation/type definition" | `<span class="icon keyboard_arrow_right">` |
| `linkinsert_link` | LSP "find references" | `<span class="icon linkinsert_link">` |
| `edit` | LSP "rename symbol" | `<span class="icon edit">` |
| `keyboard_control` | The "More" overflow toggler | `<span class="icon keyboard_control">` |
| `arrow_back` | The "More" back button | `<span class="icon arrow_back">` |

The complete catalogue of built-in icon classes — and `acode.addIcon` for your own — is in [Built-in Icons](../interface-apis/side-buttons.md#built-in-icons).

## Related

- [`acode`](../global-apis/acode.md) — `define` / `require` and `addCommand`
- [Toast](./toast.md) and [Tutorial](./tutorial.md) — lightweight feedback for these actions
- [Context Menu API](../interface-apis/context-menu.md) — for menus outside the text selection flow
- [Sidebar Apps](../interface-apis/sidebar-apps.md) — a persistent home for selection tools
