# Palette

The Palette component provides an interactive search interface with dynamic suggestions for your Acode plugin. It creates a searchable input field with a dropdown list of options that updates as the user types. This is what used in command palettes, find files etc.

## Importing

```js
const palette = acode.require('palette');
```

## Usage

The palette function accepts up to five parameters:

```js
palette(getList, onSelect, placeholder, onRemove, options);
```

### Signature <Badge type="tip" text="new" />

```js
palette(
  getList: (hintModification, query: string) => Hint[] | Promise<Hint[]>,
  onSelect: (value: string) => void,
  placeholder?: string,
  onRemove?: () => void,
  options?: { dynamic?: boolean },
) => void
```

### Parameters

- `getList` : `(hintModification, query) => Array<Hint> | Promise<Array<Hint>>` - Function that returns an array of options or a Promise resolving to options.
- `onSelect` : `(value: string) => void` - Callback executed when the user selects an option. It receives the selected hint's **`value` string**, not its index and not the hint object.
- `placeholder?` : `string` - Text to display in the input field when empty.
- `onRemove?` : `() => void` - Callback triggered when the palette is closed/removed.
- `options?` : `{ dynamic?: boolean }` - When `dynamic` is `true`, `getList` is re-invoked (debounced ~120 ms) on every keystroke. When it is omitted or `false`, `getList` is called **once** and the palette filters that list in memory.

::: warning `getList`'s arguments are usually in the opposite order
The palette builds its hints through `generateHints(setHints, hintModification, query)` and then calls `getList(hintModification, query)`. **The `HintModification` object comes first, the query string second** — not the other way round. The JSDoc on the component still says `(hints) => string[]`, which is stale.
:::

## Hint item shape <Badge type="tip" text="new" />

Each entry of the array returned by `getList` is either a plain string, or an object:

| Field | Type | Description |
| --- | --- | --- |
| `value` | `string` | The string handed to `onSelect`. Rendered as the row's `value` attribute |
| `text` | `string` | **HTML** shown in the list row. It is passed through `DOMPurify.sanitize()`, so simple markup is allowed and scripts are stripped. Also what fills the input field on click |
| `active` | `boolean` | Start with this row highlighted |

Passing a bare string is shorthand for `{value: str, text: str}` — and because `text` is rendered as HTML you must escape user-controlled strings yourself.

```js
// strings
['src/components/header.js', 'package.json'];

// objects
[
  { value: 'file:///sdcard/a.js', text: '<strong>a.js</strong>' },
  { value: 'file:///sdcard/b.js', text: '<strong>b.js</strong>', active: true },
];
```

::: tip Filtering happens on `value` **and** `text`
In non-dynamic mode the palette builds a case-insensitive regex from the input and keeps every hint whose `value` **or** `text` matches. `text` contains markup, so a `<strong>` inside it can affect matching.
:::

## Example

Here's a example showing how to create a file search palette:

```js
const palette = acode.require('palette');

// Generate list of files
function getFileList() {
		return [
				'src/components/header.js',
				'src/pages/home.js',
				'src/utils/helpers.js',
				'package.json',
				'README.md'
		];
}

// Handle file selection
function handleFileSelect(filePath) {
		console.log(`Opening file: ${filePath}`);
		// Add logic to open the selected file
}

// Create the palette
palette(
		getFileList,
		handleFileSelect,
		'Search files...'
);
```

## Dynamic (async) palette <Badge type="tip" text="new" />

Use `dynamic: true` and return a Promise to query on every keystroke. The second argument is the current query string:

```js
const palette = acode.require('palette');
const fileIndex = acode.require('fileIndex');

palette(
  async (hintModification, query) => {
    if (!query) return [];
    try {
      const { entries = [] } = await fileIndex.query({ text: query, limit: 100 });
      return entries.map((file) => ({
        value: file.url,
        text: `<strong>${file.name}</strong><br><small>${file.path}</small>`,
      }));
    } catch (error) {
      return [];
    }
  },
  (url) => {
    console.log('selected', url);
  },
  'Go to file…',
  () => console.log('palette closed'),
  { dynamic: true },
);
```

`hintModification` lets you patch the list in place while a request is in flight:

| Method | Description |
| --- | --- |
| `add(item, index?)` | Insert a hint (at `index`, or append) and update the DOM |
| `remove(item)` | Remove a hint by reference |
| `removeIndex(index)` | Remove a hint by position |

::: warning Escape user content in `text`
`text` is rendered as HTML after `DOMPurify.sanitize()`. Sanitisation is applied, but a filename containing `<b>` will still render as bold. Escape with a helper before interpolating.
:::

The palette will automatically handle:
- Keyboard navigation (arrow keys, wrapping at both ends)
- Search filtering
- Selection via enter/click
- Closing via escape key, tapping the dimmed mask, blurring the input, or the hardware back button
- Proper cleanup on remove

## Gotchas <Badge type="tip" text="new" />

::: warning
- **It is not promise-based and returns nothing.** `palette(...)` returns `undefined`. There is no "resolved when dismissed" value to await — use `onRemove` if you need a close hook.
- **`onSelect` receives `value`, not the index.** The selected row's `value` attribute is read from the DOM and passed through. If that attribute is empty, a click only closes the dropdown list (`onblur()`); the palette itself stays open.
- **On click the input is filled with the row's `text`, not its `value`.** Pressing Enter does not rewrite the input at all. If you display markup in `text`, that markup lands in the search field.
- **Pressing Enter with no highlighted row does nothing.** `handleKeypress` returns early when there is no `.active` element.
- **`onRemove` suppresses the editor refocus.** When `onRemove` is provided, `remove()` returns early and never calls `focusEditorIfEditable()`. Provide `onRemove` only if you take over focus yourself.
- **Only the first 100 hints are rendered at once.** Further pages are appended when the list is scrolled to the bottom. The comment in the source says "first 500", but the actual `LIMIT` constant is `100`.
- **`remove()` is single-shot.** After the first removal it is replaced by a function that logs `Palette already removed.` at warn level, so a double back-press will not throw but will log.
- **The action-stack id is the literal `"palette"`.** Only one palette can be on the back stack at a time; a nested palette overwrites the previous entry.
- **A palette opened from another palette chains.** The previous palette is restored when the child closes, and the dimmed overlay is skipped for the child. If your `onSelect` callback opens a new palette, the current one is deliberately **not** removed.
:::

::: tip Lower-level control
`acode.require('inputhints')` exposes the same list widget without the overlay. It takes an input element plus either a static hint array or a hint callback, and returns `{getSelected, container}`. Note that `getSelected()` is a no-op in this build — it does not return the active row — so read the `active` class off `container` yourself if you need it.
:::