# SideBar Apps

The SideBar Apps API allows you to add mini app to the sidebar of the Acode editor. This provides a way to extend the editor's functionality with custom UI components that are easily accessible from the sidebar.

## Usage

To use the `SideBarApps` module, import it at the top of your plugin main file:

```javascript
const sideBarApps = acode.require('sidebarApps');
```

## Methods

### `add(icon: string, id: string, title: string, initFunction: (container: HTMLElement)=>void, prepend: boolean, onSelected: (container: HTMLElement)=>void ): void`

Adds a new app to the sidebar.

Parameters:
- `icon`: String - Icon class name to display for the app
- `id`: String - Unique identifier for the app
- `title`: String - Display title of the app
- `initFunction`: Function - Called when app is first initialized, receives container element
- `prepend`: Boolean - Whether to add app at start (true) or end (false) of sidebar
- `onSelected`: Function - Called whenever app tab is selected, receives container element

Example:
```javascript
sideBarApps.add(
  'icon_class', // Icon for the app
  'my_app_id',  // Unique ID
  'My App',     // Display title
  (container) => {
    // Initialize app UI
    container.innerHTML = '<div>App Content</div>';
  },
  false,        // Add to end of sidebar
  (container) => {
    // Handle when app is selected
    console.log('App selected');
  }
);
```
### `get(id: string): HTMLElement`

Gets the container element for the app with the given ID.

Parameters:
- `id`: String - ID of the app to get

Returns:
- `HTMLElement` - The container element for the app

Example:
```javascript
const container = sideBarApps.get('my_app_id');
```

### `remove(id: string): void`

Removes the app with the given ID from the sidebar.

Parameters:
- `id`: String - ID of the app to remove

Example:
```javascript
sideBarApps.remove('my_app_id');
```
