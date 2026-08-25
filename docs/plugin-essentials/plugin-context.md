# Plugin Context (`ctx`)

The plugin context (`ctx`) is the third argument of the options object passed to your plugin's `init` function. It is a native-backed handle for your plugin that provides **encrypted secret storage** and **permission checks**.

Your `init` function receives it as `options.ctx`:

```js
function init(baseUrl, $page, options) {
  const ctx = options.ctx;
}
```

## Overview

`ctx` is a `PluginContext` instance (`src/lib/pluginContext.js`). It is created by Acode for **your plugin id only** and is backed by a cryptographically signed token issued by the native `Tee` plugin. Because of this:

- Secrets are scoped to your plugin id - another plugin cannot read them.
- The token is bound to the permissions declared in your `plugin.json` at install/load time.
- The object is `Object.freeze`d, so its properties cannot be replaced or extended.

### `created_at`, `uuid`, `toString()`

- `created_at` - timestamp (ms) when the context was created.
- `uuid` - the opaque token string for this context.
- `ctx.toString()` - returns the `uuid` string. The object coerces to the uuid for string operations (numeric coercion returns `NaN`).

```js
String(ctx) === ctx.uuid; // true
```

## Secrets

Secrets are key/value strings stored in an **EncryptedPreferenceManager** on the native side (scoped to your plugin id). They survive app restarts. Use them for API tokens, oauth state, or other sensitive data - never store secrets in `localStorage`.

### `getSecret(key, defaultValue = ""): Promise<string>`

Resolves the stored value for `key`, or `defaultValue` when the key has not been set.

```js
const token = await ctx.getSecret("github_token", "");
if (!token) {
  await ctx.setSecret("github_token", "ghp_...");
}
```

### `setSecret(key, value): Promise<void>`

Stores `value` for `key`.

```js
await ctx.setSecret("access_token", "abc123");
```

### `deleteSecret(key): Promise<void>`

Removes a single key.

```js
await ctx.deleteSecret("access_token");
```

### `clearAllSecrets(): Promise<void>`

Removes every secret stored for your plugin.

```js
await ctx.clearAllSecrets();
```

## Permissions

Permissions are declared in your `plugin.json` as an array:

```json
{
  "id": "com.example.plugin",
  "main": "dist/main.js",
  "permissions": ["read", "write"]
}
```

The list is bound to your context's token when the plugin loads. The native side grants exactly the permissions listed; there is no runtime "request" dialog - a permission either is or is not present.

### `grantedPermission(permission): Promise<boolean>`

Resolves `true` when your plugin was granted `permission`.

```js
if (await ctx.grantedPermission("write")) {
  // do something privileged
}
```

### `listAllPermissions(): Promise<string[]>`

Resolves the full list of permissions granted to your plugin.

```js
const permissions = await ctx.listAllPermissions();
```

## Full example

```js
function init(baseUrl, $page, options) {
  const ctx = options.ctx;

  (async () => {
    console.log("permissions:", await ctx.listAllPermissions());

    if (await ctx.grantedPermission("api-access")) {
      const token = await ctx.getSecret("api_token");
      if (!token) {
        await ctx.setSecret("api_token", prompt("Enter API token"));
      }
    }
  })();
}
```

## Notes

- `ctx.invalidate()` exists but is used internally by Acode; plugins do not need to call it.
- If the trusted native session is not available (for example the token request fails), `ctx` may be `null` - guard against it if your plugin depends on it.
- Secrets are encrypted at rest and scoped per plugin id.

## Related

- [Manifest (`plugin.json`)](./manifest.md) - declaring `permissions`
- [Core File](./core-file.md) - where `ctx` is passed to `init`
