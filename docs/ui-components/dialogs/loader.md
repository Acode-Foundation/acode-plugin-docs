# Loader

The `loader` ui component in Acode is utility that help you to display loading dialogs with customizable titles and messages. These loading dialogs offer an informative and engaging experience for users while waiting for various processes to complete. The component also provides options for setting timeouts and callback functions for handling loading process cancellations.

::: info
Verified against Acode **v1.13.5**: `src/dialogs/loader.js`.
:::

::: warning
The third argument is a **`LoaderOptions` object** — `{ timeout, oncancel }` — **not** a bare cancel callback, and `timeout` is the delay **before the Cancel button appears**, not an auto-cancel timer. `acode.require("loader")` returns the *module*; `acode.loader(...)` returns a *loader handle*.
:::

## Methods and Usage

The `loader` component offers a variety of methods to control and manage the loading dialog:

### `showTitleLoader(immortal?: boolean)`

- **Usage:** Shows the title loader.
- **Returns:** `undefined`
- **Parameters:**
  - `immortal {boolean}` Optional, default `false`. If `true`, the loader will not be removed automatically.

### `removeTitleLoader(immortal?: boolean)`

- **Usage:** Hides the title loader.
- **Returns:** `undefined`
- **Parameters:**
  - `immortal {boolean}` If not `true`, the loader will not remove when `immortal` was `true` when it was created.


:::tip
`showTitleLoader()` & `removeTitleLoader()` are loader methods to create and destroy a small spinner from title. Its good while opening any file in editor or working inside editor
:::

### `create(titleText, message?, options?)`

- **Usage:** Creates a new loading dialog with the specified options and **returns the loader handle**. It is *not* promise-based.
- **Returns:** [`Loader`](#loader-handle)
- **Parameters:**

  | Name | Type | Required | Default | Description |
  | --- | --- | --- | --- | --- |
  | `titleText` | `string` | Yes | — | Title text. If `message` is falsy, this value is used as the message and the title is left empty. |
  | `message` | `string` | No | `""` | Body message. Inserted as HTML and sanitized with **DOMPurify**; `white-space: pre-wrap` is applied so `\n` renders. |
  | `options` | `LoaderOptions` | No | `{}` | See below. |

  **LoaderOptions**

  | Key | Type | Default | Description |
  | --- | --- | --- | --- |
  | `timeout` | `number` | `undefined` | Delay **before the Cancel button is appended**, in milliseconds. No Cancel button is rendered when omitted. |
  | `oncancel` | `() => void` | `undefined` | Invoked **only** when the user actually taps that Cancel button. |

### `destroy()`

- **Usage:** Removes the loading dialog from the DOM permanently (after the ~300 ms close animation) and releases the action-stack lock.
- **Returns:** `undefined`
- **Note:** The module-level `destroy()` / `hide()` / `show()` operate on the **current** loader only.

### `hide()`

- **Usage:** Hides the loading dialog temporarily. The dialog can be restored using the `show()` method.
- **Returns:** `undefined`

### `show()`

- **Usage:** Shows a previously hidden loading dialog.
- **Returns:** `undefined`

:::info
The `create()` method should be called before using other methods except `showTitleLoader()` & `removeTitleLoader()`.
:::

### `Loader` handle <Badge type="tip" text="new" />

`create()` — and `acode.loader(...)` — return an object with **exactly five** members:

| Member | Signature | Description |
| --- | --- | --- |
| `setTitle` | `(title: string) => void` | Replaces the title text. |
| `setMessage` | `(message: string) => void` | Replaces the message (DOMPurify-sanitized HTML). |
| `hide` | `() => void` | Removes the dialog and mask from the DOM immediately; recoverable with `show()`. |
| `show` | `() => void` | Re-appends a hidden dialog and mask. |
| `destroy` | `() => void` | Plays the hide animation, then removes the node and unfreezes the action stack. |

There is **no** `success()` method — a successful load is simply `destroy()` (or `hide()`).

## Signature

| Signature | Returns |
| --- | --- |
| `acode.require("loader").create(titleText: string, message?: string, options?: LoaderOptions): Loader` | The handle |
| `acode.loader(titleText: string, message?: string, options?: LoaderOptions): Loader` | The handle |
| `acode.require("loader")` | `{ create, destroy, hide, show, showTitleLoader, removeTitleLoader }` |

```js
const loader = acode.require('loader');
let cancelled = false;

const $loader = loader.create('Working', 'Downloading…', {
  timeout: 5000,             // show a Cancel button after 5s
  oncancel: () => {
    cancelled = true;
  },
});
```

## Example

```javascript:line-numbers
const loader = acode.require('loader');

// Create the loader with specified options
const $loader = loader.create('Title Text', 'Message…', {
  timeout: 5000,
  oncancel: () => window.toast('Loading cancelled', 4000),
});

$loader.setMessage('Almost there…');

// Hide the loader after 2 seconds
setTimeout(() => {
  $loader.hide();
}, 2000);

// Show the loader after 4 seconds
setTimeout(() => {
  $loader.show();
}, 4000);

// Destroy the loader after 6 seconds
setTimeout(() => {
  $loader.destroy();
}, 6000);

// example of `showTitleLoader()` & `removeTitleLoader()`
loader.showTitleLoader();

// remove the title loader after 4 seconds
setTimeout(() => {
  loader.removeTitleLoader();
}, 4000);
```

In this example, the `create()` method is called with the specified options to create a loading dialog. The loader is then hidden after 2 seconds, shown after 4 seconds, and finally destroyed after 6 seconds.

### Wrapping a promise

::: tip
Because `loader` is callback-based, wire it to your own promise and always `destroy()` in a `finally` block — otherwise the action stack stays frozen and the user cannot navigate.
:::

```js
const loader = acode.require('loader');
const $loader = loader.create('Downloading…', 'Please wait');

try {
  const res = await fetch(url).then((r) => r.json());
  $loader.setMessage('Done');
  return res;
} finally {
  $loader.destroy();
}
```

:::tip

- Use the `loader` component to provide informative loading dialogs during time-consuming operations.
- Utilize the `timeout` and `oncancel` options to handle cancellations gracefully.
- Show and hide the loader as needed to keep users informed about the process.
  :::

:::danger

- Be cautious with long timeouts, as it may affect the user experience.
  :::

## Gotchas <Badge type="tip" text="new" />

- **`timeout` is not an auto-cancel.** It only delays the appearance of the Cancel button. If you want the work aborted after N ms, run your own `setTimeout`.
- **`oncancel`, not `callback`.** The `LoaderOptions` key is `oncancel` (all lowercase). A `{ callback: fn }` object is silently ignored.
- **`acode.require("loader")` is the module, not a handle.** Calling `acode.require("loader").hide()` before any `create()` is a no-op on `null`. Use the object returned by `create()` / `acode.loader(...)` for per-instance control.
- **A loader freezes the action stack.** `create()` calls `actionStack.freeze()`, so Android Back / Esc does nothing until `destroy()` runs. Always `destroy()`; `hide()` alone leaves the app locked.
- **There is only one loader.** A new `create()` removes the previous dialog and mask immediately — a long task that starts a second loader kills the first one's UI without warning. Track handles yourself.
- **Module-level `destroy()` / `hide()` / `show()` are global.** They act on whichever loader is current, so concurrent flows can close each other's dialogs.
- **Message is sanitized, not escaped.** Inline markup renders; `<script>` is stripped by DOMPurify.
- **`hide()` then `show()` re-appends to `app`.** If a newer loader was created in between, `show()` can resurrect a stale dialog next to it.

## See also

- [`alert`](./alert.md) — simple modal message
- [`confirm`](./confirm.md) — yes/no dialog
- [`prompt`](./prompt.md) — free-text input
- [`select`](./select.md) — pick from a list
- [`multiPrompt`](./multi-prompt.md) — many inputs in one dialog
- [`colorPicker`](./color-picker.md) — pick a color
- [`dialogBox`](./custom-dialog.md) — build your own dialog
- [Toast](../toast.md) — non-blocking message (better than a loader for short work)