---
sidebar_position: 5
title: Other Global APIs
---

# Useful Global APIs

These global APIs provide essential information about asset directories, storage locations, app features, and system specifications.

### ASSETS_DIRECTORY
`<string>` The directory where all the assets are stored.

### CACHE_STORAGE
`<string>` The directory where all the cache files are stored.

### DATA_STORAGE
`<string>` The directory where all the data files are stored.

### PLUGIN_DIR
`<string>` The directory where all the plugins are stored.

### DOES_SUPPORT_THEME
`<boolean>` Whether the app supports theme or not.

### IS_FREE_VERSION
`<boolean>` Whether the app is free version or not.

### KEYBINDING_FILE
`<string>` The file where all the keybindings are stored.

### ANDROID_SDK_INT
`<number>` The Android SDK version.

These global APIs provide vital insights into asset management, storage locations, app capabilities, and system compatibility, enhancing developers' ability to create user-friendly plugins. Here is a very simple example on how to use these APIs:
```javascript
console.log(acode.ASSETS_DIRECTORY) // returns a string like "/path/to/assets"
console.log(acode.IS_FREE_VERSION) //  logs true if user is using free version of the app, else false
```