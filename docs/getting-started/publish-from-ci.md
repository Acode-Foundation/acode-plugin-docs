---
lang: en-US
title: Publish from CI
description: Publish plugin updates automatically with an Acode API key, from GitHub Actions or any script.
---

# Publish from CI

Instead of uploading every release by hand on [acode.app](https://acode.app), you can publish from GitHub Actions or any other CI with an **API key**. A key only does what you allow it to, always expires, and can be revoked at any time.

## 1. Create an API key

1. Sign in on acode.app and open [API keys](https://acode.app/api-keys). You can also get there from the account menu.
2. Select **New key** and give it a name that says where it is used, such as `GitHub Actions`.
3. Choose an expiration. Keys always expire, after 7 days at the shortest and 1 year at the longest.
4. Choose permissions:

   | Permission | Scope | Allows |
   | --- | --- | --- |
   | Publish updates | `plugin:publish` | Uploading new versions of the plugins you select. All of your plugins are selected by default. |
   | Submit plugins | `plugin:create` | Submitting new plugins for review. Off by default. |

5. Select **Continue** and enter the code sent to your email. The code only approves the settings you saw, so changing any of them needs a new code.
6. Copy the key. **It is shown only once.** Keys start with `acode_`.

::: warning A key is a password
Anyone with the key can publish to the plugins it covers. Store it only in your CI's secret storage, never in the repository or in logs.
:::

## 2. Publish with GitHub Actions

Add the key to your repository as a secret named `ACODE_API_KEY` (**Settings → Secrets and variables → Actions**), then use the official [publish-plugin](https://github.com/Acode-Foundation/publish-plugin) action after your build step:

```yaml
name: Publish to Acode

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: npm ci
      - run: npm run build # writes plugin.zip

      - uses: Acode-Foundation/publish-plugin@v1
        with:
          api-key: ${{ secrets.ACODE_API_KEY }}
```

Before each release, increase `version` in [`plugin.json`](../plugin-essentials/manifest.md#version). acode.app rejects an upload whose version isn't greater than the current one.

| Input | Default | Description |
| --- | --- | --- |
| `api-key` | required | Your API key, passed from a secret. |
| `zip` | `plugin.zip` | Path to the built zip. The official templates write `plugin.zip` at the repo root. |
| `changelogs` | | Optional. Leave it out to use the changelog file in the zip. Set it to publish different text, such as your GitHub release notes. |
| `create-if-missing` | `false` | Submit the plugin as new if it doesn't exist yet. Needs the **Submit plugins** permission. |

Changelogs come from the zip by default, just like a website upload: the file named by [`changelogs`](../plugin-essentials/manifest.md#changelogs) in `plugin.json`, or `changelogs.md`. The official templates already pack it, so keeping that file up to date is enough.

The action sets a `result` output: `published` when the version is live, `review` when the security scan held it for an admin, or `submitted` for a new plugin waiting for approval. See the [action's README](https://github.com/Acode-Foundation/publish-plugin#readme) for all options.

## Other CI and scripts

Any tool that can send an HTTP request works. Send the key in the `Authorization` header and the zip as a multipart field named `plugin`:

::: code-group
```sh [Publish an update]
curl --fail-with-body -X PUT https://acode.app/api/plugin \
  -H "Authorization: Bearer $ACODE_API_KEY" \
  -F "plugin=@plugin.zip" \
  --form-string "changelogs=Fixed a bug"
```

```sh [Submit a new plugin]
curl --fail-with-body -X POST https://acode.app/api/plugin \
  -H "Authorization: Bearer $ACODE_API_KEY" \
  -F "plugin=@plugin.zip"
```
:::

The key is only accepted in the `Authorization` header, never in cookies or the URL.

| Status | Meaning |
| --- | --- |
| `200` | Published. If the JSON has `"review": true`, the version was held for review instead. |
| `400` | The zip or `plugin.json` is invalid, or the version isn't greater than the current one. The `error` field says why. |
| `401` | The key is invalid, revoked or expired. |
| `403` | The key lacks the permission or doesn't cover this plugin. `"code": "plugin_not_found"` means the plugin doesn't exist yet, so submit it with `POST` first. |
| `429` | Too many uploads. Wait and try again. |

## What a key can't do

- **Change prices.** Uploads that change `price`, and new paid plugins, are refused. Make pricing changes on the website.
- **Skip review.** Updates to published plugins are scanned exactly like uploads from the website, and new plugins wait for admin approval.
- **Touch your account.** Keys can't change your profile, payments or other keys.
- **Cover future plugins.** A key only covers the plugins it was created with, plus any plugin it submits itself when it also has **Publish updates**.

## Keeping keys safe

- Every publish made with a key is emailed to you with the key name and the IP address it came from. If you don't recognise one, revoke the key at once.
- Use a separate key per repository or workflow, so revoking one doesn't break the others.
- Before a key expires, create a new one and update the secret. The [API keys](https://acode.app/api-keys) page shows when each key was last used and when it expires.
