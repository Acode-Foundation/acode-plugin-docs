---
lang: en-US
title: Create an Acode Plugin
description: Set up a plugin project from a template, run it on your phone, and publish it.
---

# Create an Acode Plugin

Plugins are written in JavaScript (or TypeScript) and run inside Acode. This page takes you from an empty folder to a plugin installed on your device and, when you are ready, published.

::: tip New to plugins?
Read [Understanding Plugins](./understanding-plugin.md) after this page. It explains how Acode loads and runs your code.
:::

## Plugin structure

A plugin is a zip file with these files at its root:

| File | Required | Purpose |
| --- | --- | --- |
| `plugin.json` | Yes | The [manifest](../plugin-essentials/manifest.md): id, name, version and more. |
| `main.js` | Yes | The [core file](../plugin-essentials/core-file.md) with your plugin code. Its name and location are set by `main` in the manifest. |
| `readme.md` | Recommended | Description shown in the plugin store. |
| `icon.png` | Recommended | Icon shown in the plugin store (50 KB or smaller). |
| `changelogs.md` | No | Release notes. Also list it in `files` in the manifest. |

## Templates

Start from one of the official templates. Both come preconfigured with a bundler and build script that creates the zip for you.

| Template | Use it when |
| --- | --- |
| [JavaScript template](https://github.com/Acode-Foundation/acode-plugin) <Badge type="tip" text="official" /> | You want the simplest setup. |
| [TypeScript template](https://github.com/Acode-Foundation/AcodeTSTemplate) <Badge type="tip" text="official" /> | You want type checking and editor autocomplete for the Acode API. |

You can also start from scratch or use a different bundler. The only hard requirement is a zip with `plugin.json` at its root and the file named by `main` at the path it declares.

## Set up the project

### 1. Clone a template

```sh
git clone https://github.com/Acode-Foundation/acode-plugin.git my-plugin
cd my-plugin
```

Replace the URL with the TypeScript template if you prefer it.

### 2. Edit `plugin.json`

Set at least a unique `id`, a `name` and a `version`. Every field is explained in the [manifest reference](../plugin-essentials/manifest.md).

### 3. Install dependencies

::: code-group
```sh [npm]
$ npm install
```

```sh [pnpm]
$ pnpm install
```

```sh [yarn]
$ yarn install
```

```sh [bun]
$ bun install
```
:::

### 4. Start the development server

::: code-group
```sh [npm]
$ npm run dev
```

```sh [pnpm]
$ pnpm dev
```

```sh [yarn]
$ yarn dev
```

```sh [bun]
$ bun run dev
```
:::

The server watches your files and rebuilds the plugin zip whenever you save a change.

::: info
The server only rebuilds on file changes. If you start it and change nothing, no zip is created yet.
:::

If you prefer to build by hand, run the production build instead. It creates a smaller zip:

::: code-group
```sh [npm]
$ npm run build
```

```sh [pnpm]
$ pnpm build
```

```sh [yarn]
$ yarn build
```

```sh [bun]
$ bun run build
```
:::

### 5. Install the plugin in Acode

Open Acode's plugin manager from either the **Extensions** tab in the sidebar or **Settings → Plugins**, then pick an install source:

- **Remote**: enter the URL of the zip served by your dev server, for example `http://<your-ip>:3000/dist.zip`. Use this while developing.
- **Local**: choose a zip file on your device. Use this if you built by hand.

::: tip Reload without reinstalling
Plugins installed from a URL or a local zip get a **reload** icon in the **Extensions** tab of the sidebar. After the dev server rebuilds the zip, tap reload to load the new version immediately.
:::

## Create a plugin with the CLI <Badge type="warning" text="community" />

The community-maintained [Acode Plugin CLI](https://github.com/itsvks19/acode-plugin-cli) scaffolds a project from the official templates with an interactive wizard.

Install it (requires [Rust](https://www.rust-lang.org/tools/install)):

```sh
$ cargo install acode-plugin-cli
```

Run it:

```sh
$ acode-plugin-cli
```

The wizard asks for the plugin name, id, version and description, author details, license and keywords, and whether to use the JavaScript or TypeScript template. When it finishes, the project is ready to use.

## Build and publish

1. **Create a production build.** It is smaller than the development build.

   ::: code-group
   ```sh [npm]
   $ npm run build
   ```

   ```sh [pnpm]
   $ pnpm build
   ```

   ```sh [yarn]
   $ yarn build
   ```

   ```sh [bun]
   $ bun run build
   ```
   :::

2. **Upload the zip** to [acode.app](https://acode.app) to publish it in the plugin store. Watch the [publishing walkthrough](https://youtube.com/shorts/cxF2pxyN1HM?si=kQ5_BRtIO2RU-zhb) if you have not done it before.

To release an update, increase `version` in `plugin.json`, build again and upload the new zip. See [Publishing updates](../plugin-essentials/manifest.md#publishing-updates).

## Video tutorial

[How to create Acode plugins](https://youtu.be/ls--txHX3RQ?si=ZSvJMsb1KFeQA8zd)

## Next steps

- [Understanding Plugins](./understanding-plugin.md): the lifecycle of a plugin
- [Core File](../plugin-essentials/core-file.md): what `main.js` must contain
- [Acode API](../global-apis/acode.md): the API your plugin talks to
