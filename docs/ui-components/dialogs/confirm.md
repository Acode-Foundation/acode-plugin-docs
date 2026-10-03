---
title: Confirm
description: Ask the user a yes/no question in a modal dialog.
---

# Confirm

`confirm` shows a modal with **Cancel** and **OK** buttons and resolves with the user's answer.

```js
const confirm = acode.require("confirm");
```

## Signature

```ts
confirm(title, message?, isHTML?, options?): Promise<boolean | { confirmed: boolean, checked: boolean }>
```

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | | Heading of the dialog. |
| `message` | `string` | | Body text. |
| `isHTML` | `boolean` | `false` | When `true`, `message` is rendered as sanitized HTML. Otherwise it is shown as plain text. |
| `options` | `object` | `{}` | See [Options](#options). |

If you pass only one argument, it is used as the **message** and the dialog has no title.

## Returns

A `Promise` that resolves with:

- `true` if the user pressed **OK**
- `false` if the user pressed **Cancel** or the back button, or the `signal` was aborted

With `options.returnState` set, it resolves with an object instead. See below.

## Options

| Option | Type | Description |
| --- | --- | --- |
| `checkboxText` | `string` | Adds a checkbox (unchecked) with this label under the message, such as "Don't ask again". |
| `returnState` | `boolean` | Resolve with `{ confirmed, checked }` instead of a boolean, so you can read the checkbox. |
| `signal` | `AbortSignal` | Aborting the signal closes the dialog and counts as **Cancel**. |
| `direction` | `"ltr" \| "rtl"` | Text direction of the dialog. |
| `aboveOverlay` | `boolean` | Draw the dialog above other overlays such as a full-screen page. |

## Examples

### Basic

```js
const confirm = acode.require("confirm");

if (await confirm("Delete file", "This cannot be undone. Continue?")) {
  // delete it
}
```

### With a checkbox

```js
const { confirmed, checked } = await confirm(
  "Reset settings",
  "All settings return to their defaults.",
  false,
  { checkboxText: "Also clear saved layouts", returnState: true },
);

if (confirmed) {
  resetSettings({ clearLayouts: checked });
}
```

### Auto-close after a timeout

```js
const controller = new AbortController();
setTimeout(() => controller.abort(), 10_000);

const ok = await confirm("Still there?", "Continue syncing?", false, {
  signal: controller.signal,
});
```

::: tip
`acode.confirm(title, message)` is a shorter wrapper that accepts only the first two arguments.
:::

## See also

- [Alert](./alert.md) for a message without a choice
- [Select](./select.md) for more than two choices
