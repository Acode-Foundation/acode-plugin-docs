---
title: Alert
description: Show a modal message with a single OK button.
---

# Alert

`alert` shows a modal message and an **OK** button. It is the Acode equivalent of the browser's `alert()`.

```js
const alert = acode.require("alert");
```

## Signature

```ts
alert(title, message, onhide?): void
```

| Parameter | Type | Description |
| --- | --- | --- |
| `title` | `string` | Heading of the dialog. |
| `message` | `string` | Body text. Treated as HTML after sanitizing, and any `http(s)://` URL in it becomes a link. |
| `onhide` | `() => void` | Optional. Called when the user taps **OK** or outside the dialog. Not called when the dialog is closed with the back button. |

If you pass only one argument, it is used as the **message** and the dialog has no title:

```js
alert("Saved!");
```

`alert` returns immediately; it does not wait for the user. Use `onhide` to run code after the dialog closes, but don't rely on it running: closing the dialog with the back button skips it.

::: warning
Because `message` is rendered as HTML, escape any text that comes from a file, a network response or the user before putting it in the message.
:::

## Example

```js
const alert = acode.require("alert");

alert(
  "Update available",
  "Version <b>2.0</b> is out. Details: https://example.com/changelog",
  () => window.toast("Alert closed", 3000),
);
```

## See also

- [Confirm](./confirm.md) for a yes/no question
- [Toast](../toast.md) for a message that disappears by itself
