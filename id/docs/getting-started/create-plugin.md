---
lang: en-US
title: Create Acode Plugin
---

# Create Acode Plugin

## Overview

Acode opens up a world of possibilities with its extensibility through plugins. In this guide, you'll learn how to create plugins using JavaScript, with the added option of TypeScript. Whether you're customizing your coding experience or adding entirely new features, creating plugins for Acode is a straightforward and rewarding process.

## Plugin Structure

Acode plugins follow a specific structure within a zip file. The necessary components include:

1. **plugin.json:**

   - Contains crucial information about the plugin, such as its name, version, author, and more.

2. **main.js:**

   - The heart of the plugin, this file contains the actual plugin code.

3. **readme.md:**
   - Contains the description or about plugin

3. **changelogs.md:**
   - contains changelogs of your plugin updates.

## Plugin Templates

To make your journey smoother, we provide comprehensive plugin templates, which are preconfigured and catering to various use cases:

1. **[JavaScript Template](https://github.com/Acode-Foundation/acode-plugin)** <Badge type="tip" text="official" /> : Javascript based template for plugin development and comes preconfigured

2. **[TypeScript Template](https://github.com/Acode-Foundation/AcodeTSTemplate)** <Badge type="tip" text="official" /> : Typescript template for plugin development and comes with type checking and all typescript feature

## Getting Started

1.  **Clone the Plugin Template:**

    - Choose the template that suits your needs and clone it.

2.  **Customize plugin.json:**

    - Open the `plugin.json` file and update it with your plugin's information.

3.  **Install the dependency:**

    - Install the required dependency by your package manager but first navigate to the plugin template folder by `cd acode-template`

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

4.  **Develop Locally:**

    - Use given commands to initiate a development server that watches for changes.
    - The development server automatically creates a plugin zip file, ready for installation.
    
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

    - Or you can build every time manually on changes using(this will build production build):

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

5.  **Install the Plugin:**

    - Use the **REMOTE** option in Acode's plugin manager.
    - This option is available on both sidebar extension tab or on Plugin page from settings.
    - Provide the plugin URL (e.g., `http://\<ip\>:3000/dist.zip`) when prompted.
    - Or if you are building manually then you can use the **Local** option in Acode's plugin manager and select the plugin zip

:::info
Development server will only build the zip on file changes
:::

:::tip 
For local development, start a dev server using `npm run dev`. In Acode, use the **Remote** option, either from the **sidebar** or the **plugin page**. Enter the server URL, hit **Install**, and the plugin will be installed.  

It's more convenient to manage this from the sidebar. When you install a local plugin(either using url or selecting the zip), Acode will add a **reload** icon in the **Extensions** tab of the sidebar. This is useful because the server automatically builds the plugin ZIP when changes are made. Simply press the reload button to apply the latest changes instantly.  

This makes plugin development a much smoother experience—previously, it was quite frustrating, but this feature was recently added to improve the workflow.
:::

## Creating Plugins with the CLI<Badge type="warning" text="community" />

You can also quickly scaffold new Acode plugins using the [Acode Plugin CLI](https://github.com/itsvks19/acode-plugin-cli). This tool provides an interactive wizard to generate a plugin project from the official JavaScript or TypeScript templates.

### Installation

If you have Rust installed, you can install the CLI with:

```bash
cargo install acode-plugin-cli
```

### Usage

Run the CLI in your terminal:

```bash
acode-plugin-cli
```

The wizard will guide you to:

- Choose plugin name, ID, version, and description
- Enter author information
- Pick license and keywords
- Select JavaScript or TypeScript template

After completion, your plugin folder will be ready to use.

## Building and Publishing

To share your plugin with the Acode community, follow these steps:

1. **Bundle for production:**

   - Use `build` command to create a production build. which will be lower in size

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

2. **Publish:**

   - Publish your release build on [Acode's](https://acode.app) official website, making your plugin accessible to the broader community.

   - Tutorial for publishing a plugin : [Youtube](https://youtube.com/shorts/cxF2pxyN1HM?si=kQ5_BRtIO2RU-zhb)

## Tutorial

- Checkout a small tutorial of 👉 [How to create Acode Plugins?](https://youtu.be/ls--txHX3RQ?si=ZSvJMsb1KFeQA8zd)

## Customization

Certainly! You have the flexibility to either utilize your own template or start your plugin from scratch. Additionally, you're free to employ alternative bundlers and tools. We'll delve deeper into these customization possibilities in subsequent sections.

Happy coding, and may your plugins bring new dimensions to your Acode experience! 🚀✨
