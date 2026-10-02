# Confirm

The `confirm` ui component in Acode is a dialog box for displaying confirmation message modals to users. Whether you're seeking user approval for a critical action or confirming a decision, this component is best suited for this process.

::: info
Verified against Acode **v1.13.5**: `src/dialogs/confirm.js`.
:::

## Usage

To use the `confirm` component in your Acode plugin, you can require it using the following code:

```javascript
const confirm = acode.require('confirm');
```

Once you have the `confirm` component, you can create an instance with the following syntax:

```javascript
const confirmation = await confirm(
  'Warning',                   // Title of the confirmation message modal
  'Are you sure?'              // Body of the confirmation message modal
);
```

### Signature

| Signature | Returns |
| --- | --- |
| `confirm(titleText: string, message?: string, isHTML?: boolean, options?: ConfirmOptions): Promise<boolean \| { confirmed: boolean, checked: boolean }>` | Never rejects |

::: warning
`acode.confirm(title, message)` forwards **only two arguments**. `isHTML` and the whole `options` object are reachable only through `acode.require("confirm")`. See [Using the module directly](#using-the-module-directly).
:::

### Using the module directly

```js
const confirm = acode.require('confirm');

// Third argument enables HTML in the message body.
const html = await confirm('Release notes', '<b>1.13.5</b> ships today.', true);

// Fourth argument adds a checkbox and switches the resolved shape to an object.
const res = await confirm(
  'Enable telemetry',
  'Help us improve Acode.',
  false,
  { checkboxText: "Don't ask again", returnState: true },
);

if (res.confirmed && res.checked) {
  telemetryEnabled = true;   // your own state / storage
}
```

## Parameters

- **titleText (string):**
  - A string representing the title of the confirmation message modal. This title will be displayed at the top of the message modal.
  - If `message` is omitted, `titleText` is moved into the body and the title is left empty.

- **message (string):**
  - A string representing the body of the confirmation message modal.

- **isHTML (boolean):**
  - When `true`, `message` is inserted as HTML and sanitized with **DOMPurify**. When `false` (or omitted), it is set as `textContent` and is never parsed as markup.
  - Default: `false`

- **options (ConfirmOptions):**
  - An object that contains additional options for the confirm dialog.

### Parameters at a glance

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `titleText` | `string` | Yes | — | Title text. |
| `message` | `string` | No | `""` | Body message. |
| `isHTML` | `boolean` | No | `false` | Treat `message` as HTML (DOMPurify-sanitized). |
| `options` | `ConfirmOptions` | No | `{}` | See below. |

### ConfirmOptions <Badge type="tip" text="new" />

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `checkboxText` | `string` | `undefined` | When set, a checkbox with this label is rendered below the message. It always starts **unchecked**. |
| `returnState` | `boolean` | `false` | Resolves with `{ confirmed, checked }` instead of a bare boolean. |
| `signal` | `AbortSignal` | `undefined` | If already aborted when called, resolves `false` immediately. Aborting while the dialog is open also resolves `false`. |
| `direction` | `"ltr" \| "rtl"` | `undefined` | Sets the `dir` attribute on the dialog element, e.g. from `Intl`/locale direction. |
| `aboveOverlay` | `boolean` | `false` | Adds the `above-overlay` class so the dialog renders above an already-visible overlay. |

## Returns

The `confirm` component returns a promise that resolves to a `boolean` value. The boolean value represents whether the user confirmed or denied the message. A value of `true` represents confirmation, while `false` represents denial.

With `returnState: true` the promise instead resolves with an object:

| Property | Type | Description |
| --- | --- | --- |
| `confirmed` | `boolean` | `true` for OK, `false` for Cancel. |
| `checked` | `boolean` | State of the `checkboxText` checkbox (`false` when no checkbox was requested). |

`confirm()` **never rejects.** Every dismissal path resolves.

### Dismissal paths

| Interaction | Resolved value |
| --- | --- |
| **OK button** | `true` (or `{ confirmed: true, checked }`) |
| **Cancel button** | `false` (or `{ confirmed: false, checked }`) |
| **Android Back / Esc** | `false` — the action stack entry *is* the cancel handler |
| **Backdrop tap** | Nothing happens; the backdrop has no click handler |
| **`signal` aborted** | `false` (or `{ confirmed: false, checked: false }`) |

## Example

```javascript:line-numbers{1,3}
const confirm = acode.require('confirm');

let confirmation = await confirm('Warning', 'Are you sure?');
if (confirmation) {
  window.toast('File deleted...', 4000);
} else {
  window.toast('File not deleted...', 4000);
}
```

In this example, the `confirm` component is utilized to ask the user if they want to delete a file. If the user confirms, the message "File deleted." will be toasted. If the user denies, the message "File not deleted." will be toasted.

## Gotchas <Badge type="tip" text="new" />

- **Cancellation is not an exception.** Back / Esc and Cancel both resolve `false`, so `try/catch` around `confirm()` is dead code — check the boolean instead.
- **`acode.confirm()` hides two parameters.** Passing a third or fourth argument to `acode.confirm(...)` silently does nothing. Use `acode.require("confirm")` for `isHTML`, `checkboxText`, `returnState`, `signal`, `direction` or `aboveOverlay`.
- **Tapping the backdrop does nothing.** The user must press Cancel, OK, or the system Back button.
- **`checkboxText` always starts unchecked** — there is no option to preselect it.
- **`checked` reflects the live toggle on *both* paths.** The checkbox state is read when the dialog closes, so pressing Cancel after ticking the box still returns `checked: true` alongside `confirmed: false`. Branch on `confirmed` first.
- **Multiple confirms can stack.** Each call registers its own `confirm-<n>` action-stack id, so nested confirms behave predictably — but they render simultaneously.

## See also

- [`alert`](./alert.md) — no answer, just a message
- [`prompt`](./prompt.md) — single text input
- [`select`](./select.md) — pick from a list
- [`multiPrompt`](./multi-prompt.md) — many inputs in one dialog
- [`colorPicker`](./color-picker.md) — pick a color
- [`dialogBox`](./custom-dialog.md) — build your own dialog
- [`loader`](./loader.md) — progress dialog
- [Toast](../toast.md) — non-blocking message