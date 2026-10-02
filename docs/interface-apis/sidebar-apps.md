# SideBar Apps

The SideBar Apps API allows you to add mini app to the sidebar of the Acode editor. This provides a way to extend the editor's functionality with custom UI components that are easily accessible from the sidebar.

## Usage

To use the `SideBarApps` module, import it at the top of your plugin main file:

```javascript
const sideBarApps = acode.require('sidebarApps');
```

:::info
`acode.require("sidebarApps")` returns exactly `{ add, get, remove }`. The registry also has internal `init`, `loadApps` and `ensureActiveApp` methods, but those are **not** exposed to plugins — the app calls them during start-up, before plugins are loaded. Module names are case-insensitive.
:::

## How the sidebar renders an app

`add()` does two things:

1. Creates a `SidebarApp`, whose constructor immediately builds `<div class="container">` and `<span class="icon {icon}" data-action="sidebar-app" data-id="{id}" title="{title}">`, then calls your `initFunction` with the container.
2. Installs the icon into `.app-icons-container` inside `#sidebar` — prepended when `prepend` is `true`, appended otherwise.

Clicking the icon is handled by one delegated listener on `.app-icons-container`: it reads `data-action` / `data-id` and activates that app. Activating swaps the app's `.container` element into the sidebar's own `.container` slot and toggles the `active` class on its icon.

The active app is persisted in `localStorage` under the key `sidebarAppsLastSection`, and the **first** app you register becomes active if nothing was stored yet.

## Methods

### `add(icon: string, id: string, title: string, initFunction: (container: HTMLElement) => void | (() => void), prepend?: boolean, onSelected?: (container: HTMLElement) => void ): void`

Adds a new app to the sidebar.

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `icon` | `string` | Yes | – | Icon class name to display for the app, applied as `class="icon {icon}"`. See [Built-in Icons](#built-in-icons). |
| `id` | `string` | Yes | – | Unique identifier for the app. Becomes the icon's `data-id`, the value stored in `sidebarAppsLastSection`, and the key for `get` / `remove`. |
| `title` | `string` | Yes | – | Display title of the app, used as the icon's `title` (tooltip) attribute. |
| `initFunction` | `(container: HTMLElement) => void \| (() => void)` | Yes | – | Called **synchronously and immediately** — before the icon is installed — with the app's `<div class="container">`. **Return a cleanup function** and it will be invoked by `remove()`; anything else is ignored. A falsy value is replaced by a no-op. |
| `prepend` | `boolean` | No | `false` | Whether to add the app at the start (`true`) or the end (`false`) of the sidebar. |
| `onSelected` | `(container: HTMLElement) => void` | No | `() => {}` | Called whenever the app becomes active, i.e. on every `false` → `true` transition, with the container element. |

**Returns:** `void`.

:::tip
The built-in apps are declared as plain arrays and spread into `add()`, which is the shape Acode itself uses:

```js
export default [
  'documents',      // icon
  'files',          // id
  strings['files'], // title
  initApp,          // init function
  false,            // prepend
  onSelected,       // onSelected function
];
```

:::

Example:
```javascript
sideBarApps.add(
  'notes',      // Icon class for the app (see Built-in Icons below)
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

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `id` | `string` | Yes | – | ID of the app to get. |

Returns:
- `HTMLElement` - The container element for the app

Example:
```javascript
const container = sideBarApps.get('my_app_id');
```

:::warning
`get()` is **not** a safe lookup. It finds the app with `Array.prototype.find` and then reads `.container` unconditionally, so an unknown `id` throws a `TypeError` (`Cannot read properties of undefined (reading 'container')`) instead of returning `null`. Wrap it in `try`/`catch`, or track the ids you registered.
:::

### `remove(id: string): void`

Removes the app with the given ID from the sidebar.

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `id` | `string` | Yes | – | ID of the app to remove. |

**Returns:** `void`. An unknown `id` is a silent no-op.

What `remove()` does, in order:

1. Looks up the app; if not found, returns immediately.
2. Invokes the cleanup function returned by `initFunction` (if any) and clears it.
3. Removes the icon and the container from the DOM.
4. If the removed app was active and other apps remain, activates the app matching the stored `sidebarAppsLastSection`, falling back to the first remaining app.
5. If no apps remain, clears the stored section and removes `sidebarAppsLastSection` from `localStorage`.

Example:
```javascript
sideBarApps.remove('my_app_id');
```

## Complete Plugin Example <Badge type="tip" text="new" />

```javascript
acode.setPluginInit('com.example.todo', () => {
  const sideBarApps = acode.require('sidebarApps');

  const APP_ID = 'com.example.todo';

  sideBarApps.add(
    'notes',             // icon
    APP_ID,              // id
    'To-do',             // title (tooltip)
    (container) => {     // initFunction — runs immediately
      container.classList.add('todo');

      const list = document.createElement('ul');
      list.className = 'list scroll';
      list.style.maxHeight = '100%';
      list.style.overflowY = 'auto';

      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Add a task…';

      const add = () => {
        const value = input.value.trim();
        if (!value) return;
        const li = document.createElement('li');
        li.textContent = value;
        li.onclick = () => li.remove();
        list.appendChild(li);
        input.value = '';
      };

      const onKeydown = (e) => {
        if (e.key === 'Enter') add();
      };
      input.addEventListener('keydown', onKeydown);

      container.append(input, list);

      // A returned function becomes the app's cleanup hook: remove() runs it.
      return () => input.removeEventListener('keydown', onKeydown);
    },
    false,               // prepend
    (container) => {     // onSelected — runs on every activation
      // Re-run whatever needs live data each time the app becomes visible.
      container.dataset.opened = String(Date.now());
    }
  );

  acode.setPluginUnmount('com.example.todo', () => {
    sideBarApps.remove(APP_ID); // also runs the initFunction cleanup
  });

  // Drive the app from anywhere else in your plugin.
  acode.addCommand({
    name: 'example.todo.add',
    description: 'Add a to-do',
    readOnly: false,
    exec: () => {
      sideBarApps.get(APP_ID).querySelector('input')?.focus();
      return true;
    }
  });
});
```

## Gotchas

:::warning
`initFunction` runs **before** the icon is installed, so the container is detached from the DOM at that point. Do not measure layout or query the sidebar from inside it; do the work in `onSelected` instead.
:::

:::warning
There is **no** `onopen` / `onclose` option. `onSelected` is the only "opened" hook, and it fires on every activation, not once. Teardown is the value returned from `initFunction` (there is no separate `onremove` argument).
:::

:::warning
Duplicate ids are **not** rejected. Two `add()` calls with the same `id` create two apps; `get()` and `remove()` then operate on the first one only. Namespace your ids with your plugin id.
:::

:::warning
When the sidebar is closed on phones, the whole `#sidebar` element (and therefore your container) is detached from the DOM. Document-wide updates cannot reach your app until the sidebar is shown again, so re-apply anything derived from the document on each `onSelected`.
:::

:::tip
`add()` needs the sidebar to exist. That is guaranteed from a plugin's `init`, because the app calls `sidebarApps.init($sidebar)` and `sidebarApps.loadApps()` before plugins are loaded — but a plugin script evaluated during app boot would throw.
:::

## Built-in Icons <Badge type="tip" text="new" />

| Icon class | Built-in app |
|---|---|
| `documents` | Files (`files`) |
| `search` | Search in files (`searchInFiles`) |
| `extension` | Extensions (`extensions`) |
| `notifications` | Notifications (`notification`) |
| `favorite` | Sponsor icon (toggled by the "show sponsor sidebar app" setting) |

Any class from the full catalogue works — the complete list, and `acode.addIcon` for your own, is in [Built-in Icons](./side-buttons.md#built-in-icons).

:::tip
`icon` is a class name only; it cannot be a URL, an emoji or an SVG string. To show your own artwork either register it with `acode.addIcon(...)` or, more simply, skip `add()`'s icon and append your own element to the container.
:::

## Troubleshooting

### Scrolling Issues

If you encounter scrolling issues in your sidebar app, you need to add the `scroll` class to the element that should be scrollable and apply these essential CSS properties:

- `max-height`: Sets height constraints for the scrollable area
- `overflow-y: auto`: Enables vertical scrolling when content overflows

Note: The `scroll` class alone doesn't contain these properties, so you must apply them manually. It only styles the scrollbar itself (`::-webkit-scrollbar`, its track and its thumb).

Example:
```javascript
sideBarApps.add(
  'notes',
  'scrollable_app',
  'Scrollable App',
  (container) => {
    const content = document.createElement('div');
    content.className = 'scroll'; // Add the scroll class
    content.style.maxHeight = '300px'; // Set max height
    content.style.overflowY = 'auto'; // Enable vertical scrolling
    content.innerHTML = `
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
      <!-- More items that might overflow -->
    `;
    container.appendChild(content);
  },
  false,
  (container) => {
    console.log('Scrollable app selected');
  }
);
```

Both the `scroll` class and these CSS properties are required for proper scrolling functionality in sidebar apps.

## Related

- [`acode`](../global-apis/acode.md) — `require`, `addCommand`, `addIcon`, `setPluginUnmount`
- [Settings](../editor-components/settings.md) — `appSettings`, `editorManager` events
- [Side Buttons](./side-buttons.md) — editor-edge buttons and the built-in icon catalogue
- [Context Menu API](./context-menu.md) — menus inside a sidebar app
- [Toast](../ui-components/toast.md) — lightweight feedback from an app
