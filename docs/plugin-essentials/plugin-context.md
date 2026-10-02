# Plugin Context (`ctx`)

The plugin context (`ctx`) is a property of the **third argument** (`options`) that Acode passes to your plugin's `init` function. It is a native-backed handle for your plugin that provides **encrypted secret storage** and **permission checks**.

Your `init` function receives it as `options.ctx`:

```js
function init(baseUrl, $page, options) {
  const ctx = options.ctx; // may be null
}
```

The complete argument list is `(baseUrl, $page, options)` - see [Plugin Main File](./core-file.md). Acode builds that `options` object itself in `src/lib/loadPlugin.js`, where `ctx` is the result of `await generatePluginContext(pluginId, JSON.stringify(pluginJson))`. In other words, `ctx` is created for **your plugin id**, from the `plugin.json` that is installed on disk.

## Overview

`ctx` is a `PluginContext` instance (`src/lib/pluginContext.js`). Acode mints it through the native Cordova plugin `Tee` (`src/plugins/pluginContext/src/android/Tee.java`). The loader first opens a **trusted native session** (`establishConnection`) *before* your script tag is even appended, and only that session may request a token (`requestToken`). The token is a 256-bit hex secret from `SecureRandom`. Because of this:

- Secrets are scoped to your plugin id - another plugin cannot read them.
- The token is bound to the permissions declared in your `plugin.json` at load time - the whole manifest is JSON-encoded and handed to the native side, which reads its `permissions` array.
- The instance is `Object.freeze`d in its constructor, and `PluginContext.prototype` is frozen too, so neither the properties nor the methods can be replaced or extended.

::: warning `ctx` can be `null`
If the trusted session cannot be established, or the token request fails, `generatePluginContext` returns `null` and logs `PluginContext creation failed for pluginId ...`. It never throws at load time - but `options.ctx` is then `null`, so **always guard before use**.
:::

### `date`, `toString()`, and coercion

- `date` - the `Date.now()` value captured when the context was constructed (milliseconds since the epoch). The object is frozen right after, so it never changes.
- `toString()` - returns the token string for this context.
- `Symbol.toPrimitive` - string coercion returns that same token, so the object stringifies to it. Numeric coercion deliberately returns `NaN`.
- There is **no `uuid` property**. The token lives in a private field (`#token`), so `ctx.uuid` is `undefined`. Read it through `toString()` if you truly need it - normally you should not.

```js
String(ctx) === ctx.toString(); // true
Number(ctx); // NaN
```

## Secrets

Secrets are key/value strings stored in an **`EncryptedPreferenceManager`** on the native side, in an Android `SharedPreferences` file whose name **is your plugin id** (`new EncryptedPreferenceManager(context, pluginId)` in `Tee.java`). They survive app restarts. Use them for API tokens, oauth state, or other sensitive data - never store secrets in `localStorage`.

Every secret method is **asynchronous**: each one wraps a Cordova `exec` call in a `Promise`, so `await` is mandatory.

::: info How the values are protected
`EncryptedPreferenceManager` builds an `EncryptedSharedPreferences` with an AES256-GCM master key, encrypting keys with **AES256-SIV** and values with **AES256-GCM**. Both keys and values are encrypted at rest.

Caveat visible in that same source: if the crypto library throws, the constructor falls back to a plain `SharedPreferences` file (`allowPlaintextFallback` defaults to `true`). Treat secrets as protected, not as a substitute for keeping them out of logs, crash reports, and screenshots.
:::

### `getSecret(key, defaultValue = ""): Promise<string>`

Resolves the stored value for `key`, or `defaultValue` when the key has not been set. The default is applied natively (`prefs.getString(key, defaultValue)`), so an unset key resolves to `""` unless you pass something else. A `null`/`undefined` result is never returned - you always get a string.

```js
const token = await ctx.getSecret("github_token", "");
if (!token) {
  await ctx.setSecret("github_token", "ghp_...");
}
```

### `setSecret(key, value): Promise<void>`

Stores `value` for `key`. The write is applied through `SharedPreferences.Editor.apply()`, and the native side answers with an empty success, so the promise resolves with **no value**.

```js
await ctx.setSecret("access_token", "abc123");
```

### `deleteSecret(key): Promise<void>`

Removes a single key. Resolves with no value.

```js
await ctx.deleteSecret("access_token");
```

### `clearAllSecrets(): Promise<void>`

Removes every secret stored under your plugin id. Resolves with no value.

```js
await ctx.clearAllSecrets();
```

### When a secret call rejects

The native side rejects with an error string instead of a value. The one you can actually hit at runtime is `INVALID_TOKEN`, which means the token behind `ctx` is no longer in the native token store - for example after `ctx.invalidate()` was called, or after the plugin id was re-tokenized. `INVALID_SESSION` and `INVALID_PLUGIN_JSON` can only occur while the context is being created, and in those cases you get `ctx === null` rather than a rejected promise.

::: danger Wrap secret access in try/catch
A rejected secret call is an unhandled rejection unless you handle it, and it will take down whatever `init`/callback it happened in. Treat every `ctx` call as fallible.
:::

## Permissions

::: warning Permissions are not enforced yet
Nothing in Acode's JavaScript gates a capability on the `permissions` array. No Acode API is unlocked or blocked by it, and no consent dialog is shown to the user.

What the native side does with it is much narrower: when the loader requests a token, `Tee.java` copies the strings from your manifest's `permissions` array into an in-memory list bound to that token, and that is the entire implementation. So `ctx.grantedPermission()` and `ctx.listAllPermissions()` simply echo what you wrote in your own `plugin.json` - they report a self-declaration, not a grant that Acode has checked. Do not rely on `permissions` for security; treat it as reserved for future use.
:::

Permissions are declared in your `plugin.json` as an array:

```json
{
  "id": "com.example.plugin",
  "main": "dist/main.js",
  "permissions": ["read", "write"]
}
```

The list is bound to your context's token every time the plugin loads (`requestToken` re-reads the manifest), so there is no runtime "request" dialog - a permission either is or is not present.

### Valid permission strings

There is **no fixed list of valid permission strings** anywhere in Acode's source. `Tee.java` reads `permissions` with `optJSONArray`, appends every element as-is to a `List<String>`, and compares with `List.contains`. Any string is accepted, including empty ones; anything you did not declare always fails the check. The names are yours to choose and are only meaningful to your own plugin, e.g.:

```json
{ "permissions": ["sync", "sync:write", "network"] }
```

### `grantedPermission(permission): Promise<number>`

Takes a single permission string and resolves **`1` when granted, `0` when not** - the native side answers `callback.success(granted ? 1 : 0)`. It does **not** resolve a boolean, so `=== true` will never match. Truthiness works:

```js
if (await ctx.grantedPermission("sync:write")) {
  // do something privileged
}
```

### `listAllPermissions(): Promise<string[]>`

Resolves a copy of the full list of permission strings bound to your token, in manifest order. An empty array means the token is bound to no permissions at all.

```js
const permissions = await ctx.listAllPermissions(); // string[]
```

## Full example

```js
import plugin from "../plugin.json";

if (window.acode) {
  acode.setPluginInit(plugin.id, async (baseUrl, $page, options) => {
    const ctx = options.ctx;

    try {
      if (!ctx) {
        // Trusted native session unavailable - degrade gracefully.
        console.warn("PluginContext unavailable; running without secrets.");
        return;
      }

      console.log("declared permissions:", await ctx.listAllPermissions());

      // Resolves 1 or 0 - use truthiness, never `=== true`.
      if (!await ctx.grantedPermission("sync")) {
        console.warn('Add "sync" to permissions in plugin.json to enable syncing.');
        return;
      }

      let token = await ctx.getSecret("api_token");
      if (!token) {
        token = await acode.prompt("API token", "", "text"); // null if cancelled
        if (!token) return;
        await ctx.setSecret("api_token", token);
      }

      // Never log the token itself.
      console.log("token stored, length:", String(token).length);
    } catch (error) {
      // INVALID_TOKEN and friends land here.
      console.error("PluginContext error:", error);
    }
  });
}
```

## Full `ctx` surface <Badge type="tip" text="new" />

That is the entire public surface of `PluginContext` in `src/lib/pluginContext.js`. There is no file picker, no `http`, no notification, no device-info and no app-version member on `ctx` - those live elsewhere:

| You want | Use instead |
| --- | --- |
| Read/write files | `acode.require("fs")` |
| Ask the user for input | `acode.prompt(...)` / `acode.require("prompt")` |
| Show a notification | `acode.pushNotification(...)` |
| App version / versionCode | the global `BuildInfo` object |
| Android storage permissions | the global `system` module (`system.hasPermission(...)`) |

| Member | Signature | Returns | Notes |
| --- | --- | --- | --- |
| `date` | `number` (readonly) | - | `Date.now()` at construction. Frozen. Not `created_at`. |
| `toString()` | `() => string` | The opaque token | Also used by string coercion. |
| `[Symbol.toPrimitive]` | `(hint) => string \| NaN` | Token, or `NaN` for `"number"` | Blocks numeric coercion. |
| `getSecret` | `(key: string, defaultValue?: string = "") => Promise<string>` | Stored value or the default | Never rejects on a missing key. |
| `setSecret` | `(key: string, value: string) => Promise<void>` | Nothing | Write is asynchronous natively (`apply()`). |
| `deleteSecret` | `(key: string) => Promise<void>` | Nothing | Removes one key. |
| `clearAllSecrets` | `() => Promise<void>` | Nothing | Clears your plugin id's whole store. |
| `grantedPermission` | `(permission: string) => Promise<number>` | `1` or `0` | Not a boolean. |
| `listAllPermissions` | `() => Promise<string[]>` | Copy of the permission list | Order follows `plugin.json`. |
| `invalidate` | `() => Promise<void>` | Nothing | Internal. Drops the token natively; later calls reject with `INVALID_TOKEN`. |

## Security <Badge type="tip" text="new" />

- **Scoped per plugin id.** Secrets live in a preferences file named after your plugin id, and every call carries a token that the native side maps back to that id using a constant-time comparison. Another plugin cannot read your keys through `ctx`.
- **Never log, echo, or stringify secrets.** `String(ctx)` returns the token that authorises every secret read - treat the token as a credential. Never put `token`/`ctx.toString()` in `console.log`, `toast`, `alert`, telemetry, or an error message. `localStorage` and the plugin `cacheFile` are not encrypted - keep secrets out of both.
- **`ctx` is only valid while the plugin is loaded.** The token lives in memory in the native plugin and is dropped when the WebView is reset (navigation or reload), which also invalidates the trusted session that mints new tokens. A retained `ctx` can therefore stop working, and a plugin loaded after such a reset can receive `ctx === null`. Re-acquire it from `options.ctx` on every `init` and handle rejection.
- **The bridge is hardened.** Before any plugin script runs, Acode makes `cordova.exec`, `callbackFromNative`, `callbackSuccess`, `callbackError` and `callbacks` non-writable and non-configurable, so a plugin cannot hijack the bridge that `ctx` travels over. The token itself is a private class field and both the instance and prototype are frozen.
- **`permissions` is not a security boundary.** See the warning above.

## Notes

- `ctx.invalidate()` exists but is marked in source as "plugins dont need to call this"; Acode calls it internally.
- If the trusted native session is not available, `ctx` is `null` rather than a rejected promise - guard against it if your plugin depends on it.
- Secrets are encrypted at rest (with a plaintext fallback path) and scoped per plugin id.

## Related

- [Manifest (`plugin.json`)](./manifest.md)
- [Core File](./core-file.md) - where `ctx` is passed to `init`
