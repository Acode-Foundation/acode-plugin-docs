# Encoding

This allow to **encode** and **decode** strings with different character sets. This is especially useful when working with **files** that require specific encodings or when handling international text.

::: info
Verified against Acode **v1.13.5** (versionCode `1011`): `src/utils/encodings.js`. This page documents the **plugin-facing surface only** — the module also exports internal helpers (`getEncoding`, `getEncodingName`, `detectEncoding`) that are *not* wired into `acode.require("encodings")`.
:::

## Importing Encodings

To use the Encoding utilities, you need to import them using the `acode.require` method:

```javascript
const encodings = acode.require('encodings');
```

`acode.require("encodings")` returns a small module object with exactly three members:

| Member | Type | Description |
| --- | --- | --- |
| `encodings` | `Object` | Getter returning the live map of charsets the device reports. Keyed by charset **name**. |
| `encode` | `(text: string, charset: string) => Promise<ArrayBuffer>` | Encodes a string. |
| `decode` | `(buffer: ArrayBuffer, charset: string) => Promise<string \| object>` | Decodes an `ArrayBuffer`. `"json"` additionally parses. |

::: warning Not exported to plugins
`getEncoding(charset)`, `getEncodingName(charset)`, `detectEncoding(buffer)` and `initEncodings()` exist in `src/utils/encodings.js` but are **not** on the module object, so `acode.require("encodings").getEncoding` is `undefined`. Reproduce the small lookup yourself when you need it:

```js
function resolveCharset(charset) {
  const wanted = String(charset || "").toLowerCase();
  for (const [name, encoding] of Object.entries(encodings.encodings)) {
    if (name.toLowerCase() === wanted) return name;
    if (encoding.aliases.some((alias) => alias.toLowerCase() === wanted)) return name;
  }
  return "UTF-8"; // same fallback the app uses
}
```
:::

## Usage

### Encoding a String

The `encode` method converts a string into an ArrayBuffer using the specified character set.

```javascript
const text = 'Hello World!';
const charset = 'utf-8';

const encoded = await encodings.encode(text, charset);
console.log(encoded);  // Output: ArrayBuffer
```

### Decoding an ArrayBuffer

The `decode` method converts an ArrayBuffer back into a string using the specified character set.

```javascript
const buffer = await encodings.encode(text, charset);
const decoded = await encodings.decode(buffer, charset);
console.log(decoded);  // Output: 'Hello World!'
```

## Methods

### `encode(text: string, charset: string): Promise<ArrayBuffer>`

Encodes a string with the specified character set. Both calls cross the Cordova bridge (`System.encode`), so it is asynchronous even though the charset lookup is not.

| Parameter | Type | Description |
| --- | --- | --- |
| `text` | `string` | The text to encode. |
| `charset` | `string` | The character set name or an alias (e.g. `"utf-8"`, `"utf8"`, `"GBK"`). Falsy values fall back to `acode.require("settings").value.defaultFileEncoding`. |

Resolves with an `ArrayBuffer` holding the encoded bytes — this is exactly the value `fs.writeFile()` accepts and `fs.readFile()` (called with no encoding) returns.

### `decode(buffer: ArrayBuffer, charset: string): Promise<string | object>`

Decodes an ArrayBuffer into a string using the specified character set.

| Parameter | Type | Description |
| --- | --- | --- |
| `buffer` | `ArrayBuffer` | The ArrayBuffer to decode. |
| `charset` | `string` | The character set name or an alias. |

- With a normal charset it resolves with a `string`.
- With `"json"` it resolves with the **parsed** value: the buffer is decoded as UTF-8 and then `JSON.parse`d. This is what `fs(url).readFile("json")` uses to load `plugin.json`.

## Properties

### `encodings: Object<string, Encoding>`

The live map of charsets reported by the device. It is populated once during startup — `src/main.js` awaits `initEncodings()` before anything else — by a native `System.get-available-encodings` call, and read back as `{ [name]: { label, aliases, name } }`: a **plain object keyed by charset name, not an array**.

```js
const all = encodings.encodings;
const names = Object.keys(all);            // canonical charset names
const first = all[names[0]];
first.name;    // e.g. "UTF-8"
first.label;   // human readable display name
first.aliases; // Array<string> of other accepted names
```

Each `Encoding` object contains:

| Key | Type | Description |
| --- | --- | --- |
| `name` | `string` | Canonical charset name. Also the key it is stored under. |
| `label` | `string` | Display name — what the Settings → Default file encoding dropdown shows. |
| `aliases` | `string[]` | Other names the platform accepts for the same charset. |

::: warning The list is device-dependent
There is no hard-coded list in the Acode source. The map is whatever `Charset.availableCharsets()` returns on the running device's JVM, so a plugin must not assume a fixed set of labels. Enumerate `Object.keys(encodings.encodings)` and feature-detect:

```js
function isSupported(charset) {
  const wanted = String(charset).toLowerCase();
  return Object.entries(encodings.encodings).some(
    ([name, encoding]) =>
      name.toLowerCase() === wanted ||
      encoding.aliases.some((alias) => alias.toLowerCase() === wanted),
  );
}
```
:::

## Charset Resolution <Badge type="tip" text="new" />

Every call resolves the charset you pass through the same three-step lookup:

1. **Falsy charset** → `acode.require("settings").value.defaultFileEncoding`, which defaults to `"UTF-8"`. (Reachable from `encode(text)` with no charset; `fs.readFile` / `fs.writeFile` skip the charset path entirely when `encoding` is falsy.)
2. **`"auto"`** → `"UTF-8"`. The auto-detecting path lives in the editor (`lib/openFile.js` calls `detectEncoding()` on the raw bytes when the setting is `"auto"`), **not** in `encode` / `decode`.
3. **Case-insensitive name-or-alias match** → the canonical `name`. The lookup lowercases both the request and every name/alias, so `"utf-8"`, `"UTF-8"` and `"utf8"` are all the same charset.

### What happens on an unknown label <Badge type="tip" text="new" />

**Nothing is thrown — the call silently uses UTF-8.**

```js
await encodings.encode("héllo", "not-a-charset"); // encoded as UTF-8
await encodings.decode(buffer, "utf16");           // decoded as UTF-8
```

The lookup returns the `"UTF-8"` entry when no name or alias matches, so the platform is always asked for a charset it supports and never reports `"Charset not supported: …"`. The practical consequence is a **silent mis-decode** of a mislabelled file rather than an exception, so validate user-supplied charsets against `encodings.encodings` first.

::: info
The native `System.encode` / `System.decode` bridge does have an error path — it rejects with `Charset not supported: <name>` if the resolved charset is unsupported on the device. You will only reach it through a broken or incomplete `encodings` map.
:::

## Example

Here is a comprehensive example demonstrating how to encode and decode text using different character sets.

```javascript
const encodings = acode.require('encodings');

async function example() {
  const text = 'Hello World!';
  const charset = 'utf-8';

  try {
    // Encoding text
    const encoded = await encodings.encode(text, charset);
    console.log('Encoded:', encoded);

    // Decoding text
    const decoded = await encodings.decode(encoded, charset);
    console.log('Decoded:', decoded);

  } catch (error) {
    console.error('Encoding/Decoding error:', error);
  }
}

example();
```

:::info
Always handle encoding and decoding within a try-catch block to manage potential errors, such as unsupported character sets.
:::

### Checking Available Encodings

You can check all the available encodings supported by Acode:

```javascript
console.log(encodings.encodings);
```

This will print an object whose keys are charset names and whose values are `Encoding` objects (`{ name, label, aliases }`), each containing details about the encoding.

## Worked Examples <Badge type="tip" text="new" />

::: code-group

```js [utf-8 round trip]
const encodings = acode.require("encodings");

const buffer = await encodings.encode("héllo 世界", "utf-8");
await encodings.decode(buffer, "utf-8"); // "héllo 世界"
```

```js [Legacy charset: GBK]
const encodings = acode.require("encodings");

// Encode Chinese text as GBK and read it back with the same label.
const buffer = await encodings.encode("Hello 世界", "gbk");
const text = await encodings.decode(buffer, "GBK"); // label case does not matter
```

```js [JSON]
const encodings = acode.require("encodings");

const buffer = await encodings.encode(JSON.stringify({ a: 1 }), "utf-8");
const obj = await encodings.decode(buffer, "json"); // { a: 1 } — parsed, not a string
```

```js [Binary, with no charset involved]
const fs = acode.require("fs");
const fileUrl = "file:///sdcard/Acode/logo.png";

// Bytes in, bytes out. Never route binary through a charset.
const bytes = await fs(fileUrl).readFile();       // ArrayBuffer
await fs(fileUrl).writeFile(bytes);               // no encoding argument
```

```js [base64 / data URL]
const fs = acode.require("fs");

const buffer = await fs("file:///sdcard/Acode/logo.png").readFile();
const bytes = new Uint8Array(buffer);
let binary = "";
for (let i = 0; i < bytes.length; i += 0x8000) {
  binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
}
const dataUrl = `data:image/png;base64,${btoa(binary)}`;
```

```js [Honour the user's default charset]
const fs = acode.require("fs");
const settings = acode.require("settings");
const fileUrl = "file:///sdcard/Acode/notes.txt";

// The app default is "UTF-8" unless the user changed it in Settings.
// Pass it explicitly: "auto" would be rewritten to "UTF-8" instead.
const charset = settings.value.defaultFileEncoding || "UTF-8";
const text = await fs(fileUrl).readFile(charset);
```

:::

## Gotchas <Badge type="tip" text="new" />

1. **`encodings` is an object, not an array.** `encodings.encodings.map(...)` is not a function — use `Object.keys(...)`. Each value has `label`, not `labels`.
2. **Unknown charsets fall back to UTF-8 silently.** There is no throw and no warning; see [Charset Resolution](#what-happens-on-an-unknown-label).
3. **`"auto"` means UTF-8 here, not "detect".** It is rewritten to `"UTF-8"` before the lookup. Real detection (`detectEncoding()`) is an internal editor step and is not exposed to plugins.
4. **Labels are case-insensitive and alias-aware**, so a charset name coming from a settings file or user input rarely needs normalising — but an unknown one still resolves to UTF-8, which is the real hazard.
5. **`decode()` returns `object`, not `string`, when the charset is `"json"`.** Type your result accordingly.
6. **The charset list is device-dependent** (it comes from the platform's available charsets), so never hard-code a list of expected names.
7. **Encoding is only applied to strings.** `encode()` takes a `string`; binary data must stay an `ArrayBuffer` and travel through [`fs`](./fs.md) instead.
8. **No BOM handling here.** The only BOM stripping in the codebase happens in the SAF provider of `fs.readFile()`; `decode()` on a BOM-prefixed buffer keeps the leading zero-width no-break space (`U+FEFF`).
