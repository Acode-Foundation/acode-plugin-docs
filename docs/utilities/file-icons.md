# File Icons API

Use `acode.require("fileIcons")` to register an icon pack. Acode owns matching and rendering; a pack supplies assets and association maps. Users select the active pack in **Settings → App settings → Interface → Icon pack** (setting key `iconTheme`).

::: info
Present in the Acode **v1.13.5** source tree (`src/lib/fileIcons.ts`, `src/lib/fileIconsBuiltin.ts`). `CHANGELOG.md` does not record a `versionCode` for this API, so do not hardcode one — feature-detect with `acode.require("fileIcons")?.register`.
:::

## Import

Call `acode.require("fileIcons")` **synchronously in your plugin main script** and keep that API for later callbacks. The loader binds it to your plugin before executing the script.

```js
const fileIcons = acode.require("fileIcons");
```

Feature detection on older Acode builds:

```js
const fileIcons = acode.require("fileIcons");
if (!fileIcons?.register) {
  // Running on an older Acode build — skip pack registration
}
```

Do **not** call `acode.require("fileIcons")` for the first time in a timer, event handler, or after an `await`: there is no executing main-script context then.

You can also take the same bound API from the third initialization argument:

```js
let registration;

acode.setPluginInit(plugin.id, async (baseUrl, page, { fileIcons }) => {
  // This API stays bound to this plugin across awaits and callbacks.
  registration = fileIcons.register({
    id: plugin.id,
    name: "My Icons",
    icons: `${baseUrl}icons/`,
    fileExtensions: { js: "javascript" },
  });
});

acode.setPluginUnmount(plugin.id, () => registration?.dispose());
```

Both forms expose only `register`, `icon`, and `onChange`. Acquisition outside a loader-bound context throws with instructions to use these entry points. Pack ownership never comes from the pack's `id`; a plugin can still provide several separately named packs.

## The plugin-bound API <Badge type="tip" text="new" />

`fileIcons` is the one module `acode.require()` does **not** return directly. It is special-cased:

```js
require(module) {
	if (module.toLowerCase() === "fileicons")
		return fileIcons.getPluginApi(document.currentScript);
	return this.#modules[module.toLowerCase()];
}
```

The full internal registry (with `list()`, `active()`, `use()`, `resolve()`, `resolveMany()`, `unregister()` and `refreshRenderedIcons()`) is **never** exported to plugins. What you get is a frozen three-method view, created per plugin `<script>` element:

```js
const api = Object.freeze({
	register: (pack) => { /* ownership is injected for you */ },
	icon: registry.icon.bind(registry),
	onChange: (listener) => { /* scoped + tracked per plugin */ },
});
```

What "plugin-bound" means in practice:

| Behaviour | Consequence |
| --- | --- |
| One frozen API object per plugin `<script>` | Mutating or extending it has no effect — `Object.freeze` |
| `register()` injects `pluginId` for you | A pack's `pluginId` cannot point at another plugin; supplying a mismatching one throws |
| Calling `bindPlugin` twice for the same id throws | `Plugin '<id>' is already bound` |
| Every `onChange` subscription is tracked per plugin | Acode detaches them **before** pack-removal events fire during unload |
| `unregisterByPlugin(pluginId)` runs on unmount, on script `onerror`, and when init throws | You do not have to dispose manually to avoid a leak |
| After unload, `register` / `onChange` throw | `Icon API for plugin '<id>' has been unloaded`. A retained API object stays unusable even after the plugin reloads |

Acquiring the API from anywhere other than the executing main script throws:

```text
Require "fileIcons" in the plugin main script, or use options.fileIcons in the init callback
```

`icon()` is the one method that keeps working after unload, because it does not assert plugin liveness — but it is still your frozen object, not the registry.

## Quick start

```js
const fileIcons = acode.require("fileIcons");
let registration;

acode.setPluginInit(plugin.id, (baseUrl) => {
  registration = fileIcons.register({
    id: plugin.id,
    name: "My Icons",
    icons: `${baseUrl}icons/`,
    fileNames: { "package.json": "nodejs", ".gitignore": "git" },
    fileExtensions: {
      js: "javascript",
      ts: "typescript",
      "d.ts": "typescript-def",
    },
    folderNames: { src: "folder-src" },
    folderNamesExpanded: { src: "folder-src-open" },
    folder: "folder",
    folderExpanded: "folder-open",
  });
});

acode.setPluginUnmount(plugin.id, () => registration?.dispose());
```

Ship the referenced SVGs inside your plugin's `icons/` directory. With the directory shorthand, `javascript` means `icons/javascript.svg`. Only explicitly referenced assets are used: Acode does **not** guess `-open` filenames. Omit `folderNamesExpanded` and `folderExpanded` to reuse closed icons.

Acode binds the API to the plugin whose main script is executing and supplies its owner ID automatically. The disposable also lets you remove a pack earlier. A plugin may register multiple packs with distinct IDs, preferably prefixed by its plugin ID.

Registration does **not** select a pack. When the user's previously selected pack registers after startup, Acode restores it automatically. Until then the Builtin pack remains usable.

## Pack format

There is one format, with association maps and defaults at the top level.

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | `string` | Required stable pack ID. Must match `/^[a-zA-Z][a-zA-Z0-9._-]*$/`. `builtin` is reserved and replacing it throws |
| `pluginId` | `string` | Optional compatibility field. If supplied, it must match the loading plugin; a mismatch throws. Acode supplies ownership internally |
| `name` | `string` | Display name; defaults to `id` |
| `schemaVersion` | `number` | Optional; defaults to `1`. Any other value throws |
| `icons` | `string` \| `object` | An absolute SVG directory URL, or a map of icon IDs to definitions |
| `fileNames` | `Record<string, string>` | Exact basenames mapped to icon IDs, such as `package.json` |
| `fileExtensions` | `Record<string, string>` | Extensions without leading dots, including compounds such as `test.ts` |
| `languageIds` | `Record<string, string>` | Acode CodeMirror mode names mapped to icon IDs |
| `folderNames` | `Record<string, string>` | Folder basenames mapped to closed icon IDs |
| `folderNamesExpanded` | `Record<string, string>` | Folder basenames mapped to expanded icon IDs |
| `file` | `string` | Default file icon ID. Omitted: built-in file fallback |
| `folder` | `string` | Default closed folder icon ID. Omitted: built-in folder fallback |
| `folderExpanded` | `string` | Expanded folder icon ID. Omitted: reuse `folder` |
| `rootFolder` | `string` | Workspace-root icon ID. Omitted: reuse `folder` |
| `rootFolderExpanded` | `string` | Expanded root icon ID. Falls back through `rootFolder`, `folderExpanded`, then `folder` |

Unknown fields, ambiguous definitions, conflicting normalized associations, and unknown icon references throw descriptive errors during registration. A rejected replacement leaves the previous pack active. Same-icon duplicate associations are allowed, which makes combining maps convenient.

### Key validation <Badge type="tip" text="new" />

| Key kind | Rules |
| --- | --- |
| `fileExtensions` | Must not start or end with `.`, must not contain `..`, and must not contain whitespace, `/` or `\`. Lowercased. `".ts"` throws `Invalid fileExtension '.ts'; omit leading dots and paths` |
| `languageIds`, `folderNames`, `folderNamesExpanded` | Lowercased; no other restriction |
| `fileNames` | Case-sensitive, plus a separate case-insensitive index. Two keys that differ only by case must map to the **same** icon, otherwise `Conflicting fileName association` throws |

Association values must all be non-empty strings, and every value must resolve to a defined icon — otherwise `fileExtensions.js references unknown icon 'nope'` throws.

There are no `label`, nested `associations`/`defaults`, `iconDefinitions`, `iconPath`, string definitions, or automatic expanded-asset aliases. Light/dark asset variants are not part of version 1. Use monochrome icons for automatic color adaptation. This format is inspired by editor icon packs; it is **not** a drop-in VS Code or Zed schema.

## Icon definitions

An explicit definition has exactly one of:

- `src`: an **absolute image URL**. Optional `monochrome: true` uses the image as a CSS mask painted with the current text colour.
- `className`: existing CSS classes, for integration with an icon font or plugin stylesheet. The plugin owns that stylesheet and its cleanup.

```js
icons: {
  javascript: { src: `${baseUrl}icons/javascript.svg` },
  folder: { src: `${baseUrl}icons/folder.svg`, monochrome: true },
  text: { className: "file file_type_default" },
  logo: { src: "data:image/svg+xml;base64,PHN2Zy8+" },
}
```

### Accepted `src` values <Badge type="tip" text="new" />

A `src` is accepted only if it starts with one of:

| Form | Example |
| --- | --- |
| `data:image/…` | `data:image/svg+xml;base64,PHN2Zy8+` |
| `http:` / `https:` | `https://example.com/icon.svg` |
| `blob:` | `blob:https://localhost/…` |
| `file:` | `file:///sdcard/icon.svg` |
| `content:` | `content://com.android.externalstorage.documents/…` |
| `ftp:` | `ftp://example.com/icon.svg` |
| a leading `/` | `/data/user/0/com.foxdebug.acode/files/icon.svg` |

Everything else throws `Unsafe icon asset for 'icons.<id>.src'`. A `src` also may **not** contain whitespace, `"`, `'`, `(`, `)` or `\`, because the value is interpolated into a generated stylesheet.

::: warning Inline SVG markup is not a `src`
You cannot paste `<svg>…</svg>` as a definition value. Use a `data:image/svg+xml;base64,…` URI, a real URL, or the directory shorthand.
:::

Other validation rules:

| Rule | Error |
| --- | --- |
| Both `src` and `className` set, or neither | `icons.<id> needs exactly one of src or className` |
| `monochrome` without `src`, or not a boolean | `icons.<id>.monochrome requires src and must be a boolean` |
| Empty `className` | `icons.<id>.className must be a non-empty string` |
| Any other key inside a definition | `icons.<id>.<key> is not supported` |

Directory shorthand IDs must match `/^[a-zA-Z0-9_-]+$/` — letters, digits, underscores and hyphens only, no dots. Explicit definition maps can use other non-empty IDs; generated CSS identifiers remain distinct.

Acode cannot detect missing glyphs in a custom CSS class. CSS class definitions are the plugin's responsibility.

## Matching and fallback

Files match in this order:

1. Filename, trying exact case before a case-insensitive lookup.
2. Longest matching extension: `button.test.ts` tries `test.ts` before `ts`.
3. Language ID, supplied by the caller or inferred from Acode's existing filename-to-mode registry.
4. Pack default file, then Acode's built-in file icon.

Extension and language matching is case-insensitive. A standalone dotfile such as `.env` does **not** have extension `env`; match it through `fileNames`. Paths and patterns are not supported in associations. Case-equivalent filename keys may coexist only when they reference the same icon.

Folders first use a named expanded association when expanded, otherwise a named closed association. A named association takes precedence over workspace-root defaults. Unmatched roots use root defaults; other folders use folder defaults. Folder-name matching is case-insensitive.

While an image loads, or if it fails, resolution returns a usable fallback. An unavailable expanded asset falls back to the closed folder. Other unavailable assets fall back to the pack default, then the built-in icon. Failed URLs are reported once in the console per activation; reselecting or replacing the pack allows retrying them.

## Methods

The examples below assume `const fileIcons = acode.require("fileIcons")`. These three methods and the returned cleanup functions are the complete plugin surface. An icon-pack-only plugin needs just `register` and its disposable. `icon` and `onChange` support plugins that render their own file lists.

| Method | Signature |
| --- | --- |
| `register` | `register(pack: FileIconTheme) => { dispose(): void }` |
| `icon` | `icon(resource: string \| IconResource) => string` |
| `onChange` | `onChange(listener: (info: {activeId: string, preferredId: string}) => void) => () => void` |

| Method | Contract |
| --- | --- |
| `register(pack)` | Validate and register a complete pack. Same ID and owner replaces the previous pack atomically. Returns `{ dispose() }`. |
| `icon(resource)` | CSS class string for the resource's current icon or fallback. Synchronous. |
| `onChange(listener)` | Subscribe to active/preferred pack changes, active pack replacement/removal, and asset readiness. Returns an unsubscribe function. Listener receives `{ activeId, preferredId }`. |

Only `register`, `icon`, and `onChange` are exported to plugins. Pack selection (`use`), catalog queries (`list`, `active`), detailed/batch resolution (`resolve`, `resolveMany`), direct removal (`unregister`, `unregisterByPlugin`), settings binding (`bindSettings`, `syncFromSettings`) and DOM refresh (`refreshRenderedIcons`) are internal. There is no public `use`, `update`, `unregister`, override system, or method alias. Users choose packs in settings. Register a complete replacement to update; dispose the registration to remove it.

Disposal is idempotent. Disposing an older registration cannot remove its replacement. Pack IDs owned by another plugin cannot be replaced. The loader binds lifecycle ownership independently of the pack definition. A retained registration API cannot register packs after its plugin unloads, including after that plugin reloads. This is lifecycle isolation, not a security sandbox between JavaScript plugins.

::: tip Free automatic refresh
Acode's own `refreshRenderedIcons()` sweeps the document for `[data-file-icon-name]` elements and rewrites their `className`. Any element you render with those attributes is updated for you whenever the pack changes or an asset finishes loading — no `onChange` subscription needed. This is how plugin settings rows using `ListItem.fileIcon` stay in sync.
:::

### `register(pack)` — publish or replace a pack

Call this during plugin initialization with the complete pack object. It validates synchronously and returns a registration handle; it does not wait for image loading or select the pack. The [quick start](#quick-start) is a complete registration guide.

To update an existing pack, use the same `id` through the same plugin-bound API with the complete replacement:

```js
let registration = fileIcons.register(pack);

// For example, a plugin preference changes its folder associations.
const replacement = {
  ...pack,
  folderNames: { ...pack.folderNames, tests: "folder-test" },
};
// folder-test must be defined in replacement.icons, or exist in its SVG directory.
registration = fileIcons.register(replacement);
pack = replacement;
```

Omitted associations are **removed**, rather than merged. Validation errors throw before the old pack is replaced. An active replacement refreshes Acode's icons; an inactive replacement remains inactive. The same ID cannot be taken over by another plugin.

### `registration.dispose()` — remove your registration

```js
acode.setPluginUnmount(plugin.id, () => {
  registration?.dispose();
  registration = undefined;
});
```

The returned `dispose()` takes no arguments and returns no value. Calling it repeatedly is safe. A handle for an older version cannot remove a newer registration with the same ID. Removing the active pack displays Builtin; the preferred ID is retained so the user's choice can resume if that pack registers again. Acode also removes registrations owned by a plugin when it unmounts.

### `icon(resource)` — render a single icon

```js
const iconElement = document.createElement("span");
const resource = { kind: "folder", name: "src", expanded: true };

function renderIcon() {
  iconElement.className = `my-file-icon ${fileIcons.icon(resource)}`;
}

renderIcon();
const unsubscribe = fileIcons.onChange(renderIcon);
// When the view is destroyed: unsubscribe();
```

Pass a filename string for a file, or the [resource object](#resource-reference). Returns a complete class string synchronously. Preserve your own sizing/layout classes separately, as shown. Treat generated classes as opaque: do not parse them or store them permanently. Resolve again when the resource is renamed, its folder expands/collapses, the view becomes visible, or `onChange` fires. A loading asset initially returns a fallback.

For language IDs, use the `name` values from `acode.require("editorLanguages").list()`. These are Acode's mode identifiers; do not assume another editor's IDs match.

For simple cases, `acode.require("helpers")` also wraps this:

```js
const helpers = acode.require("helpers");
helpers.getIconForFile("app.ts");
helpers.getIconForFolder("src", { expanded: true, isRoot: false });
```

### `onChange(listener)` — refresh a live view

```js
function refreshVisibleRows() {
  for (const row of visibleRows) {
    // Read the current resource: recycled rows may now represent a different file.
    row.icon.className = `my-file-icon ${fileIcons.icon(row.resource)}`;
  }
}

const unsubscribe = fileIcons.onChange(({ activeId, preferredId }) => {
  refreshVisibleRows();
});
refreshVisibleRows();

// Also call refreshVisibleRows() in the view's show/reconnect handler.
// When destroying the view:
// unsubscribe();
```

Subscribe with a function; returns an idempotent unsubscribe function. Acode tracks subscriptions by plugin and removes them before pack-removal events during unload, reload, or failed initialization. Old API handles cannot subscribe after unload. Call the unsubscribe function when a view closes to release its listener earlier. Subscription does **not** invoke the listener immediately, so perform the first render yourself.

Events cover:

- Active / preferred pack changes
- Active pack replacement or removal
- Completion of requested assets (success or failure)

Multiple asset completions may be grouped into one frame. `activeId` and `preferredId` can remain unchanged when only asset readiness changes.

Listeners run synchronously when notified. Keep them lightweight; resolve current rows instead of re-registering packs from the listener. One throwing listener is logged and does not prevent other listeners from running. Detached views can refresh their own elements directly; views that skip work while hidden should refresh when shown again.

## Complete example <Badge type="tip" text="new" />

Register a custom icon for a file extension, draw it in a plugin-owned list, and keep it live:

```js
// main.js
if (window.acode) {
  const fileIcons = acode.require("fileIcons");
  const page = acode.require("page");

  let registration;
  let unsubscribe;
  let listEl;

  const rows = [
    { kind: "file", name: "a.todo" },
    { kind: "file", name: "README.md" },
    { kind: "folder", name: "src", expanded: false },
    { kind: "folder", name: "src", expanded: true },
  ];

  acode.setPluginInit(plugin.id, (baseUrl) => {
    // 1. Register the pack. Acode injects pluginId for us.
    registration = fileIcons.register({
      id: plugin.id,
      name: "My Icons",
      icons: `${baseUrl}icons/`, // todo.svg, folder-todo.svg, folder-todo-open.svg
      fileExtensions: { todo: "todo" },
      folder: "folder-todo",
      folderExpanded: "folder-todo-open",
    });

    // 2. Build a list that renders icons through the pack.
    listEl = tag("ul", { className: "scroll" });

    const render = () => {
      listEl.content = rows.map((resource) =>
        tag(
          "li",
          // Keep your own layout class; the pack supplies the glyph class.
          { className: `row ${fileIcons.icon(resource)}` },
          tag("span", { textContent: resource.name }),
        ),
      );
    };
    render();

    // 3. Re-render whenever the active pack changes or an asset finishes loading.
    unsubscribe = fileIcons.onChange(({ activeId, preferredId }) => {
      console.log("icon pack changed:", activeId, preferredId);
      render();
    });

    // 4. Publish it on the plugin page.
    page.appendBody(listEl);
  });

  acode.setPluginUnmount(plugin.id, () => {
    unsubscribe?.();
    registration?.dispose();
  });
}
```

::: warning Assets must be reachable
`icons: "${baseUrl}icons/"` must end with a `/`. Acode joins it with `<id>.svg`, so `javascript` becomes `<baseUrl>icons/javascript.svg`. If an asset 404s, resolution falls back and the console logs `[fileIcons] Theme '<id>' could not load '<src>'; using fallback` once per activation.
:::

## Resource reference

For `icon`, a resource is a filename string, or an object:

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | `string` | Required basename or path. Only the basename is matched; URI decoding is not performed |
| `kind` | `"file" \| "folder"` | Defaults to `file` |
| `languageId` | `string` | Optional known Acode mode name for a file; avoids language inference. Filename/extension associations still take precedence |
| `expanded` | `boolean` | Folder expansion state, `false` when omitted |
| `isRoot` | `boolean` | Whether a folder is a workspace root, `false` when omitted |

Names may be passed as paths for convenience; only the basename is matched. URI parsing is the caller's responsibility.

The built-in ID `builtin` and stored setting key `iconTheme` remain unchanged. **Icon pack** and **Builtin** are the display names; existing saved selections continue to work. When a plugin registers a pack whose ID matches the user's stored `iconTheme`, it is activated immediately — so a disabled-and-reenabled plugin restores the user's choice without any extra code.

## Custom plugin views

Set your element's classes from `icon(resource)`. Subscribe to `onChange` and resolve again when notified, since a returned fallback may later become a loaded image. Preserve any layout classes your element needs. Unsubscribe when the view closes. Recycled list rows must use their current resource when refreshing.

Matching is synchronous and never calls plugin code or reads file contents. Acode requests image assets only when resolved, shares requests within the active pack, and installs styles only for the active pack. Image decoding/caching is handled by the WebView. Prefer small local assets; the API does not impose a decoded-memory budget.

## Reading packaged association files

Use `acode.require("fs")` with a filesystem path to load local JSON. Use `baseUrl` for image URLs. In Acode, the Cordova HTTP-backed `fetch()` path cannot read these packaged JSON files reliably.

```js
const fileIcons = acode.require("fileIcons");
const fs = acode.require("fs");
const Url = acode.require("Url");
let registration;

acode.setPluginInit(plugin.id, async (baseUrl) => {
  const root = Url.join(PLUGIN_DIR, plugin.id);
  const files = await fs(Url.join(root, "file_icons.json")).readFile("json");
  const folders = await fs(Url.join(root, "folder_icons.json")).readFile("json");

  registration = fileIcons.register({
    id: plugin.id,
    name: "My Icons",
    icons: `${Url.join(baseUrl, "icons")}/`,
    fileNames: files.fileNames,
    fileExtensions: files.fileExtensions,
    folderNames: folders.folderNames,
    folderNamesExpanded: folders.folderNamesExpanded,
    folder: "folder",
    folderExpanded: "folder-open",
  });
});
```

The [icon pack example plugin](https://github.com/Acode-Foundation/acode-icon-plugin-example) shows JSON loading and conversion from an existing pack. Install its `plugin.zip`, then select **Icon Pack Example** in **Settings → App settings → Interface → Icon pack**.

## Migrating from the draft API

- Omit `pluginId` and use `name` for the pack display name. If keeping `pluginId` for compatibility, it must match the loading plugin.
- Capture `acode.require("fileIcons")` synchronously in the plugin main script, or take `fileIcons` from the initialization options.
- Move association maps and defaults to the top level.
- Replace `iconDefinitions`/`iconPath` with `icons`/`src`, using absolute image URLs.
- Declare expanded associations explicitly; remove unsupported appearance fields.
- Replace `update` with `register`, and `unregister` with the registration's `dispose()`.
- Remove method aliases and automatic pack selection from plugin initialization.
- Use `icon(resource)` for rendering. Catalog queries and detailed/batch resolvers are no longer exported; loop over visible resources when drawing multiple icons.

## Related APIs

- Language IDs for `languageIds` / `icon({ languageId })`: [Editor Languages](./ace-modes.md)
- Loading packaged JSON from the plugin folder: [File System (fs)](./fs.md)
- Plugin init options (`options.fileIcons`): [Acode](../global-apis/acode.md)
- Plugin lifecycle and main-script binding: [Understanding Plugins](../getting-started/understanding-plugin.md)
