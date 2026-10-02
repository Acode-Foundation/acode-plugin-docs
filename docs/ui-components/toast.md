# Toast

This ui component help in showing toast messages for given time interval.

::: info
Verified against Acode **v1.13.5**: `src/components/toast/index.js`, `src/components/toast/style.scss`. Registered as the `toast` module (`acode.js`, `this.define("toast", toast)`) and assigned to `window.toast` in `src/main.js`. There is **no** `acode.toast()` method.
:::

## Usage

To use the `toast` component in your Acode plugin, you can require it using the following code:

```javascript
const toast = acode.require('toast');
```

Once you have the `toast` component, you can use it with the following syntax:

```javascript
toast('Hello, World!', 3000);
```

::: info
You can also use toast function directly from the global object without requiring it using acode.
For eg:
```javascript
window.toast('Hello, World!', 3000);
```
:::

### Signature

| Signature | Returns |
| --- | --- |
| `toast(message: string \| HTMLElement, duration?: number \| false, bgColor?: string, color?: string): void` | `undefined` — there is no id or handle |

```js
const toast = acode.require('toast');

toast('Saved', 3000);                                   // auto-hide after 3s
toast('Permanent', false);                              // sticky, with an ✕ button
toast('Themed', false, '#17c', '#fff');                 // sticky + custom colours
```

## Parameters

- **msg (string):**
  - The message to be displayed in the toast. An `HTMLElement` is also accepted and is appended as-is inside the `.message` span.
  
- **milliSecond (number):**
  - The duration in milliseconds for which the toast should be displayed.
  - Defaults to `0`, which the component turns into **3000 ms**. Pass `false` for a sticky toast that never auto-hides and shows a dismiss (`✕`) button instead.

- **bgColor (string):**
  - Optional CSS colour for the toast's inline `backgroundColor`.

- **color (string):**
  - Optional CSS colour for the toast's inline `color` (text).

### Parameters at a glance

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `message` | `string \| HTMLElement` | Yes | — | Body content. |
| `duration` | `number \| false` | No | `0` → **3000 ms** | Auto-hide delay. `false` = sticky + dismiss button. |
| `bgColor` | `string` | No | theme default | Inline `background-color`. |
| `color` | `string` | No | theme default | Inline `color`. |

## Returns

`toast()` returns `undefined`. The element it builds has private `show()` / `hide()` methods, but they are **not** returned to you.

To dismiss the visible toast yourself, use the module-level `hide` that ships on the function itself:

```js
const toast = acode.require('toast');

toast.hide();                 // hides whatever #toast is currently on screen
```

::: warning
`toast.hide()` looks up `#toast` at call time, so it only ever affects the toast that is currently visible — toasts still sitting in the queue will surface afterwards.
:::

## Markup and placement

| Detail | Value |
| --- | --- |
| Element id | `#toast` — only ever one attached at a time; the rest wait in an internal queue |
| Position | `position: fixed`, `bottom: 10px`, horizontally centred (`left: 0; right: 0; margin: 0 auto`) |
| Stacking | `z-index: 9999` |
| Hit testing | `pointer-events: none` by default; becomes `pointer-events: all` only when the `clickable` attribute is `"true"` — which happens exactly when `duration` is `false` |
| Sizing | `max-width: 80vw`, `max-height: 50vh`, `width: fit-content` |
| Default colours | `background-color: rgba(9, 14, 29, 0.9)`, `color: white`, `border-radius: 4px` |
| Inner markup | `<span class="message">…</span>` plus, for sticky toasts, `<button class="icon clearclose">` |
| Animation | Slides up and scales in on show (spring), fades and drops out over 250 ms on hide |

## Example

```javascript:line-numbers
const toast = acode.require('toast');

toast('Hello, World!', 3000);

// or 
window.toast('Hello, World!', 3000);
```

This will display the message "Hello, World!" for 3 seconds (3000 milliseconds).

### Sticky toast with custom colours

```js
const toast = acode.require('toast');

// Stays until the user taps the ✕ button.
toast('Reconnecting…', false, '#17c', '#fff');
```

### Dismissing programmatically

```js
const toast = acode.require('toast');

toast('Working…', 3000);
setTimeout(() => toast.hide(), 1000);
```

## Gotchas <Badge type="tip" text="new" />

- **Toasts queue, they do not stack.** If a toast is already visible, the new one is pushed onto an internal queue and shown only when the previous one finishes hiding.
- **Omitting `duration` gives you 3 seconds, not an infinite toast.** The parameter defaults to `0`, and `setTimeout(…, duration || 3000)` turns that into 3000 ms. Use `false` for sticky.
- **No handle, no id, no chaining.** The return value is `undefined`, so you cannot target an individual toast — only `toast.hide()` for the visible one.
- **Dismiss buttons only appear with `duration: false`.** With any number, the toast is not clickable (`pointer-events: none`).
- **`bgColor` / `color` are inline styles** and override the stylesheet default (`rgba(9, 14, 29, 0.9)` with white text), so you own the contrast.
- **`acode.toast()` does not exist.** Use `acode.require('toast')` or the global `window.toast`.

## See also

- [`alert`](./dialogs/alert.md) — blocking modal message
- [`confirm`](./dialogs/confirm.md) — yes/no dialog
- [`prompt`](./dialogs/prompt.md) — free-text input
- [`select`](./dialogs/select.md) — pick from a list
- [`loader`](./dialogs/loader.md) — long-running progress indicator
- [`colorPicker`](./dialogs/color-picker.md) — pick a color
- [`dialogBox`](./dialogs/custom-dialog.md) — build your own dialog
- [`multiPrompt`](./dialogs/multi-prompt.md) — many inputs in one dialog