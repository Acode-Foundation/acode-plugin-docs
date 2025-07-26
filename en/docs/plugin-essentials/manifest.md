# Manifesto - `plugin.json`

The `plugin.json` file is a crucial component of every Acode plugin, serving as a manifest file that provides essential information about the plugin. This file is required for the proper functioning and identification of your plugin within the Acode ecosystem. Let's delve into the details of the `plugin.json` structure and its key attributes.

# Attributes in plugin.json:

## 1. **id:**
   - Unique identifier for the plugin, following the reverse domain name format or what ever you want *(e.g., "com.example.plugin")*.

## 2. **name:**
   - Descriptive name of the plugin.

## 3. **main:**
   - Path to the bundled `main.js` file or your plugin's main javascript file, which contains the actual code for the plugin.

## 4. **version:**
   - Version number of the plugin. Must be incremented for updates.

## 5. **readme:**
   - Path to the `readme.md` file, providing documentation and information about the plugin.

## 6. **icon:**
   - Path to the `icon.png` file, serving as the visual representation of the plugin.

   :::info
   Icon file size must less than or equal to **50Kb**
   :::

## 7. **files:**
   - An array listing the files to be included in the plugin zip file.

## 8. **minVersionCode:**
   - Minimum Acode version code required to run the plugin. The plugin will be available only for Acode versions greater than or equal to the specified code.
   :::info
   You can simply use `290`, as this option became available in that version. If you are using the latest Acode plugin API, specify the corresponding version.
   :::


## 9. **price:**
   - Price of the plugin in INR (Indian Rupees). If set to 0 or omitted, the plugin is free. This attribute allows for monetization of plugins with a defined price range.

   :::info
   Price should be between INR 0 to 10,000
   :::

## 10. **author:**
   - Details about the plugin author, including name, email, URL, and GitHub username.

## 11. **license:** <Badge type="tip" text="new" />
   - Name of the license under which the plugin is released.

## 12. **keywords:** <Badge type="tip" text="new" />
  - An array of strings providing searchable terms related to the plugin.

## 13. **changelogs:** <Badge type="tip" text="new" />
  - Path to the changelog file documenting version updates and modifications.

   ::: warning
   Make sure to include `changelogs.md` or whatever you named it, in the plugin zip.
   :::

## 14. **contributors:** <Badge type="tip" text="new" />
  - An array of objects containing details about project contributors.
  - Each object requires:
    - `name`: Contributor's name
    - `role`: Their role in the project
    - `github`: Their GitHub username

## 15. **repository:** <Badge type="tip" text="new" />
  - Github/Gitlab url of your plugin source(only for free plugins)

# Updating Plugins:

If you wish to publish an update for your plugin, follow these guidelines:

- **Version Increment:**
  - Increase the version number in the `plugin.json` file.

- **Update Information:**
  - For changes in name, description, icon, etc., upload a new zip file containing the updated `plugin.json`.

- **Price Modification:**
  - If altering the plugin's price, update the `price` attribute in the `plugin.json` file and upload the new zip file.

## Example plugin.json:

::: code-group
```json [plugin.json]
{
  "id": "com.example.plugin",
  "name": "Example Plugin",
  "main": "dist/main.js",
  "version": "1.0.0",
  "readme": "readme.md",
  "icon": "icon.png",
  "files": ["worker.js"],
  "minVersionCode": 292,
  "price": 0,
  "license": "MIT",
  "keywords": ["foo","bar"],
  "changelogs": "changelogs.md",
  "author": {
    "name": "Example Author",
    "email": "example@email.com",
    "url": "https://example.com",
    "github": "example"
  }
}
```
:::

This example illustrates a basic `plugin.json` file.
