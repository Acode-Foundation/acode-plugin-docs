# Color Picker

The `colorPicker` dialog box in Acode offers a way for users to choose colors within your plugins. This feature-rich color picker opens a dialog box showcasing a spectrum of color options, providing users with an intuitive and visually pleasing experience.

::: info
Verified against Acode **v1.13.5**: `src/dialogs/color.js`. `colorPicker` is registered as a module only (`acode.js`, `this.define("colorPicker", colorPicker)`) — there is **no** `acode.colorPicker()` method, so `acode.require("colorPicker")` is the only way in.
:::

## Usage

To integrate the `colorPicker` component into your Acode plugin, you can require it using the following code:

```javascript
const colorPicker = acode.require('colorPicker');
```

Once you have the `colorPicker` component, you can utilize it by calling the function and passing in the desired default color as a string argument:

```javascript
let selectedColor = await colorPicker('#ff0000');
```

In this example, the color picker dialog box will open with the default color set to red (`#ff0000`).

### Signature

| Signature | Returns |
| --- | --- |
| `colorPicker(defaultColor?: string, onhide?: () => void): Promise<string>` | Rejects with `new Error("cancelled")` |

::: tip
`defaultColor` may be omitted. The picker then starts from the last color **the user picked in the color picker**, stored in `localStorage.__picker_last_picked`, falling back to `"#fff"`.
:::

The format is detected from the string prefix and drives the initial editor mode:

| `defaultColor` prefix | Initial format | Resolved example |
| --- | --- | --- |
| `#` | `HEX` | `"#ff0000"` or `"#ff0000ff"` |
| `rgb` | `RGB` | `"rgb(255, 0, 0)"` or `"rgba(255, 0, 0, 0.5)"` |
| `hsl` | `HSL` | `"hsl(0, 100%, 50%)"` or `"hsla(0, 100%, 50%, 0.5)"` |
| anything else / omitted | `HEX` | — |

## Parameters

- **`defaultColor (string):`**
  - The default color that the color picker will display initially. It should be a string representing a color in hexadecimal format or rgba or hsl.

- **`onhide (Function):`**
  - An optional callback function to be called when the color picker dialog box is closed.

### Parameters at a glance

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `defaultColor` | `string` | No | `localStorage.__picker_last_picked \|\| "#fff"` | Starting color; also selects the initial `HEX` / `RGB` / `HSL` editor mode. |
| `onhide` | `() => void` | No | `undefined` | Called ~300 ms after the dialog closes, on **every** close path. |

## Returns

The `colorPicker` component returns a promise that:

- **resolves** to a string representing the selected color (hex / rgb / hsl, including alpha when used)
- **rejects** with `Error("cancelled")` when the user taps Cancel, the mask, or otherwise dismisses the dialog

The dialog also includes a format toggle (HEX / RGB / HSL).

The resolved string always uses the format that is currently selected in the toggle, and the alpha channel is included only when the picked color is actually translucent. The rejection `Error` has **no `code` property** — only `err.message === "cancelled"`.

### Dismissal paths

| Interaction | Outcome |
| --- | --- |
| **OK button** | Resolves with the current color string |
| **Cancel button** | Rejects with `Error("cancelled")` |
| **Backdrop tap** | Rejects with `Error("cancelled")` |
| **Android Back / Esc** | Rejects with `Error("cancelled")` — the action stack entry rejects too |

## Example

```javascript:line-numbers{1,3}
const colorPicker = acode.require('colorPicker');

try {
  const selectedColor = await colorPicker('#ff0000');
  console.log(`Selected Color: ${selectedColor}`);
} catch (err) {
  if (err?.message === 'cancelled') {
    console.log('User cancelled the color picker');
  } else {
    throw err;
  }
}
```

In this example, the `colorPicker` component opens with red as the default. The selected color is logged, or cancellation is handled explicitly.

### Reusing the previously picked color

```js
const colorPicker = acode.require('colorPicker');
const toast = acode.require('toast');
const KEY = 'myplugin.accentColor';

async function pickAccentColor() {
  const current = localStorage.getItem(KEY) || '#17c';
  try {
    const color = await colorPicker(current);
    localStorage.setItem(KEY, color);
    toast(`Accent colour set to ${color}`, 3000);
  } catch {
    // cancelled — keep the previous value
  }
}
```

## Gotchas <Badge type="tip" text="new" />

- **Cancellation is an exception, not a `null`.** Unlike [`prompt`](./prompt.md) and [`confirm`](./confirm.md), the only dismissal signal is a rejection, so the call **must** be wrapped in `try/catch`.
- **There is no `acode.colorPicker()`.** Only `acode.require("colorPicker")` exists.
- **The resolved string follows the toggle, not your input.** Ask for `#ff0000`, switch the user to `HSL`, and you get an `hsl()` string back.
- **`onhide` fires on success too**, and it runs after the ~300 ms close animation — do not use it as a "was cancelled" hook, the rejection is.
- **The picker remembers state globally.** `localStorage.__picker_last_picked` is written on every successful pick and reused as the default next time, so omitting `defaultColor` is not deterministic across sessions.
- **Alpha only appears when it is used.** Fully opaque colors resolve without the alpha channel (`#rrggbb`, `rgb()`, `hsl()`), so don't assume a fixed string width.

## See also

- [`select`](./select.md) — pick from a list
- [`prompt`](./prompt.md) — free-text input (e.g. for a hex code)
- [`confirm`](./confirm.md) — yes/no dialog
- [`alert`](./alert.md) — message with a single OK button
- [`multiPrompt`](./multi-prompt.md) — many inputs in one dialog
- [`dialogBox`](./custom-dialog.md) — build your own dialog
- [`loader`](./loader.md) — progress dialog