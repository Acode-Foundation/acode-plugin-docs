# Added Folder

## `window.addedFolder` or `addedFolder`

The `addedFolder` object is the global object which returns an Array of object. This object provides essential properties and methods to interact with the currently opened folders in the **sidenav** of Acode app. Use these properties and methods to manipulate folder states, reload contents, and manage folder visibility effectively.

### Properties

* `url: string` The URL of the folder.
* `remove: ()=>void` Removes the folder from the sidenav.
* `$node: HTMLElement` The HTML element of the folder.
* `reload: ()=>void` Reloads the folder.
* `listState: Map<dir:string, open:boolean>` The state of the folders in the folder.
* `reloadOnResume: boolean` Whether to reload the folder when the app resumes.
* `saveState: boolean` Whether to save the state of the folder when the app is closed.
* `title: string` The title of the folder.
* `id: string` The ID of the folder.