---
title: Select
description: Show a list of choices in a dialog and get the user's pick.
---

# Select

`select` opens a dialog with a list of options and resolves with the `value` of the option the user picks.

```js
const select = acode.require("select");
```

## Signature

```ts
select(title, items, options?): Promise<string>
```

| Parameter | Type | Description |
| --- | --- | --- |
| `title` | `string` | Heading shown at the top of the dialog. Pass an empty string for no heading. |
| `items` | `Array<string \| SelectItem \| Array>` | The options to show. See [Items](#items). |
| `options` | `SelectOptions \| boolean` | Optional. See [Options](#options). |

**Returns:** a `Promise` that resolves with the selected item's `value`.

If the user cancels (back button or tapping outside), the promise **never resolves** unless you pass `true` as `options`, in which case it rejects. See [Handling cancel](#handling-cancel).

## Items

An item can be written in three ways. Prefer the **object form**; it is the only one that supports every field and it has no positional pitfalls.

### Strings

The string is used as both the `value` and the label.

```js
const color = await select("Pick a color", ["Red", "Green", "Blue"]);
```

### Objects <Badge type="tip" text="recommended" />

```js
const item = await select("File actions", [
  { value: "edit", text: "Edit", icon: "edit" },
  { value: "share", text: "Share", icon: "share", subText: "Send to another app" },
  { value: "delete", text: "Delete", icon: "delete", disabled: true },
]);
```

| Field | Type | Description |
| --- | --- | --- |
| `value` | `string` | Returned when the item is picked. Leave it out only on `disabled` items that act as a label or note. |
| `text` | `string` | Label. Rendered as HTML after sanitizing, so basic markup such as `<b>` works. Escape any user-provided text. |
| `subText` | `string` | Smaller line shown under the label. |
| `icon` | `string` | CSS class of an icon (for example `"edit"`), or `"letters"` to draw `letters` as an avatar. |
| `letters` | `string` | Initials to show when `icon` is `"letters"`. |
| `fileIcon` | `{ name: string, kind?: "file" \| "folder" }` | Show the [file icon](../../utilities/file-icons.md) for a file name or folder. Takes priority over `icon`. |
| `disabled` | `boolean` | Grays the item out and makes it non-interactive. |
| `checkbox` | `boolean` | Adds a checkbox in the tail of the row, initially checked when `true`. |
| `tailElement` | `HTMLElement` | Custom element for the tail of the row. Overrides `checkbox`. |
| `ontailclick` | `(event: Event) => void` | Click handler for `tailElement`. The click does not select the item. |
| `className` | `string` | Extra CSS class added to the row. |
| `title` | `string` | Tooltip and accessibility label of the row. |

### Arrays (legacy)

`[value, text, icon, disabled, letters, checkbox]`. This form exists for older plugins and cannot set `subText`, `fileIcon` or `tailElement`.

::: warning Boolean quirk
In array form, a boolean at index 2 or later is read as an **enabled** flag, so `false` disables the item and `true` enables it. This is the opposite of the object form's `disabled` field. Use objects to avoid the confusion.
:::

## Options

Pass an object to change how the dialog behaves.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `hideOnSelect` | `boolean` | `true` | Close the dialog after an item is picked. Set to `false` to keep it open. The promise still resolves only once, with the first pick. |
| `default` | `string` | none | `value` of the item to highlight and scroll into view. Also receives keyboard focus. |
| `textTransform` | `boolean` | `false` | Apply the list's default text transformation to labels. By default labels are shown exactly as written. |
| `className` | `string` | none | Extra CSS class for the dialog. |
| `onCancel` | `() => void` | none | Called when the user dismisses the dialog without picking. |
| `onHide` | `() => void` | none | Called whenever the dialog closes, whether by a pick or a cancel. |

### Handling cancel

There are two ways to react to cancel:

```js
// 1. Callback: the promise stays pending forever, so use it for side effects
await select("Choose", items, { onCancel: () => console.log("cancelled") });

// 2. Reject: pass `true` instead of an options object
try {
  const value = await select("Choose", items, true);
} catch {
  // user cancelled
}
```

::: tip
Passing `true` replaces the options object, so you cannot combine it with `default` or `hideOnSelect`. If you need both, use `onCancel` to resolve your own promise.
:::

## Examples

### Rich list

```js
const action = await select(
  "File actions",
  [
    { value: "edit", text: "Edit file", icon: "edit" },
    { value: "share", text: "Share file", icon: "share" },
    { value: "delete", text: "Delete file", icon: "delete", disabled: true },
  ],
  { default: "edit" },
);
```

### Checkbox items

The `checkbox` field only **shows** a checkbox. Tapping the row picks the item as usual: the checkbox does not toggle, and `select` does not return its state.

```js
const feature = await select("Toggle feature", [
  { value: "sync", text: "Cloud sync", checkbox: true },
  { value: "backup", text: "Auto backup", checkbox: false },
]);
// feature is "sync" or "backup"; flip it in your own state and reopen the list if needed
```

::: info
To let the user toggle several options in one dialog, use [Multi Prompt](./multi-prompt.md) with `checkbox` inputs. For a tappable control inside the row, pass your own `tailElement` with `ontailclick`.
:::

### Letter avatars

```js
const user = await select("Choose user", [
  { value: "john", text: "John Smith", icon: "letters", letters: "JS" },
  { value: "jane", text: "Jane Doe", icon: "letters", letters: "JD" },
]);
```

### File icons

```js
const file = await select("Open", [
  { value: "index.js", text: "index.js", fileIcon: { name: "index.js" } },
  { value: "src", text: "src", fileIcon: { name: "src", kind: "folder" } },
]);
```
