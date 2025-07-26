# EditorManager

## `window.editorManager` or `editorManager`

The `editorManager` allows to interact with the Editor Instance and listen to various events of Acode app with the help of various methods and Properties. Basically for interacting with the opened files and tabs.

## Methods and Properties

### `editor`  
This is an instance of the Ace editor. Check out editor methods [here](https://ajaxorg.github.io/ace-api-docs/classes/ace.Editor-1.html)

- `addCommand(args: string | object)` This method allows you add a command to command palette of Acode app. You can use it like:
```javascript
 editorManager.editor.commands.addCommand("command name or command object")
 ```

- `removeCommand(args: string | object)` This method allows you remove a command to command palette of Acode app. You can use it like:
``` javascript
editorManager.editor.commands.removeCommand("command name or command object")
 ```
### `addNewFile(filename?:string, options?: object)` 
This function adds a new file to the workspace.

  - `filename: string`: the name of the file.
  - `options?: object`: an optional object that can be passed with the following properties:
    - `text: string`: the file text content.
    - `isUnsaved: boolean`: whether the file is unsaved.
    - `render: boolean`: whether to switch to this file.
    - `id: string`: a unique id for the file.
    - `uri: string`: the file's uri, or location.
    - `record`: Record
    - `deletedFile: boolean`: whether the file is deleted.
    - `readOnly: boolean`: whether the file is read-only
    - `mode: string`: the SAF (Storage access framework) mode (TREE | SINGLE).
    - `type: string`: the file type (regular | git | gist).
    - `encoding: string`: the file encoding.
    - `onsave: ()=>void`: callback function called when the file is saved.

### `getFile(test: any, type: string)` 
This function gets files from the list of opened files.
  * `test: object`: the file id, uri, repo, or gist to find the file.
  * `type: string`: the type of test (uri | id | name | git | gist).

### `switchFile(id: string)` 
This function switches the tab to the given file id.

### `activeFile: object` 
This property returns the current file data as object.

### `hasUnsavedFiles(): number` 
This function returns the number of unsaved files.

### `files: Array<object>` 
This property returns a list of all files.

### `setSubText(file: File)` 
This function sets the sub text of the header, i.e. the location of the file.

### `container: HTMLElement` 
This property returns the container of the editor.

### `on(event: string, listener(): void)` 
This function adds a listener for the specified event.

### `off(event: string, listener(): void)` 
This function removes a listener for the specified event.

### `emit(event: string, ...args: ...any)` 
This function emits an event with the specified arguments.

### `isScrolling: boolean` 
Weather the editor is currently scrolling.

## List of events:

* `switch-file`
* `rename-file`
* `save-file`
* `file-loaded`
* `file-content-changed`
* `add-folder`
* `remove-folder`
* `new-file`
* `init-open-file-list`
* `update`

Here is an example on how to listen to an example event:
```javascript
function listener(){
  console.log("user has switched a file")
}

editorManager.on("switch-file", listener) // listens to file switch event
```
