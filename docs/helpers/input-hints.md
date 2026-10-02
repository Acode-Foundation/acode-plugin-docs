# Input Hints

`acode.require('inputhints')` is the low-level autocomplete-list widget that powers Acode's own search palette. It attaches a filterable dropdown of hints to a plain `<input>` and cleans itself up when the field loses focus.

:::info Verified against Acode v1.13.5
Every signature below is taken from `src/components/inputhints/index.js`.
:::

**Functionality:**

* Generates a list of hints based on user input.
* Displays matching hints as the user types.
* Allows users to select a hint and populate the input field.

**Usage:**
you import like this
```javascript
const inputHints = acode.require('inputHints');
```

::: warning The module id is `inputhints`
`acode.require('inputHints')` happens to work because `require()` lower-cases the name before the lookup, but the registered id is `inputhints` (all lowercase). Both spellings resolve to the same function.
:::

```javascript
const inputhints = acode.require('inputhints');

const $input = document.getElementById("myInput");
const hints = ["apple", "banana", "cherry"]; // Array of hint strings

const handleSelect = (value) => {
  console.log("Selected hint:", value);
};

const hintsComponent = inputhints($input, hints, handleSelect);

console.log("Selected hint element:", hintsComponent.getSelected());
console.log("Hint list container:", hintsComponent.container);
```

## Signature

```js
inputhints($input, hints, onSelect, options = {})
```

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `$input` | `HTMLInputElement` | Yes | — | The field to attach to. A `focus` listener is bound immediately, before the function returns |
| `hints` | `Array<string \| HintObj>` \| `HintCallback` | Yes | — | A static hint list, or a function that produces one |
| `onSelect` | `(value: string) => void` | No | `undefined` | Called with the selected hint's `value`. Optional — the code guards with `if (onSelect)` |
| `options` | `object` | No | `{}` | Options object |
| `options.dynamic` | `boolean` | No | falsy | Re-invoke a `HintCallback` on every keystroke instead of filtering the initial list locally. Only meaningful when `hints` is a function |

**Returns** — this is the entire public surface:

| Field | Type | Description |
| --- | --- | --- |
| `getSelected()` | `undefined` | **Returns nothing.** The implementation looks up the `.active` row and discards the result. Read `container` yourself instead |
| `container` (getter) | `HTMLUListElement` | The same `<ul id="hints">` for the lifetime of the component. While the field is blurred it is simply detached from the document — check `container.isConnected` rather than expecting `null` |

## Hint item shape

Each entry is either a plain string or an object:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `string` | Yes | Handed to `onSelect`, and rendered as the row's `value` attribute |
| `text` | `string` | Yes | Rendered as the row's `innerHTML` after `DOMPurify.sanitize()`. Also what filters against your typing |
| `active` | `boolean` | No | Start with this row highlighted |

Passing a bare string is shorthand for `{ value: str, text: str }`.

```javascript
const hints = [
  'plain string',
  { value: 'file:///sdcard/a.js', text: '<strong>a.js</strong>' },
  { value: 'file:///sdcard/b.js', text: '<strong>b.js</strong>', active: true },
];
```

## Dynamic hints

Pass a function instead of an array to generate hints yourself:

| Type | Signature | Description |
| --- | --- | --- |
| `HintCallback` | `(setHints: (hints: Array<Hint>) => void, modification: HintModification, query: string) => void` | Note the argument order: **the setter first, the query last** |
| `HintModification` | `{ add(item, index?), remove(item), removeIndex(index) }` | Incremental edits to the current list, for streamed results |
| `Hint` | `string \| HintObj` | As above |

With a callback provider:

1. A single loading row (the localised `loading...` string) is rendered first.
2. The callback is invoked **immediately** with an empty `query`.
3. Call `setHints(list)` when your results arrive; that also clears the loading state.
4. With `options.dynamic: true`, it is re-invoked 120 ms after the last keystroke with the current input value. A version counter discards responses that arrive out of order, and the timer is cancelled on blur.

Without `dynamic`, the callback runs exactly once and the returned list is filtered locally as you type.

## Behaviour

**Show / hide.** `focus` on the input attaches the `keypress`, `keydown`, `blur` and `input` listeners plus a `window` `resize` listener, appends the `<ul>` to `app` (`document.body`) and positions it. `blur` clears both pending timers, bumps the version counter, removes every listener and calls `$ul.remove()`. The list is only in the DOM while the field is focused.

**Filtering** (static mode). The typed text is escaped with `escapeRegExp()` and compiled into a case-insensitive `RegExp`. A hint survives if the regex matches its `value` **or** its `text` — so markup inside `text` can influence matching.

**Pagination.** At most `LIMIT = 100` rows are rendered. Scrolling to the bottom appends the next 100. The first render is synchronous; every later one is debounced by 300 ms.

**Empty result.** When nothing matches, a single non-selectable row reading `No matches found` is rendered.

**Positioning.** `position: fixed`. The list goes **below** the input when at least half the viewport height remains beneath it (`top = input.bottom + 5`), otherwise **above** (`bottom = input.top - 5`, plus the `.bottom` class which flips the corner radius). `left` and `width` mirror the input's bounding box. If no row is highlighted, the first row is marked `.active`.

**Selection.**

| Input | Effect |
| --- | --- |
| Click / tap | Fills the input with the row's `textContent` (the rendered text, markup stripped), then calls `onSelect(value)` with the row's `value` attribute, then hides the list |
| `Enter` | Does nothing unless a row is `.active`. Calls `onSelect(value)` — and **only** writes to the input when `onSelect` was **not** supplied |
| `ArrowDown` / `ArrowUp` | Moves `.active` to the next/previous row, wrapping at both ends, and calls `scrollIntoView()` |

## Complete example: hints on a custom page input

```javascript
// main.js
if (window.acode) {
  const inputhints = acode.require('inputhints');

  acode.setPluginInit('com.example.hints', (baseUrl, $page) => {
    const FRUITS = ['apple', 'apricot', 'avocado', 'banana', 'cherry', 'lemon'];

    const $input = <input type="text" placeholder="Pick a fruit…" />;
    const $output = <small className="value"></small>;

    $input.oninput = () => {
      $output.textContent = $input.value ? `You typed "${$input.value}"` : '';
    };

    const component = inputhints($input, FRUITS, (value) => {
      $output.textContent = `Selected: ${value}`;
    });

    $page.appendBody(
      <form className="main">
        <div className="text">{"Fruit"}</div>
        {$input}
        {$output}
        <small>{component.container.isConnected ? "List is mounted" : "List is detached"}</small>
      </form>
    );
  });
}
```

## Complete example: hints on a plugin settings-page input

Because `acode.require('settingsPage')` does not exist, the way to put a hinted input on a settings page is to build it yourself on the plugin's own page:

```javascript
const inputhints = acode.require('inputhints');
const settings = acode.require('settings');
const storageKey = 'com.example.themepicker';

settings.value[storageKey] = { theme: '', ...(settings.value[storageKey] || {}) };
const values = settings.value[storageKey];

function save() {
  return settings.update(false);
}

acode.setPluginInit(
  storageKey,
  (baseUrl, $page) => {
    const THEMES = ['system', 'dark', 'light', 'oled', 'monokai', 'noctisLilac'];

    const $input = <input type="text" value={values.theme} placeholder="Theme id…" />;
    const $status = <small className="value">{values.theme || "No theme selected yet"}</small>;

    // Dynamic provider: only the callback runs per keystroke, the component
    // does the filtering and rendering.
    inputhints(
      $input,
      (setHints, modification, query) => {
        const escaped = String(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regexp = new RegExp(escaped, 'i');
        setHints(
          THEMES.filter((id) => regexp.test(id)).map((id) => ({
            value: id,
            text: id === query.toLowerCase() ? `<strong>${id}</strong>` : id,
          }))
        );
      },
      (value) => {
        values.theme = value;
        $status.textContent = `Selected: ${value}`;
        save();
      },
      { dynamic: true }
    );

    $page.appendBody(
      <form className="main">
        <div className="text">{"App theme"}</div>
        {$input}
        {$status}
      </form>
    );
  },
  {
    list: [{ key: 'theme', text: 'App theme', value: values.theme }],
    cb(key, value) {
      values[key] = value;
      save();
    },
  },
);
```

## Gotchas

::: danger `getSelected()` always returns `undefined`
The JSDoc claims `() => HTMLLIElement`, but the body of the function calls `$ul.get('.active')` **without returning it**. Use the container instead:

```javascript
const component = inputhints($input, hints, onSelect);
const active = () => component.container?.get('.active') ?? component.container?.firstElementChild;
```
:::

::: warning Click and Enter behave differently
A click always writes to the input and then calls `onSelect`. Enter only calls `onSelect` — the input is written to *only if you passed no `onSelect`*. If you supply `onSelect`, you own filling the field.
:::

::: warning Enter does not close the list
`handleKeypress` never calls `onblur()`, so after pressing Enter the list stays open until the field blurs. The click path does close it.
:::

::: warning The `focus` listener is never removed
`$input.addEventListener('focus', onfocus)` runs once at construction and is not part of the teardown. Calling `inputhints()` twice on the same input attaches two independent widgets, and destroying the input leaves the listener behind. Create one per input, and drop the input with the page.
:::

::: danger `text` is injected as HTML
Rows are built with `innerHTML={DOMPurify.sanitize(text)}`. Sanitisation strips scripts but keeps markup such as `<img>`, so putting raw user content in `text` can still trigger network requests. `value` is *not* rendered — it is only the `value` attribute — so put untrusted strings there and keep `text` for trusted formatting.
:::

::: info Filtering also matches `text`, not just `value`
Because the regex is tested against both fields, a `<strong>` inside `text` is part of the searchable string. Keep `value` and `text` aligned if you rely on prefix matching.
:::

::: warning `container` is only in the document while focused
Blur calls `$ul.remove()`, so after dismissal `component.container.isConnected` is `false`. The element object itself is stable, so resolving it at use time is fine — do not cache anything derived from its children across focus cycles.
:::

::: info Only 100 rows render at a time
The `LIMIT` constant is `100`; further pages are appended on scroll. The source comment saying "first 500" is stale.
:::

## See also

- [Palette](../editor-components/palette.md) — the same widget wrapped in a search overlay, with a promise-free `palette(...)` entry point.
- [`acode.require()`](../global-apis/acode.md) — how modules are resolved.
