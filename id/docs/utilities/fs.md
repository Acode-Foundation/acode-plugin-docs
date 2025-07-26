# File System(fs)

The `fs` module provides a simplified API for interacting with the file system in Acode, primarily for basic file and directory operations. This does not support symbolic links (`symlink`), reflecting limitations typical on these platforms.

### Importing the Module

The `fs` module can be imported using either of the following methods:

```javascript
// Importing via requiring 'fs'
const fs = acode.require('fs');

// Importing via requiring 'fsOperation'
const fs = acode.require('fsOperation');
```

### Creating a File System Object

To perform file operations, you first need to create a file system object by providing a URL (path) to the file or directory:

```javascript
/**
 * Create a file system object from a URL
 * @param {...string} url URL of the file or directory
 * @returns {FileSystem} File system object
 */
const filesystem = await fs(url);
```

## File System Methods

Once you have a `FileSystem` object, you can use the following methods:

### `lsDir()`

Returns a list of entries (files and directories) within the specified directory.

```javascript
/**
 * List contents of the directory
 * @returns {Promise<Array<Entry>>} Array of entries in the directory
 */
const allFiles = await filesystem.lsDir();
```

### `readFile(encoding?)`

Reads the contents of a file. Optionally accepts an encoding parameter (`encoding`) for text files.

```javascript
/**
 * Read contents of a file
 * @param {string} [encoding] Encoding for text files
 * @returns {Promise<string | ArrayBuffer>} File content
 */
const fileContent = await filesystem.readFile();
```

### `writeFile(content)`

Writes data to a file.

```javascript
/**
 * Write data to a file
 * @param {string | ArrayBuffer} content Content to write
 * @returns {Promise<void>} Promise indicating completion
 */
await filesystem.writeFile('content to write');
```

### `createFile(name, content)`

Creates a new file with the specified name and content. If a file with the same name exists, it will be overwritten.

```javascript
/**
 * Create a new file
 * @param {string} name Name of the new file
 * @param {string} content Content for the new file
 * @returns {Promise<string>} URL of the created file
 */
const createdFile = await filesystem.createFile('filename.js', 'file content');
```

### `createDirectory(name)`

Creates a new directory with the specified name.

```javascript
/**
 * Create a new directory
 * @param {string} name Name of the new directory
 * @returns {Promise<string>} URL of the created directory
 */
const createdDirectory = await filesystem.createDirectory('newDirectory');
```

### `delete()`

Deletes the file or directory specified by the URL.

```javascript
/**
 * Delete a file or directory
 * @returns {Promise<void>} Promise indicating completion
 */
await filesystem.delete();
```

### `copyTo(destination)`

Copies the file or directory to the specified destination.

```javascript
/**
 * Copy file or directory to a destination
 * @param {string} destination Destination URL
 * @returns {Promise<string>} URL of the copied file or directory
 */
const copiedItem = await filesystem.copyTo('destination');
```

### `moveTo(destination)`

Moves the file or directory to the specified destination.

```javascript
/**
 * Move file or directory to a destination
 * @param {string} destination Destination URL
 * @returns {Promise<string>} URL of the moved file or directory
 */
const movedItem = await filesystem.moveTo('destination');
```

### `renameTo(newName)`

Renames the file or directory to the specified new name.

```javascript
/**
 * Rename file or directory
 * @param {string} newName New name
 * @returns {Promise<string>} URL of the renamed file or directory
 */
const renamedItem = await filesystem.renameTo('newName');
```

### `exists()`

Checks if the specified file or directory exists.

```javascript
/**
 * Check if file or directory exists
 * @returns {Promise<boolean>} Indicates if the file or directory exists
 */
const doesExist = await filesystem.exists();
```

### `stat()`

Retrieves information about the file or directory.

```javascript
/**
 * Get information about a file or directory
 * @returns {Promise<Stat>} File or directory information
 */
const fileStats = await filesystem.stat();
```

## Type Definitions

### `Stat` Object

```javascript
/**
 * @typedef {Object} Stat
 * @property {string} name Name of the file or directory
 * @property {string} url URL of the file or directory
 * @property {boolean} isFile Indicates if it's a file
 * @property {boolean} isDirectory Indicates if it's a directory
 * @property {boolean} isLink Indicates if it's a symbolic link (unsupported, always false)
 * @property {number} size Size of the file in bytes
 * @property {number} modifiedDate Last modified date timestamp
 * @property {boolean} canRead Indicates if the file or directory can be read
 * @property {boolean} canWrite Indicates if the file or directory can be written to
 */
```

### `FileSystem` Object

```javascript
/**
 * @typedef {Object} FileSystem
 * @property {() => Promise<Array<Entry>>} lsDir List directory
 * @property {() => Promise<void>} delete Delete file or directory
 * @property {() => Promise<boolean>} exists Check if file or directory exists
 * @property {() => Promise<Stat>} stat Get file or directory stat
 * @property {(encoding?: string) => Promise<string | ArrayBuffer>} readFile Read file
 * @property {(content: string | ArrayBuffer) => Promise<void>} writeFile Write file content
 * @property {(name: string, content: string) => Promise<string>} createFile Create file and return URL of the created file
 * @property {(name: string) => Promise<string>} createDirectory Create directory and return URL of the created directory
 * @property {(destination: string) => Promise<string>} copyTo Copy file or directory to destination
 * @property {(destination: string) => Promise<string>} moveTo Move file or directory to destination
 * @property {(newName: string) => Promise<string>} renameTo Rename file or directory
 */
```

### Notes

- This `fs` module is designed for basic file system operations and does not support symbolic links (`isLink` is always false).
- Care should be taken while using methods like `delete()`, as they permanently remove files or directories.
- Each method returns a Promise, allowing for asynchronous file system operations.
