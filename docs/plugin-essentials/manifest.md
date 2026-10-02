# Manifesto - `plugin.json`

The `plugin.json` file is a crucial component of every Acode plugin, serving as a manifest file that provides essential information about the plugin. This file is required for the proper functioning and identification of your plugin within the Acode ecosystem. Let's delve into the details of the `plugin.json` structure and its key attributes.

# Attributes in plugin.json:

## 1. **id:**
   - Unique identifier for the plugin, following the reverse domain name format or what ever you want *(e.g., "com.example.plugin")*.
   - The plugin folder in `PLUGIN_DIR` is named after this id. For a registry install the folder comes from the id you asked Acode to install, **not** from the manifest; when you install from a local `file:`/`content:`/`http(s):` zip, the manifest's `id` is used verbatim and becomes the install directory, and the zip URL is recorded in the `source` attribute. Nothing cross-checks the two, so keep them identical.

## 2. **name:**
   - Descriptive name of the plugin. Shown on the plugin details page and used as the title of the settings page created by `acode.setPluginInit(id, init, settings)`.

## 3. **main:**
   - Path to the bundled `main.js` file or your plugin's main javascript file, which contains the actual code for the plugin.
   - The key itself is optional: if it is missing, or names a file that is not in the zip, the manifest is rewritten to `main.js` (`src/lib/installPlugin.js`). The same fallback is applied at load time. But **the file must exist in the zip** - if `main.js` is absent too, the install fails with `Invalid Plugin`. The loader appends a `<script>` tag with id `` `${pluginId}-mainScript` `` and removes it before the next load, so the file is fetched and evaluated as a classic script.

## 4. **version:**
   - Version number of the plugin. Must be incremented for updates: Acode asks the registry `plugin/check-update/<id>/<version>` and falls back to comparing `plugin/<id>`'s remote `version`, so an unchanged version means no update is ever offered.
   - Version strings are compared with Acode's own comparator (`src/utils/version.js`), which is **strictly `MAJOR.MINOR.PATCH` with digits only**. A leading `v` is tolerated, but `"1.0"`, `"1.0.0-beta1"` or `"1.x"` all fail to parse, compare as equal, and your plugin will never show an update.

## 5. **readme:**
   - Path to the `readme.md` file, providing documentation and information about the plugin. If the declared path is not in the zip it is rewritten to `readme.md`, and the details page also falls back to `readme.md` when the attribute is missing entirely. Its text is rendered as markdown into the plugin's Overview tab - this is the long description users see, not a settings screen.

## 6. **icon:**
   - Path to the `icon.png` file, serving as the visual representation of the plugin.
   - Acode checks exactly one thing here: at install time, if the path you declared is not present in the zip, the manifest is patched to `icon.png` (`src/lib/installPlugin.js`). There is **no size, dimension, or format check anywhere in the app** - the details page simply reads the file's bytes, guesses a MIME type from the extension (`image/png` as fallback) and renders it through a blob URL (`src/pages/plugin/plugin.js`).
   - That read has **no `catch`**, so if the icon file is missing on disk the installed plugin's page reports an error instead of rendering. Always ship the file you point `icon` at.
   - The plugin icon is also **not** a file icon pack; that is a separate API. See [File Icons](../utilities/file-icons.md).

   :::info
   The commonly cited **50Kb** limit is not implemented in the app - `installPlugin` only tests for the file's presence in the archive, so an oversized icon will install fine and simply be slow to decode on the details page. If you publish to the Acode plugin registry, keep the icon small (well under 50 KB) to respect the registry's publishing constraint and to keep the plugin page fast.
   :::

## 7. **files:**
   - An array listing extra files to include in the plugin zip.

   :::warning
   Acode's installer **ignores** this attribute. `installPlugin` extracts *every* entry found in the archive (`Object.keys(zip.files)`), so listing or omitting files here changes nothing about what gets installed. It is purely a packaging hint for your build/zip step - and because the installer copies the whole archive, any file you ship (build tooling, sources, `.map` files) ends up in the user's plugin folder and in the app's backup. Ship only what you need.
   :::

## 8. **minVersionCode:**
   - Minimum Acode version code required to run the plugin.
   - **What Acode actually does with it: nothing in the app.** The app never reads `minVersionCode` from your installed `plugin.json`. `loadPlugin`/`loadPlugins` load a plugin regardless of this value, and nothing is hidden from the plugin list or from the backup list.
   - The gate that exists is on the **registry** side: the plugin page fetches `min_version_code` from the registry manifest (`src/pages/plugin/plugin.js`) and compares it against `BuildInfo.versionCode`. When your app is older, the details page replaces the Install / Update / Uninstall buttons with a link to the Play Store telling you the plugin needs a newer Acode. That is a **UI-level block on the details page**, not a load refusal.
   :::info
   Because the field is enforced by the registry, keep it in sync with the APIs you actually use. The app in this repository is **v1.13.5, versionCode `1011`** (`config.xml`), and version codes also appear in `CHANGELOG.md` headings (e.g. `v1.12.0 (970)`). Declaring a versionCode that does not yet exist only risks blocking your own users; declaring none lets older Acode builds install a plugin that may crash on a missing API.
   :::


## 9. **price:**
   - Price of the plugin as a **number**. `price > 0` is the only test Acode makes (`installedPlugin.price > 0` in `src/pages/plugin/plugin.js` and in dependency resolution), so `0` or an omitted `price` means free.
   - **Currency is not fixed by the app.** The symbol is whatever the registry returns (`price = ${remotePlugin.currencySymbol ?? ""}${remotePlugin.price}`), or the formatted Play price once the in-app product is resolved. The app has **no INR rule and no 0-10,000 range check**; the numeric range is a publishing constraint of the registry, not something the app enforces or validates.
   - **Paid install requires in-app purchasing.** A paid plugin also needs a `sku` matching a Play product. Acode looks up `iap.getProducts([sku])`; if there is no existing purchase it triggers `iap.purchase`, and only after a successful purchase does it POST the token to the registry's order endpoint and then install. An unknown `sku` fails with `Product not found`, and a cancelled/failed purchase aborts the install.
   - The purchase token is appended to the download URL (`&token=...`), which is how the registry authorises the paid zip.
   - Free plugins show an interstitial ad after install/uninstall; paid ones do not.

   :::info
   Price range limits are enforced when you publish, not at install time. If the registry rejects your manifest, the app cannot tell you why - it just shows the plugin as free/unpriced.
   :::

## 10. **author:**
   - Details about the plugin author, including name, email, URL, and GitHub username.
   - Effectively required: the details page reads `author.name` and `author.github` unguarded when building the plugin object, so a manifest without `author` breaks rendering of an installed plugin's page.

## 11. **license:** <Badge type="tip" text="new" />
   - Name of the license under which the plugin is released. Displayed verbatim, falling back to `Unknown`.

## 12. **keywords:** <Badge type="tip" text="new" />
  - An array of strings providing searchable terms related to the plugin. Rendered as tags on the details page; the registry also uses them for search.

## 13. **changelogs:** <Badge type="tip" text="new" />
  - Path to the changelog file documenting version updates and modifications. Only read when the attribute is present **and** the file exists, then rendered as markdown into the Changelog tab.

   ::: warning
   Make sure to include `changelogs.md` or whatever you named it, in the plugin zip. A missing file is not an error - the tab is simply empty.
   :::

## 14. **contributors:** <Badge type="tip" text="new" />
  - An array of objects containing details about project contributors.
  - Each object requires:
    - `name`: Contributor's name
    - `role`: Their role in the project
    - `github`: Their GitHub username
  - The author is always prepended to this list as `{ name: author, role: "Developer", github: authorGithub }`.

## 15. **repository:** <Badge type="tip" text="new" />
  - Github/Gitlab url of your plugin source(only for free plugins)

## 16. **permissions:** <Badge type="tip" text="new" />
  - Array of permission strings bound to your plugin's [`ctx`](./plugin-context.md). Acode itself reads this array **only** in the native `Tee` plugin, which copies the strings into a token-scoped list that `ctx.grantedPermission()` / `ctx.listAllPermissions()` echo back. No API is gated by it and there is no consent prompt.

## 17. **dependencies:** <Badge type="tip" text="new" />
  - Array of registry plugin **ids** this plugin needs. Before installing, Acode resolves each id from the registry, skips any already installed at an equal or newer version, recursively collects nested dependencies, then asks the user to confirm. Declaring an unknown id fails the install with `Unknown plugin dependency: <id>`. Dependencies are paid-aware: each is purchased through the same IAP flow before its own install.

## 18. **sku:** <Badge type="tip" text="new" />
  - Google Play in-app purchase product id. Required when `price > 0`; Acode looks it up with `iap.getProducts([sku])` and throws `Product not found` when it does not resolve. Free plugins do not need it.

## 19. **supported\_editor:** <Badge type="tip" text="new" />
  - Editor engine the plugin supports. Acode compares it against its own value (`config.SUPPORTED_EDITOR`, currently `"cm"`); anything other than a match or the literal `"all"` makes the details page display a legacy-editor warning. It never blocks loading.

## 20. **source:** <Badge type="tip" text="new" />
  - **Written by Acode, not by you.** When you install from a local `file:`/`content:`/`http(s):` zip, the installer stores that URL here so the plugin page can later check for registry updates. Ignore it in your own manifest.

## What Acode validates <Badge type="tip" text="new" />

Proven from `src/lib/installPlugin.js`:

| Check | Result when it fails |
| --- | --- |
| `plugin.json` present in the zip | Install throws `Invalid Plugin`; the plugin directory is deleted again. |
| `main` (or the `main.js` fallback) present in the zip | Install throws `Invalid Plugin`. |
| `icon` path present | Manifest patched to `icon.png`. |
| `readme` path present | Manifest patched to `readme.md`. |
| Unknown `dependencies` id | Install throws `Unknown plugin dependency: <id>`. |
| Any per-file write error | Logged per file (`Error processing file ...`) and skipped; install continues. |

On failure the installer clears the install state, deletes the plugin directory it created, and rethrows. Also note what it does to your archive: absolute paths (anything starting with `/`, `//`, or a Windows drive) are skipped with a warning, and `..`/`.` segments are resolved away, so the zip cannot write outside the plugin folder.

# Updating Plugins:

If you wish to publish an update for your plugin, follow these guidelines:

- **Version Increment:**
  - Increase the version number in the `plugin.json` file, keeping the strict `MAJOR.MINOR.PATCH` numeric format.

- **Update Information:**
  - For changes in name, description, icon, etc., upload a new zip file containing the updated `plugin.json`.
  - The installer is incremental: it hashes each entry and only rewrites files whose content changed, then deletes files that the new zip no longer contains. Renamed or removed files are therefore cleaned up on upgrade - keep the same ids and let the zip do the work.

- **Price Modification:**
  - If altering the plugin's price, update the `price` attribute in the `plugin.json` file and upload the new zip file.

## Attribute reference <Badge type="tip" text="new" />

| Attribute | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | Yes | Install folder name and registration key. Reverse-domain is conventional. |
| `name` | `string` | Yes | Display name; also the settings-page title. |
| `main` | `string` | Yes (effectively) | Entry script path. Optional as a key (falls back to `main.js`), but the file must exist in the zip. |
| `version` | `string` | Yes | Semver used for the registry update check. |
| `readme` | `string` | No | Path to the long description markdown. Falls back to `readme.md`. |
| `icon` | `string` | No | Path to the plugin icon. Falls back to `icon.png`. No size check in the app. |
| `files` | `string[]` | No | Packaging hint only - **ignored by the installer**. |
| `minVersionCode` | `number` | No | Minimum app versionCode. Enforced by the registry UI, not by the loader. |
| `price` | `number` | No | `> 0` marks the plugin paid. Currency comes from the registry / Play. |
| `sku` | `string` | Only when `price > 0` | Play IAP product id. |
| `author` | `{ name, email?, url?, github }` | Yes (in practice) | `name` and `github` are dereferenced unguarded on the details page. |
| `license` | `string` | No | SPDX-ish license name. |
| `keywords` | `string[]` | No | Search terms / tags. |
| `changelogs` | `string` | No | Path to changelog markdown. |
| `contributors` | `{ name, role, github }[]` | No | Extra people; the author is added automatically. |
| `repository` | `string` | No | Source URL, shown as an "open source" badge. |
| `permissions` | `string[]` | No | Free-form strings echoed back by `ctx`. Not enforced. |
| `dependencies` | `string[]` | No | Registry plugin ids to install alongside. |
| `supported_editor` | `string` | No | `"cm"`, `"ace"`, or `"all"`. Only drives a warning banner. |
| `source` | `string` | No (Acode-written) | Install URL for locally installed zips. Do not set by hand. |

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
  "minVersionCode": 1011,
  "price": 0,
  "license": "MIT",
  "keywords": ["foo", "bar"],
  "changelogs": "changelogs.md",
  "contributors": [
    {
      "name": "Example Contributor",
      "role": "Maintainer",
      "github": "example-contributor"
    }
  ],
  "repository": "https://github.com/example/example-plugin",
  "permissions": ["sync"],
  "supported_editor": "all",
  "author": {
    "name": "Example Author",
    "email": "example@email.com",
    "url": "https://example.com",
    "github": "example"
  }
}
```
:::

This example illustrates a basic `plugin.json` file. Notes on the values above:

- `minVersionCode: 1011` matches the current app build (`v1.13.5` in `config.xml`). Drop this attribute if you support older builds.
- `files` is kept for clarity only - the installer copies the whole zip regardless.
- `price: 0` (or omitting it) keeps the plugin free, so no `sku` is needed.
- `permissions` is a self-declaration echoed by [`ctx`](./plugin-context.md); it grants nothing by itself.

## Related

- [Plugin Context (`ctx`)](./plugin-context.md) - the consumer of `permissions`
- [Plugin Main File](./core-file.md) - the entry script named by `main`
- [Understanding How Plugins Work](../getting-started/understanding-plugin.md)
