# Alert

The `alert` component in Acode is a dialog box for displaying messages, warnings, or errors to users within a modal window. Similar to the traditional JavaScript `alert()`.

::: info
Verified against Acode **v1.13.5**: `src/dialogs/alert.js`. `acode.require("alert")` and `acode.alert(...)` are the **same function** — the `Acode` class method simply forwards its three arguments (`src/lib/acode.js`, `alert(title, message, onhide)`).
:::

## Usage

To use the `alert` component in your Acode plugin, you can require it using the following code:

```javascript
const alert = acode.require('alert');
```

Once you have the `alert` component, you can create an instance with the following syntax:

```js
alert(
  'Title of Alert',          // Title of the alert modal
  'The alert body message..', // Message to display in the body of the alert modal
  () => {
    // Optional function to call when the alert modal is closed
    window.toast('Alert modal closed', 4000);
  }
);
```

### Signature

| Signature | Returns |
| --- | --- |
| `alert(titleText: string, message?: string, onhide?: () => void): void` | `undefined` — this dialog is **not** promise-based |

::: tip
You can call either form, they are identical:

```js
const alert = acode.require('alert');

alert('Heads up', 'Something happened');
acode.alert('Heads up', 'Something happened');
```
:::

### Single-argument form

If `message` is falsy and `titleText` is not, the two arguments swap places: your single string becomes the **message** and the title is left empty.

```js
const alert = acode.require('alert');

// Renders "Save failed" as the body, with no title.
alert('Save failed');
```

## Parameters

- **titleText (string):**
  - The text to display in the title of the alert modal. Rendered into a `<strong class="title">`, so it is always plain text.
  - If `message` is not provided this value is used as the body instead.

- **message (string):**
  - The message to display in the body of the alert modal.
  - Inserted as HTML and then sanitized with **DOMPurify**, so basic markup survives but scripts do not.
  - Any `http://` / `https://` URL inside the message is auto-wrapped in an `<a href>` before sanitizing.

- **onhide (Function):**
  - An optional function to call when the alert modal is closed.

### Parameters at a glance

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `titleText` | `string` | Yes | — | Title text. |
| `message` | `string` | No | `""` | Body message (HTML allowed, DOMPurify-sanitized, URLs auto-linked). |
| `onhide` | `() => void` | No | `undefined` | Called when the dialog closes via the OK button or a backdrop tap. |

## Returns

`alert()` returns `undefined`. It is a fire-and-forget dialog: there is no promise to await, and the only way to react to the dismissal is the `onhide` callback.

## Behavior

| Interaction | Result |
| --- | --- |
| **OK button** | Closes the dialog and calls `onhide()`. The label is the localized `strings.ok`. |
| **Backdrop tap** | Closes the dialog and calls `onhide()`. |
| **Android Back / Esc** | Removes the dialog, but `onhide` is **not** called — the action stack entry is wired straight to the internal `hideAlert()` teardown. |
| **Second `alert()` while one is open** | Both alerts render on top of each other, but they share the action-stack id `"alert"` and `remove()` only drops the first matching entry, so overlapping alerts can leave the back stack slightly out of sync. Call one alert at a time. |

## Example

```javascript:line-numbers{1,7}
const alert = acode.require('alert');

const handleOnHide = () => {
  window.toast('Alert modal closed', 4000);
};

alert('Title of Alert', 'The alert body message..', handleOnHide);
```

In this example, when the alert modal is closed, the `handleOnHide` function will be called, and a toast message **'Alert modal closed'** will be displayed for 4000 milliseconds. This allows you to perform additional actions or provide feedback when the user interacts with the alert dialog.

## Gotchas <Badge type="tip" text="new" />

- **Not awaitable.** Unlike [`confirm`](./confirm.md), [`prompt`](./prompt.md), [`select`](./select.md), [`multiPrompt`](./multi-prompt.md) and [`colorPicker`](./color-picker.md), `alert()` never returns a promise. Wrap it in your own promise if you need to sequence work after dismissal.
- **`onhide` is not a dismissal guarantee.** Android Back / Esc bypasses it. Use [`acode.require("confirm")`](./confirm.md) when you need a definitive yes/no answer.
- **Title and message swap** when `message` is omitted — a very common source of "my alert has no title" reports.
- **Message is sanitized, not escaped.** Tags like `<b>` render; `<script>` is stripped by DOMPurify.

## See also

- [`confirm`](./confirm.md) — promise-based yes/no dialog
- [`prompt`](./prompt.md) — single text input
- [`select`](./select.md) — pick one of many options
- [`multiPrompt`](./multi-prompt.md) — many inputs in one dialog
- [`colorPicker`](./color-picker.md) — pick a color
- [`dialogBox`](./custom-dialog.md) — build your own dialog
- [`loader`](./loader.md) — progress dialog
- [Toast](../toast.md) — non-blocking message
- [Action Stack](../../advanced-apis/action-stack.md) — why Back / Esc behaves differently per dialog