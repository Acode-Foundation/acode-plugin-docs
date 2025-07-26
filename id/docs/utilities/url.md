# Url

The `Url` module provides various utility functions for working with URLs. This module is essential for parsing, manipulating, and formatting URLs within plugins. Below, you will find detailed information on the methods available in this module.

## Usage

To use the `Url` module, import it at the top of your plugin main file:

```javascript
const Url = acode.require('Url');
```

## Methods

### `basename(url: string): string | null`
Returns the basename of the last segment of the URL path, or null if the input is invalid.

**Example:**
```javascript
const basename = Url.basename('ftp://localhost/foo/bar/index.html');
// Output: 'index.html'
```

### `areSame(...urls: string[]): boolean`
Compares multiple URL strings and returns true if they are all the same, false otherwise.

**Example:**
```javascript
const areSame = Url.areSame('https://example.com', 'https://example.com');
// Output: true
```

### `extname(url: string): string | null`
Returns the file extension of the last segment of the URL path, or null if the input is invalid.

**Example:**
```javascript
const extname = Url.extname('ftp://localhost/foo/bar/index.html');
// Output: '.html'
```

### `join(...pathNames: string[]): string`
Joins multiple path strings into a single URL string.

**Example:**
```javascript
const joinedUrl = Url.join('https://example.com', '/foo', '/bar');
// Output: 'https://example.com/foo/bar'
```

### `safe(url: string): string`
Returns a URL-safe string by encoding each component of the URL.

**Example:**
```javascript
const safeUrl = Url.safe('https://www.example.com/path/to/file.html?query=string#hash');
// Output: 'https://www.example.com/path/to/file.html%3Fquery%3Dstring%23hash'
```

### `pathname(url: string): string | null`
Returns the path of the URL, or null if the input is invalid.

**Example:**
```javascript
const pathname = Url.pathname('ftp://myhost.com/foo/bar/index.html');
// Output: '/foo/bar'
```

### `dirname(url: string): string | null`
Returns the directory name from the URL, or null if the input is invalid.

**Example:**
```javascript
const dirname = Url.dirname('ftp://localhost/foo/bar');
// Output: 'ftp://localhost/foo/'
```

### `parse(url: string): URLObject`
Parses the given URL and returns an object containing the URL and query string.

**Example:**
```javascript
const parsedUrl = Url.parse('https://example.com/path?query=string');
// Output: { url: 'https://example.com/path', query: '?query=string' }
```

### `formate(urlObj: URLObject): string`
Formats a URL object into a string.

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
Returns the protocol of a URL.

**Example:**
```javascript
const protocol = Url.getProtocol('ftp://localhost/foo/bar');
// Output: 'ftp:'
```

### `hidePassword(url: string): string`
Returns a URL string with the password (if present) replaced with asterisks.

**Example:**
```javascript
const hiddenPasswordUrl = Url.hidePassword('ftp://user:password@localhost/foo/bar');
// Output: 'ftp://user@localhost/foo/bar'
```

### `decodeUrl(url: string): URLObject`
Decodes the URL and returns an object containing username, password, hostname, pathname, port, and query.

**Example:**
```javascript
const decodedUrl = Url.decodeUrl('https://user:pass@host.com:8080/path?query=string');
// Output: { username: 'user', password: 'pass', hostname: 'host.com', pathname: '/path', port: 8080, query: { query: 'string' } }
```

### `trimSlash(url: string): string`
Removes the trailing slash from a URL.

**Example:**
```javascript
const trimmedUrl = Url.trimSlash('https://example.com/path/');
// Output: 'https://example.com/path'
```
