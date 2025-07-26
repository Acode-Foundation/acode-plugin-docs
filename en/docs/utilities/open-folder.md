# OpenFolder

The OpenFolder utility allow to open and manage folders within the side bar of the application. This utility provides various functionalities for handling folder operations, such as opening, removing, reloading, and maintaining state.

## Usage
To use the `OpenFolder` utility, you need to require it using the Acode's module system and call the `openFolder` function with the appropriate parameters.


## Importing the OpenFolder

To use the OpenFolder, it needs to be imported into plugin as shown below:

```javascript
const openFolder = acode.require('openFolder');
```

### Parameters
The `openFolder` function accepts two parameters:
1. `_path` (string): The path of the folder to be opened. This is a `required` parameter.
2. `opts` (object): An optional object containing additional options for the folder. It includes:
   - `name` (string): A name to be assigned to the folder. If not provided, the folder's name from the file system will be used.
   - `id` (string): An ID to be assigned to the folder. If not provided, an ID will be automatically generated.
   - `saveState` (boolean): Indicates whether the state of the folder should be saved when the user closes it. The default value is `true`.
   - `reloadOnResume` (boolean): Indicates whether the folder should be reloaded when the user reopens it. The default value is `true`.

### Example
```javascript:line-numbers
const openFolder = acode.require('openFolder');
const options = {
  name: 'My Documents',
  id: 'folder-1',
  saveState: false,
  reloadOnResume: false,
};
openFolder('/path/to/my/documents', options);
```
In this example, the folder at `/path/to/my/documents` will be opened in the sidebar, assigned the name "My Documents" and the ID "folder-1". The state of the folder will not be saved when closed, and it will not be reloaded when reopened.

## API

### `openFolder(_path, opts)`
Opens the specified folder in the sidebar.

**Parameters:**
- `_path` (string): Path of the folder.
- `opts` (object): Options for the folder.

**Options:**
- `name` (string): Name of the folder.
- `id` (string): ID for the folder.
- `saveState` (boolean): Save the state of the folder.
- `listFiles` (boolean): List all files recursively.
- `listState` (object): State of the listed files.

## Methods

### `remove()`
Removes the folder from the sidebar.

### `reload()`
Reloads the folder in the sidebar.

### Adding Files and Folders
You can also dynamically add files and folders to the opened folder.

**Example:**
```javascript
openFolder.add('/path/to/newFile.txt', 'file');
openFolder.add('/path/to/newFolder', 'folder');
```

### Renaming Items
To rename an existing file or folder:
```javascript
openFolder.renameItem('/path/to/oldFile.txt', '/path/to/newFile.txt', 'newFile.txt');
```

### Removing Items
To remove an existing file or folder:
```javascript
openFolder.removeItem('/path/to/fileOrFolder');
```

### Removing Folders
To remove multiple folders based on a URL pattern:
```javascript
openFolder.removeFolders('/path/to/baseFolder');
```

### Finding Folders
To find a folder containing a specific URL:
```javascript
const folder = openFolder.find('/path/to/fileOrFolder');
```

## Event Handling
The `openFolder` utility emits various events to help manage folder operations:
- `add-folder`
- `remove-folder`
- `update-folder`

These events can be listened to for performing custom actions upon folder operations.

**Example:**
```javascript
editorManager.on('add-folder', (event) => {
  console.log('Folder added:', event);
});
```
