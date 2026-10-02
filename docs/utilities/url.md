# Url

The `Url` module provides various utility functions for working with URLs. This module is essential for parsing, manipulating, and formatting URLs within plugins. Below, you will find detailed information on the methods available in this module.

::: info
Verified against Acode **v1.13.5**: `src/utils/Url.js` (registered in `src/lib/acode.js` as `this.define("Url", Url)`).
:::

## Usage

To use the `Url` module, import it at the top of your plugin main file:

```javascript
const Url = acode.require('Url');
```

`acode.require` lowercases module names, so `acode.require('url')` returns the identical object.

::: warning
**`Url` is a plain object literal — it does not extend or patch the browser `URL`.** `src/utils/Url.js:5` is `export default { … }`; nothing in the source assigns to `window.URL`, `globalThis.URL` or `URL.prototype`. Use `Url` for Acode URLs (`file://`, `content://`, `ftp://`, `sftp://`) and the native `URL` for ordinary web URLs. Two of the methods (`hidePassword`, `decodeUrl`) are backed by the [`url-parse`](https://www.npmjs.com/package/url-parse) npm package, not by the platform.
:::

There is also a method shortcut on the global object:

```javascript
acode.joinUrl(...args); // identical to Url.join(...args) — src/lib/acode.js:928
```

### The complete member list

There are **14 methods** and one exported property. There is no `resolve()`, no `filename()`, and no `encode` / `decode` — use [`acode.require("encodings")`](./encoding.md) for text codecs.

| Member | Signature | Returns |
|---|---|---|
| `basename` | `basename(url: string): string \| null` | Last path segment |
| `areSame` | `areSame(...urls: string[]): boolean` | `true` if all equal |
| `isSameOrDescendant` | `isSameOrDescendant(candidate: string, parent: string): boolean` | Nesting test |
| `extname` | `extname(url: string): string \| null` | Extension incl. dot |
| `join` | `join(...pathnames: string[]): string` | Joined URL |
| `safe` | `safe(url: string): string` | Percent-encoded URL |
| `pathname` | `pathname(url: string): string \| null` | Path, leading `/` |
| `dirname` | `dirname(url: string): string \| null` | Parent URL |
| `parse` | `parse(url: string): { url: string, query: string }` | Split tuple |
| `formate` | `formate(urlObj: object): string` | Formatted URL |
| `getProtocol` | `getProtocol(url: string): string` | `"ftp:"`, `"https:"`, … or `""` |
| `hidePassword` | `hidePassword(url: string): string` | URL without password |
| `decodeUrl` | `decodeUrl(url: string): object` | Decoded components |
| `trimSlash` | `trimSlash(url: string): string` | See the warning below |
| `PROTOCOL_PATTERN` | `RegExp` | `/^[a-z]+:\/\/\/?/i` |

::: warning
`formate` is spelled without an `u` in the source (`src/utils/Url.js:242`). That is the real name — there is no `format` alias.
:::

## Methods

### `basename(url: string): string | null`
Returns the basename of the last segment of the URL path, or null if the input is invalid. For `content://` URIs the document id is unwrapped first (`Uri.parse`), and a single-document URI resolves to its tree root.

**Example:**
```javascript
const basename = Url.basename('ftp://localhost/foo/bar/index.html');
// Output: 'index.html'
```

### `areSame(...urls: string[]): boolean`
Compares multiple URL strings and returns true if they are all the same, false otherwise. A single trailing `/` is stripped from every argument before comparison — the **query string is not** stripped, so `'a?x=1'` and `'a?x=2'` are different.

**Example:**
```javascript
const areSame = Url.areSame('https://example.com', 'https://example.com');
// Output: true
```

### `isSameOrDescendant(candidate: string, parent: string): boolean`
Checks whether `candidate` is `parent` itself or nested below it. Both arguments are run through `parse()` (so their query strings are dropped) and one trailing `/` is stripped, then the comparison is `candidate === parent || candidate.startsWith(parent + '/')`. Because of the explicit `/` boundary check, `/a/foobar` is **not** a descendant of `/a/foo`. Acode uses this in `src/lib/recents.js:58` to decide whether closing a folder should also drop its children.

**Example:**
```javascript
Url.isSameOrDescendant('sftp://host/var/www/index.php', 'sftp://host/var/www');
// Output: true

Url.isSameOrDescendant('sftp://host/var/wwwroot', 'sftp://host/var/www');
// Output: false
```

### `extname(url: string): string | null`
Returns the file extension of the last segment of the URL path, or null if the input is invalid. Delegates to `path.extname` (`src/utils/Path.js:45`), which returns `""` when the basename has no dot and includes the leading dot otherwise.

**Example:**
```javascript
const extname = Url.extname('ftp://localhost/foo/bar/index.html');
// Output: '.html'
```

### `join(...pathnames: string[]): string`
Joins multiple path strings into a single URL string.

**Example:**
```javascript
const joinedUrl = Url.join('https://example.com', '/foo', '/bar');
// Output: 'https://example.com/foo/bar'
```

#### The real rules — read this before shipping `join()`

`join` is the single most misused function in this module. It has **four** footguns, all visible in `src/utils/Url.js:84-134`:

**1. It throws with fewer than two arguments.**

```javascript
Url.join('file:///a/b'); // throws Error('Join(), requires at least two parameters')
```

**2. A trailing slash on a `http:`/`https:`/`ftp:`/`sftp:` base produces a broken URL.**

The scheme is matched with `PROTOCOL_PATTERN` (`/^[a-z]+:\/\/\/?/i`, `Url.js:354`), stripped off the front, and the **remainder is joined verbatim** (`Url.js:128-130`). For `http(s)://` and `ftp(s)://` there is no third slash to absorb, so a trailing slash on the base leaves a stray `/` in front of the host:

```javascript
Url.join('https://example.com/', 'b');   // Output: 'https:///example.com/b'  ← malformed
Url.join('https://example.com', 'b');    // Output: 'https://example.com/b'   ← correct
```

`file:///` and `content://` are safe with a trailing slash, because their pattern match consumes the third slash:

```javascript
Url.join('file:///storage/emulated/0/', 'a.txt');
// Output: 'file:///storage/emulated/0/a.txt'  ← correct
```

::: danger
Rule of thumb: for `http`/`https`/`ftp`/`sftp`, never let the base end in `/`. Strip it yourself before joining — `base.replace(/\/+$/, '')`.
:::

**3. Leading and trailing slashes on the *later* arguments are harmless.**

Every branch finishes with `path.join(...).normalize()` (`src/utils/Path.js:85-112`), and `normalize` collapses `/+` to `/` before resolving `.` and `..`:

```javascript
Url.join('file:///a/b', '/c');     // 'file:///a/b/c'
Url.join('file:///a/b/', '/c/');   // 'file:///a/b/c'
Url.join('file:///a/b//', '//c');  // 'file:///a/b/c'
```

**4. `..` escapes the base, and the query is re-appended at the very end.**

`normalize()` resolves `..` by popping the previous segment, and only the **first** argument's query is split off by `parse()` and appended after everything else:

```javascript
Url.join('file:///a/b/c.txt', '../d.txt');  // 'file:///a/d.txt'  ← climbs out of b/
Url.join('https://example.com?a=1', 'b');   // 'https://example.com/b?a=1'
```

Never let user input supply `..` segments to `join()`.

#### `content://` gets its own branch

When the scheme is `content://`, `join` parses the URI with `Uri.parse` and rebuilds the `rootUri::docId` pair instead of using plain path joining (`Url.js:92-126`). There is a special case for `content://com.termux...` (`Url.js:98-107`), a volume-only docId (`:primary:`) case (`Url.js:111-122`), and the whole block is wrapped in a `try`/`catch` that **returns `null`** on a malformed URI (`Url.js:124-126`).

### `safe(url: string): string`
Returns a URL-safe string by encoding each component of the URL. Every path segment after the first is run through a stricter `encodeURIComponent` that also escapes `!'()*` (`Url.js:151-155`).

**Example:**
```javascript
const safeUrl = Url.safe('https://www.example.com/path/to/file.html?query=string#hash');
// Output: 'https://www.example.com/path/to/file.html?query=string#hash'
```

::: warning
The **query string and fragment are preserved verbatim** — `parse()` splits them off before encoding and they are concatenated back on untouched (`Url.js:141-149`). So a `#` in the query survives as-is. This is the *opposite* of what older versions of this page claimed.
:::

Acode calls `Url.safe` on every `window.resolveLocalFileSystemURL` invocation (`src/main.js:300-302`), which is why percent-encoded spaces round-trip correctly through `acode.toInternalUrl()`.

### `pathname(url: string): string | null`
Returns the path of the URL, or null if the input is invalid. The query string is discarded first (`url.split("?")[0]`), then the scheme and the host are removed and the result is re-prefixed with `/`. For `content://` URIs it returns the docId path instead (`Url.js:168-175`).

**Example:**
```javascript
const pathname = Url.pathname('ftp://myhost.com/foo/bar/index.html');
// Output: '/foo/bar/index.html'
```

::: warning
`pathname` returns the **whole** path including the filename — it is not the directory. Use `dirname` for that.
:::

If the input is not a string, or does not match `PROTOCOL_PATTERN`, `pathname` returns the input **unchanged** rather than throwing (`Url.js:163`).

### `dirname(url: string): string | null`
Returns the directory name from the URL, or null if the input is invalid. The query string is re-appended (`Url.js:213`), and a non-string input throws `Error('URL must be string')` (`Url.js:192`).

**Example:**
```javascript
const dirname = Url.dirname('ftp://localhost/foo/bar');
// Output: 'ftp://localhost/foo/'
```

### `parse(url: string): URLObject`
Parses the given URL and returns an object containing the URL and query string. The split happens at the **first** `?`, so a `#fragment` stays inside the query.

**Example:**
```javascript
const parsedUrl = Url.parse('https://example.com/path?query=string');
// Output: { url: 'https://example.com/path', query: '?query=string' }
```

### `formate(urlObj: URLObject): string`
Formats a URL object into a string. Requires `protocol` and `hostname` or it throws `Error("Cannot formate url. Missing 'protocol' and 'hostname'.")`. `username`+`password` are `encodeURIComponent`-encoded together; a lone `username` is not. A missing leading `/` on `path` is added. Query keys and values are encoded, and the trailing `&` is trimmed.

**Example:**
```javascript
const urlObj = {
  protocol: 'https:',
  hostname: 'example.com',
  path: 'path/to/page',
  query: { key: 'value' }
};
const formattedUrl = Url.formate(urlObj);
// Output: 'https://example.com/path/to/page?key=value'
```

### `getProtocol(url: string): "ftp:" | "sftp:" | "http:" | "https:"`
Returns the protocol of a URL, or `""` when there is none.

**Example:**
```javascript
const protocol = Url.getProtocol('ftp://localhost/foo/bar');
// Output: 'ftp:'
```

::: warning
`getProtocol` returns the scheme **with a colon only** (`ftp:`), because it uses `/^([a-z]+:)\/\/\/?/i` (`Url.js:281`). `PROTOCOL_PATTERN` — used internally by `join`, `safe` and `pathname` — returns the scheme **with slashes** (`ftp://`). Do not compare the two.
:::

### `hidePassword(url: string): string`
Returns a URL string with the password **removed**.

**Example:**
```javascript
const hiddenPasswordUrl = Url.hidePassword('ftp://user:password@localhost/foo/bar');
// Output: 'ftp://user@localhost/foo/bar'
```

::: warning
Earlier versions of this page said the password is "replaced with asterisks". It is not — the password is dropped entirely and only `protocol`, `username`, `hostname` and `pathname` are rebuilt (`Url.js:288-295`). `file:` URLs are returned untouched, and the **port and query are lost** on every other scheme because they are not part of the template.
:::

### `decodeUrl(url: string): URLObject`
Decodes the URL and returns an object containing username, password, hostname, pathname, port, and query. `pathname`, `username`, `password` and the `keyFile` / `passPhrase` query values are `decodeURIComponent`-ed, and `port` is coerced to an `int`. `#` characters are temporarily replaced with a unique sentinel before parsing and restored afterwards, so encoded fragments survive.

**Example:**
```javascript
const decodedUrl = Url.decodeUrl('https://user:pass@host.com:8080/path?query=string');
// Output: { username: 'user', password: 'pass', hostname: 'host.com', pathname: '/path', port: 8080, query: { query: 'string' } }
```

### `trimSlash(url: string): string`
Attempts to remove the trailing slash from a URL.

**Example:**
```javascript
Url.trimSlash('https://example.com/path/');
// Output: 'https://example.com/path/'  ← the slash is still there
```

::: danger
**`trimSlash` does not remove the trailing slash in v1.13.5.** It strips the `/` from `parse(url).url`, then immediately re-adds a separator by routing through `join(parsed.url, parsed.query)` — and `path.join(x, "")` always produces `x + "/"` (`src/utils/Url.js:347-353` combined with `src/utils/Path.js:85-112`). A base with a query string behaves the same way (`'https://example.com/path/?a=1'` → `'https://example.com/path/?a=1'`).

Do your own trimming:

```javascript
const trimSlash = (url) => url.replace(/\/+$/, '');
```

`Url.dirname` and `Url.areSame` — unlike `trimSlash` — do handle trailing slashes correctly.
:::

### `PROTOCOL_PATTERN`
The exported regex every scheme test is built on (`Url.js:354`):

```javascript
Url.PROTOCOL_PATTERN; // /^[a-z]+:\/\/\/?/i
```

It matches `scheme://` plus **one optional extra slash**, which is why `file:///…` yields `file:///` while `https://…` yields `https://`. It carries no `g` flag, so `.test()` and `.exec()` are safe to call repeatedly.

## Supported URL schemes

Provable from the source:

| Scheme | Handled where | Notes |
|---|---|---|
| `file:` | `src/fileSystem/index.js:94` (`internalFs.test`, `/^file:/`) | App-internal storage and `/sdcard` |
| `content:` | `src/fileSystem/index.js:95` (`externalFs.test`, `/^content:/`) | Android SAF documents; needs `content://<pkg>.documents/tree|document…`. `Uri.parse` (`src/utils/Uri.js:26-67`) **throws** `Error('Invalid uri format.')` for anything else |
| `ftp:` | `src/fileSystem/index.js:93` (`Ftp.test`, `/^ftp:/`) | |
| `sftp:` | `src/fileSystem/index.js:92` (`Sftp.test`, `/^sftp:/`) | Requires a native SFTP profile |
| `http:` / `https:` | `src/fileSystem/index.js:97-99` (`/^https?:/`) | Only `readFile` and `writeFile` exist on the returned handle |
| anything else | — | `fsOperation()` returns `undefined`; `Url`'s string methods still work on the string |

## `acode.joinUrl(...)` and `acode.toInternalUrl(url)`

### `acode.joinUrl(...args)`
A one-line alias, `return Url.join(...args)` (`src/lib/acode.js:928-930`). Identical signature, identical throw on fewer than two arguments, identical trailing-slash footgun. `acode.require("Url").join` and `acode.joinUrl` are interchangeable.

### `acode.toInternalUrl(url)`

```javascript
const internal = await acode.toInternalUrl('file:///storage/emulated/0/My File.txt');
// → 'file:///storage/emulated/0/My%20File.txt'
```

Resolves to `helpers.toInternalUri` (`src/lib/acode.js:992-995`), which calls `window.resolveLocalFileSystemURL(uri, success, error)` and resolves with `entry.toInternalURL()` (`src/utils/helpers.js:279-289`). It rejects with the raw Cordova error.

Two details:

- Acode **replaces** `window.resolveLocalFileSystemURL` at boot with a wrapper that first calls `Url.safe(url)` (`src/main.js:300-302`), so path segments are percent-encoded for you.
- The same function is registered as a module: `acode.require("toInternalUrl")` (`src/lib/acode.js:456`).

## Complete Example

```javascript
acode.setPluginInit('com.example.url-demo', (baseUrl, $page, { cacheFile }) => {
		const Url = acode.require('Url');

		// 1. Build URLs. Never let an http(s)/ftp/sftp base end in "/".
		const remote = 'sftp://host/var/www';
		const index = acode.joinUrl(remote, 'app', 'index.html');
		// 'sftp://host/var/www/app/index.html'

		// 2. Split without a second parse.
		const { url, query } = Url.parse('https://example.com/search?q=acode&page=2');
		// url = 'https://example.com/search', query = '?q=acode&page=2'

		// 3. Decompose safely — basename/pathname never throw on strings.
		const name = Url.basename(url);            // 'search'
		const dir = Url.dirname(url);              // 'https://example.com/'
		const ext = Url.extname(index);            // '.html'
		const proto = Url.getProtocol(url);        // 'https:'

		// 4. Nesting test with correct segment boundaries.
		const inside = Url.isSameOrDescendant(index, remote); // true

		// 5. Build a remote file for an fs write.
		const target = Url.join('file:///storage/emulated/0/Documents', 'notes.md');
		// 'file:///storage/emulated/0/Documents/notes.md'

		// 6. Never log a password.
		console.log(Url.hidePassword('sftp://user:secret@host/var/www'));

		// 7. Let the native layer hand back the canonical, encoded URL.
		acode.toInternalUrl(target).then((internalUrl) => {
				console.log('internal:', internalUrl);
		}).catch((error) => {
				acode.require('toast')(String(error));
		});
});
```

## See also

- [`acode.require("fs")`](./fs.md) — the file-system factory that consumes these URLs.
- [`acode.require("encodings")`](./encoding.md)
