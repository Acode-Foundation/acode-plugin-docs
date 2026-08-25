# System

The `system` module wraps Acode's native Android bridge (`cordova-plugin-system`). It is clobbered to `window.system` and provides low-level device, file, storage, permission, intent, and shortcut utilities that Acode itself uses.

```js
const system = window.system;
```

Most methods are callback-based (`(success, error) => void`). Wrap them with `helpers.promisify` when you prefer promises:

```js
const helpers = acode.require("helpers");
const filesDir = await helpers.promisify(system.getFilesDir);
```

## Files

### `getFilesDir(success, error)`

Resolves the app's internal files directory path.

```js
const filesDir = await helpers.promisify(system.getFilesDir);
```

### `getParentPath(path, success, error)`

Resolves the parent directory of `path`.

### `listChildren(path, success, error)`

Lists the children of a directory path.

### `mkdirs(path, success, error)`

Recursively creates directories.

### `fileExists(path, countSymlinks, success, error)`

Checks whether a file exists. `countSymlinks` is a boolean passed as a string.

### `copyToUri(srcUri, destUri, fileName, success, error)`

Copies a file to a destination uri under `fileName`.

### `writeText(path, content, success, error)`

Writes text content to a file path.

### `deleteFile(path, success, error)`

Deletes a file path.

### `createSymlink(target, linkPath, success, error)`

Creates a symlink at `linkPath` pointing to `target`.

### `setExec(path, executable, success, error)`

Marks a file path as executable (`executable` is a boolean passed as a string).

### `extractAsset(assetName, destinationPath, success, error)`

Extracts an app asset to a destination path.

### `getNativeLibraryPath(success, error)`

Resolves the directory where native libraries are stored.

## Storage management

### `isManageExternalStorageDeclared(success, error)`

Checks whether the app declares all-files access in its manifest.

### `hasGrantedStorageManager(success, error)`

Checks whether the app has been granted "All files access".

### `requestStorageManager(success, error)`

Requests the "All files access" permission.

### `manageAllFiles(success, error)`

Opens the system screen to grant all-files access.

### `isExternalStorageManager(success, error)`

Checks whether the app is currently an external storage manager.

## Permissions

### `hasPermission(permission, success, error)`

Checks whether a runtime permission is granted.

### `requestPermission(permission, success, error)`

Requests a single runtime permission.

### `requestPermissions(permissions, success, error)`

Requests multiple runtime permissions at once.

## App & device info

### `getAppInfo(success, error)`

Resolves information about the Acode app.

### `getInstaller(success, error)`

Resolves the package that installed the app (used for `window.appInstallSource`).

### `getAndroidVersion(success, error)`

Resolves the Android OS version.

### `getArch(success, error)`

Resolves the device architecture (e.g. `arm64-v8a`).

### `getWebviewInfo(success, error)`

Resolves WebView information (used by the terminal's engine detection).

### `isPowerSaveMode(success, error)`

Checks whether the device is in power-save mode.

### `getGlobalSetting(key, success, error)`

Reads a global Android setting by key.

### `clearCache(success, error)`

Clears the app's cache.

## File actions & sharing

### `fileAction(fileUri, filename, action, mimeType, error?)`

Launches an Android intent for a file. `action` is one of `VIEW`, `EDIT`, `SEND`, or `RUN` (the app prepends `android.intent.action.`). Arguments are flexible: `system.fileAction(uri, filename, action, mimeType, onFail)`.

```js
system.fileAction(fileUri, filename, "VIEW", "text/plain");
```

### `shareText(text, success, error)`

Shares a text string through the system share sheet.

### `openInBrowser(src)`

Opens a url in the system browser.

### `inAppBrowser(url, title, showButtons, disableCache)`

Opens a url in Acode's in-app browser. Returns an object with `onOpenExternalBrowser` and `onError` callbacks that can be assigned:

```js
const browser = system.inAppBrowser(url, title, true, false);
browser.onOpenExternalBrowser = (url) => console.log("opened externally", url);
```

### `launchApp(app, className, extras?, success?, error?)`

Launches an Android activity by package and class name, optionally passing intent extras (string/number/boolean values).

```js
system.launchApp(
  "com.example.app",
  "com.example.app.MainActivity",
  { user: "example", premium: true },
  (msg) => console.log(msg),
  (err) => console.error(err),
);
```

## Shortcuts

### `addShortcut(shortcut, success, error)`

Adds a home-screen shortcut. `shortcut` is `{ id, label, description, icon, action, data }`.

### `removeShortcut(id, success, error)`

Removes a shortcut by id.

### `pinShortcut(id, success, error)`

Pins a shortcut.

### `pinFileShortcut(shortcut, success, error)`

Pins a file shortcut.

## Intents

### `getCordovaIntent(success, error)`

Resolves the intent that launched the app (for handling external open requests).

### `setIntentHandler(handler, onerror)`

Registers a handler for intents received while the app is running. `handler` receives the intent data.

## Text comparison

Used by the editor's dirty-tracking and file-change detection. Both methods compare in a background thread.

### `compareFileText(fileUri, encoding, currentText): Promise<boolean>`

Reads the file at `fileUri` and compares it to `currentText`. Resolves `true` when the content **differs**, `false` when it matches.

### `compareTexts(text1, text2): Promise<boolean>`

Compares two strings. Resolves `true` when they **differ**, `false` when equal.

```js
const changed = await system.compareFileText(file.uri, file.encoding, text);
```

## UI

### `setUiTheme(systemBarColor, theme, success?, error?)`

Sets the Android system bar colors to match a theme. `systemBarColor` is a hex color; `theme` is the theme id. A pure white color is mapped to `#fffffe` so status bar icons stay visible.

### `setInputType(type, success, error)`

Changes the soft-keyboard input type.

### `setNativeContextMenuDisabled(disabled, success, error)`

Enables or disables the native context menu on the WebView.
