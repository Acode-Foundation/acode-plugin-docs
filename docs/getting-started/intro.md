---
lang: en-US
title: Acode Plugins
description: What Acode plugins are, how to install them, and where to go to build your own.
---

# Acode Plugins

Plugins extend the Acode editor: add commands, themes, languages, formatters, sidebar panels and more, or change how existing features behave.

Plugins are written in **JavaScript**. **TypeScript** is supported too, and the [official TypeScript template](./create-plugin.md#templates) gives you type checking for the Acode API.

## Install a plugin

Open the plugin manager from **Settings → Plugins**, or from the **Extensions** tab of the sidebar (open the sidebar with the menu button at the top left). Then pick one of these ways to install:

| Method | Steps |
| --- | --- |
| **From the store** | Browse the list, choose a plugin and tap **Install**. |
| **Local file** | Download the plugin `.zip` to your device. Tap **+**, choose **LOCAL** and select the file. |
| **Remote URL** | Tap **+**, choose **REMOTE** and enter the URL of the plugin `.zip`, for example one hosted on GitHub. |

::: info Source persistence
Acode remembers where a plugin was installed from. If you uninstall and reinstall it, it is fetched from the same source again.
:::

::: danger Only install plugins you trust
A plugin runs inside Acode with access to your files and the editor. Install plugins from reputable authors, and be careful with `.zip` files and URLs from unknown sources.
:::

## Build your own

1. [Create a plugin](./create-plugin.md): set up a project from a template and run it on your device.
2. [Understanding Plugins](./understanding-plugin.md): how Acode loads and unloads plugin code.
3. [Manifest](../plugin-essentials/manifest.md) and [Core File](../plugin-essentials/core-file.md): the two files every plugin needs.
4. [Acode API](../global-apis/acode.md): what your plugin can use.
