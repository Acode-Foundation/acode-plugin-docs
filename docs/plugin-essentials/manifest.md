---
title: Manifest (plugin.json)
description: Every field of plugin.json, which are required, and how Acode reads them.
---

# Manifest: `plugin.json`

Every plugin has a `plugin.json` file at the root of its zip. It tells Acode and the plugin store who your plugin is, which file to run, and which files to ship.

## Quick reference

| Field | Type | Required | Summary |
| --- | --- | --- | --- |
| [`id`](#id) | `string` | Yes | Unique plugin identifier. |
| [`name`](#name) | `string` | Yes | Display name. |
| [`version`](#version) | `string` | Yes | Version of this release. |
| [`main`](#main) | `string` | Yes | Path of the script Acode runs. |
| [`minVersionCode`](#minversioncode) | `number` | Recommended | Oldest Acode build that can run it. |
| [`author`](#author) | `object` | Recommended | Who made the plugin. |
| [`readme`](#readme) | `string` | Recommended | Path of the store description. |
| [`icon`](#icon) | `string` | Recommended | Path of the store icon. |
| [`files`](#files) | `string[]` | No | Extra files to include. |
| [`dependencies`](#dependencies) | `string[]` | No | Plugins to install first. |
| [`price`](#price) | `number` | No | Price in INR. `0` is free. |
| [`license`](#license) | `string` | No | License name. |
| [`keywords`](#keywords) | `string[]` | No | Search terms. |
| [`changelogs`](#changelogs) | `string` | No | Path of the changelog. |
| [`contributors`](#contributors) | `object[]` | No | People who contributed. |
| [`repository`](#repository) | `string` | No | Source code URL (free plugins only). |

## Example

```json [plugin.json]
{
  "id": "com.example.plugin",
  "name": "Example Plugin",
  "version": "1.0.0",
  "main": "main.js",
  "readme": "readme.md",
  "icon": "icon.png",
  "files": ["worker.js"],
  "minVersionCode": 292,
  "price": 0,
  "license": "MIT",
  "keywords": ["example", "starter"],
  "changelogs": "changelogs.md",
  "author": {
    "name": "Example Author",
    "email": "example@email.com",
    "url": "https://example.com",
    "github": "example"
  }
}
```

## Required fields

### `id`

Unique identifier of the plugin. The reverse-domain style (`com.example.plugin`) is recommended because it avoids clashes, but any unique string works.

This is the same id you pass to [`acode.setPluginInit`](../global-apis/acode.md#setplugininit-pluginid-init-settings) and [`acode.setPluginUnmount`](../global-apis/acode.md#setpluginunmount-pluginid-unmount).

::: warning
Changing the `id` creates a **different plugin**. Users of the old one will not receive it as an update.
:::

### `name`

Display name shown in the plugin list and store.

### `version`

Version of this release, for example `1.2.0`. Acode compares this with the store's version to decide whether an update is available, so **increase it for every release**.

### `main`

Path, inside the zip, of the script Acode loads when the plugin starts. This is usually your bundled output (for example `dist/main.js`). See [Core File](./core-file.md) for what it must contain.

## Recommended fields

### `author`

An object describing the author.

| Key | Description |
| --- | --- |
| `name` | Author name. |
| `email` | Contact email. |
| `url` | Website. |
| `github` | GitHub username. |

### `minVersionCode`

The oldest Acode **version code** that can run the plugin. Older builds do not offer it.

Use the version code of the newest API your plugin needs. If it uses nothing recent, `290` is a safe floor because the field itself was introduced then. Pages in these docs mark newer APIs with badges such as `v954+`; use that number.

### `readme`

Path of a Markdown file shown as the plugin's description in the store.

### `icon`

Path of a PNG shown as the plugin's icon.

::: info
The icon must be **50 KB or smaller**.
:::

## Optional fields

### `files`

Extra files your plugin needs at runtime besides `main`, `readme` and `icon`: for example a web worker, fonts or images. When building with the official templates, list each extra file here so the pack-zip script includes it in the zip; then load it through `baseUrl`. Acode itself does not use this field to package files.

```json
"files": ["worker.js", "fonts/Mono.woff2", "images/logo.png"]
```

### `dependencies`

Ids of other plugins that must be installed first.

```json
"dependencies": ["com.example.core", "com.example.themes"]
```

When a user installs your plugin, Acode looks each id up in the store, lists the ones that are missing or outdated, and asks for confirmation. If the user agrees, they are installed before your plugin. Dependencies of dependencies are resolved too.

::: warning
Installation fails if an id does not exist in the store. Use exact ids of published plugins.
:::

### `price`

Price in Indian Rupees (INR). `0` or omitted means free. The allowed range is **0 to 10,000**.

### `license`

Name of the license, for example `MIT` or `GPL-3.0`.

### `keywords`

Search terms that help people find the plugin.

### `changelogs`

Path of a Markdown changelog.

::: warning
When building with the official templates, list this file in [`files`](#files) or the pack-zip script will not include it in the zip.
:::

### `contributors`

People who helped build the plugin. Each entry needs:

| Key | Description |
| --- | --- |
| `name` | Contributor's name. |
| `role` | What they did. |
| `github` | GitHub username. |

### `repository`

URL of the source code on GitHub or GitLab. Only available for **free** plugins.

## How Acode reads the file

When installing, Acode checks the manifest against the zip:

- `plugin.json` must exist at the **root** of the zip, or the plugin is rejected as invalid.
- If `main` is missing or points to a file that is not in the zip, Acode falls back to `main.js`. If that is missing too, installation fails.
- If `icon` or `readme` is missing or does not exist in the zip, Acode falls back to `icon.png` and `readme.md`.

So a typo in `main` does not always fail loudly. Check that the path matches a real file.

## Publishing updates

1. Increase `version`.
2. Make your changes, including any to `name`, `icon`, `readme` or `price`.
3. Build a new zip that contains the updated `plugin.json`, and upload it.

## Related

- [Core File](./core-file.md)
- [Create a plugin](../getting-started/create-plugin.md)
