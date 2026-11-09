# Other Global Utilities

These extra global APIs provide essential information about asset directories, storage locations, app features, and system specifications.

## ASSETS_DIRECTORY
`<string>` The directory where all the assets are stored.

## CACHE_STORAGE
`<string>` The directory where all the cache files are stored.

## DATA_STORAGE
`<string>` The directory where all the data files are stored.

## PLUGIN_DIR
`<string>` The directory where all the plugins are stored.

## DOES_SUPPORT_THEME
`<boolean>` Whether the app supports theme or not.

## IS_FREE_VERSION
`<boolean>` Whether the app is free version or not.

## KEYBINDING_FILE
`<string>` The file where all the keybindings are stored.

## ANDROID_SDK_INT
`<number>` The Android SDK version.

## appInstallSource
`<string | null>` Read-only. Package name of the store that installed Acode, for example `"com.android.vending"` for Google Play, or `null` when unknown (such as a sideloaded APK).

## strings
`<Record<string, string>>` Acode's UI text in the user's current language, keyed by the English text. Use it to match Acode's wording, for example `strings["save"]` or `strings.cancel`. A key can be missing in some languages, so always provide a fallback.

```javascript
const label = strings["search in files"] || "Search in files";
```

## toast
`(message: string, duration?: number) => void` Shows a short message at the bottom of the screen. Same as [`acode.require("toast")`](../ui-components/toast.md).

## app
`<HTMLBodyElement>` The app's `<body>` element.

## root
`<HTMLElement>` The `#root` element that holds the header, tabs and editor.


Here is a very simple example on how to use these APIs:
```javascript
console.log(ASSETS_DIRECTORY) // returns a string like "/path/to/assets"
console.log(IS_FREE_VERSION) //  logs true if user is using free version of the app, else false
```