---
lang: en-US
title: Plugin badges and public stats
description: Add live download, rating, version and last-updated badges to your plugin README, or fetch compact public JSON stats without an API key.
---

# Plugin badges and public stats

Show your plugin's downloads, approval rating, version and last update in its description, GitHub README or website. Each badge is an SVG image served by Acode, so the same URL keeps working as your stats change.

The public JSON endpoint lets you use those values in your own tools. **No account, API key or cookie is required.** Only approved plugins are available, including approved paid plugins.

## Add badges to a README

Replace **every** `your.plugin.id` below with the `id` from your [`plugin.json`](../plugin-essentials/manifest.md#id), not the display name. Paste the Markdown into your README or plugin description:

```markdown
[![Downloads](https://acode.app/api/plugin-stats/your.plugin.id/downloads.svg)](https://acode.app/plugin/your.plugin.id)
[![Rating](https://acode.app/api/plugin-stats/your.plugin.id/rating.svg)](https://acode.app/plugin/your.plugin.id)
[![Version](https://acode.app/api/plugin-stats/your.plugin.id/version.svg)](https://acode.app/plugin/your.plugin.id)
[![Last updated](https://acode.app/api/plugin-stats/your.plugin.id/updated.svg)](https://acode.app/plugin/your.plugin.id)
```

Use all four or keep just the badges you need. Clicking a badge opens your plugin's store page.

| Badge | Image URL | Display |
| --- | --- | --- |
| Downloads | `https://acode.app/api/plugin-stats/your.plugin.id/downloads.svg` | Recorded download count, such as `12,345` |
| Rating | `https://acode.app/api/plugin-stats/your.plugin.id/rating.svg` | Positive-vote percentage, such as `96%`, or `unrated` |
| Version | `https://acode.app/api/plugin-stats/your.plugin.id/version.svg` | Published version, such as `1.2.3` |
| Last updated | `https://acode.app/api/plugin-stats/your.plugin.id/updated.svg` | Package release date in UTC, such as `2026-11-18` |

For a website, use the same URL in an image tag:

```html
<a href="https://acode.app/plugin/your.plugin.id">
  <img
    src="https://acode.app/api/plugin-stats/your.plugin.id/downloads.svg"
    alt="Plugin downloads"
  />
</a>
```

## Fetch public JSON

```sh
curl --fail https://acode.app/api/plugin-stats/your.plugin.id
```

Example response (illustrative values):

```json
{
  "id": "your.plugin.id",
  "name": "Example Plugin",
  "version": "1.2.3",
  "downloads": 12345,
  "votes_up": 24,
  "votes_down": 1,
  "rating": 96,
  "updated_at": "2026-11-18T04:30:00.000Z"
}
```

| Field | Meaning |
| --- | --- |
| `id`, `name` | Plugin ID and display name. |
| `version` | Published version. An update awaiting review does not change it. |
| `downloads` | Numeric download count recorded by the store; this is not a count of currently active users. |
| `votes_up`, `votes_down` | Numeric positive and negative vote counts. |
| `rating` | `Math.round(votes_up / (votes_up + votes_down) * 100)`, or `null` when there are no votes. A rating of `0` is valid. |
| `updated_at` | Package release timestamp in UTC, falling back to the listing's creation time. `null` if neither is available. Ordinary listing edits do not change this release timestamp. |

Browser requests work from any origin without credentials:

```js
const pluginId = "your.plugin.id";
const response = await fetch(
  `https://acode.app/api/plugin-stats/${encodeURIComponent(pluginId)}`,
  { credentials: "omit" },
);

if (!response.ok) {
  throw new Error(`Plugin stats request failed: ${response.status}`);
}

const stats = await response.json();
const rating = stats.rating === null ? "Unrated" : `${stats.rating}%`;
console.log(`${stats.name}: ${stats.downloads} downloads, ${rating}`);
```

This is a read-only API. To upload a release, see [Publish from CI](./publish-from-ci.md).

## Refresh timing

Badge images and JSON responses are cached for **five minutes**. GitHub and other image proxies can keep their own cached copies for longer. Keep the URL stable; you do not need to regenerate a badge or add a cache-busting parameter when publishing an update.

If your tool polls the JSON endpoint, an interval of at least five minutes is sufficient. The endpoint supports `ETag` revalidation and can return `304 Not Modified` when its response has not changed. Browser clients can read the `ETag` and `Retry-After` headers; cross-origin preflights allow `If-None-Match`, `Cache-Control` and `Pragma` for GET/HEAD requests.

Link previews use a separate Open Graph image. Sharing `https://acode.app/plugin/your.plugin.id` gives supported chat and social apps a preview with the plugin's version, downloads and rating. Those images are cached for **two days**, then refreshed in the background when requested. Preview URLs use a stable release token, so downloads and votes do not change the URL. A new release or a changed `v`/`r` query parameter does not bypass the two-day server cache. Social apps may retain previews for longer, so use the badges or JSON when you need fresher stats.

## Errors and troubleshooting

| HTTP status | Meaning |
| --- | --- |
| `400` | Unknown badge name. Use `downloads`, `rating`, `version` or `updated`. |
| `404` | Unknown/invalid plugin ID, or a plugin that is pending, rejected or deleted. |
| `429` | Too many requests from this IP. Respect the `Retry-After` response header. |
| `503` | Stats are temporarily unavailable. Retry later. |

JSON errors have an `error` field, for example `{"error":"Plugin not found"}`. Badge errors are SVG images containing a short error message, with the corresponding HTTP status. Error responses are not cached by the server's HTTP policy.

The stats API allows up to 600 requests per minute per IP, shared across JSON and badge URLs. OG images have a separate limit of 600 requests per minute per IP. These are process-local limits and may be shared by users on the same network. OG generation also has a concurrency limit; a busy server may return `503` with `Retry-After: 5`, while already cached images can still be served. Waiting and generation together have a 15-second deadline; timed-out requests also return `503`.

If a badge does not load, check the ID and confirm the plugin is approved. Use an absolute `https://acode.app/api/plugin-stats/...` URL, and make sure the place where you embed it supports remote SVG images. The updated badge shows `unknown` if no release date is available.
