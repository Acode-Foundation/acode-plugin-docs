import { join } from "node:path";
import { defineConfig } from "vitepress";
import { HEIGHT, type OgCard, WIDTH, writeOgImage } from "./og";

const SITE_URL = "https://docs.acode.app";
const DEFAULT_IMAGE = "og/default.jpg";
const DEFAULT_CARD: OgCard = {
	title: "Documentation",
	subtitle: "Guides, plugin APIs and tutorials for the Acode editor",
};
// Pages in these folders get their own share image showing the page title.
const SECTIONS: Record<string, string> = {
	docs: "Plugin docs",
	"user-guide": "User guide",
	tutorials: "Tutorials",
};
// Filled while pages render, then drawn once the build is done.
const ogCards = new Map<string, OgCard>();

function plainText(html: string) {
	return html
		.replace(/<[^>]*>/g, "")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, "&")
		.replace(/\s+/g, " ")
		.trim();
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
	lastUpdated: true,
	cleanUrls: true,
	base: "/",
	srcExclude: ["Readme.md"],
	// Dark by default to match acode.app; the theme toggle still offers light.
	appearance: "dark",
	head: [
		["link", { rel: "icon", href: "/acode.png" }],
		[
			"link",
			{
				rel: "preload",
				href: "/fonts/instrumentsans.woff2",
				as: "font",
				type: "font/woff2",
				crossorigin: "",
			},
		],
	],

	transformHead({ pageData, title, description }) {
		const page = pageData.relativePath.replace(/\.md$/, "");
		const section = SECTIONS[page.split("/")[0]];
		const heading = plainText(pageData.title);
		const hasCard = Boolean(section && heading);
		const image = hasCard ? `og/${page}.jpg` : DEFAULT_IMAGE;
		if (hasCard) ogCards.set(image, { title: heading, subtitle: section });
		const imageUrl = `${SITE_URL}/${image}`;
		const alt = hasCard ? `${heading} · Acode Docs` : "Acode Docs";
		return [
			["meta", { property: "og:type", content: "website" }],
			["meta", { property: "og:site_name", content: "Acode Docs" }],
			["meta", { property: "og:title", content: title }],
			["meta", { property: "og:description", content: description }],
			[
				"meta",
				{
					property: "og:url",
					content: `${SITE_URL}/${page.replace(/(^|\/)index$/, "$1")}`,
				},
			],
			["meta", { property: "og:image", content: imageUrl }],
			["meta", { property: "og:image:type", content: "image/jpeg" }],
			["meta", { property: "og:image:width", content: String(WIDTH) }],
			["meta", { property: "og:image:height", content: String(HEIGHT) }],
			["meta", { property: "og:image:alt", content: alt }],
			["meta", { name: "twitter:card", content: "summary_large_image" }],
			["meta", { name: "twitter:image", content: imageUrl }],
			["meta", { name: "twitter:image:alt", content: alt }],
		];
	},

	async buildEnd({ outDir }) {
		await Promise.all(
			[[DEFAULT_IMAGE, DEFAULT_CARD] as const, ...ogCards].map(([file, card]) =>
				writeOgImage(join(outDir, file), card),
			),
		);
	},

	locales: {
		root: {
			label: "English",
			lang: "en-US",
			title: "Acode Docs",
			description: "Documentation for new users and developers",
			themeConfig: {
				nav: [
					{ text: "Home", link: "/" },
					{ text: "User Guide", link: "/user-guide/" },
					{ text: "Plugin Docs", link: "/docs" },
					{ text: "Tutorials", link: "/tutorials" },
				],
				sidebar: {
					"/user-guide/": [
						{
							text: "User Guide",
							items: [
								{ text: "Overview", link: "/user-guide/" },
								{
									text: "Command Palette",
									link: "/user-guide/command-palette",
								},
								{ text: "File Browser", link: "/user-guide/file-browser" },
								{ text: "Search", link: "/user-guide/search" },
								{ text: "Remote Access", link: "/user-guide/remote-access" },
								{ text: "Plugins", link: "/user-guide/plugins" },
								{ text: "Terminal", link: "/user-guide/terminal" },
								{
									text: "Language Servers",
									link: "/user-guide/language-servers",
								},
								{
									text: "Settings",
									link: "/user-guide/settings",
									collapsed: true,
									items: [
										{
											text: "App Settings",
											link: "/user-guide/settings/app-settings",
										},
										{
											text: "Editor Settings",
											link: "/user-guide/settings/editor-settings",
										},
										{
											text: "Terminal Settings",
											link: "/user-guide/settings/terminal-settings",
										},
										{
											text: "Preview Settings",
											link: "/user-guide/settings/preview-settings",
										},
										{
											text: "Formatter",
											link: "/user-guide/settings/formatter",
										},
										{ text: "Themes", link: "/user-guide/settings/themes" },
										{
											text: "Backup & Restore",
											link: "/user-guide/settings/backup-restore",
										},
									],
								},
								{ text: "Keybindings", link: "/user-guide/keybindings" },
								{ text: "QuickTools", link: "/user-guide/quicktools" },
							],
						},
					],
					"/docs/": [
						{
							text: "Getting Started",
							collapsed: true,
							items: [
								{ text: "Introduction", link: "/docs/getting-started/intro" },
								{
									text: "Create new plugin",
									link: "/docs/getting-started/create-plugin",
								},
								{
									text: "Understanding Plugins",
									link: "/docs/getting-started/understanding-plugin",
								},
								{
									text: "Publish from CI",
									link: "/docs/getting-started/publish-from-ci",
								},
							],
						},
						{
							text: "Plugin Essentials",
							collapsed: true,
							items: [
								{
									text: "Manifest",
									link: "/docs/plugin-essentials/manifest",
								},
								{
									text: "Core File",
									link: "/docs/plugin-essentials/core-file",
								},
								{
									text: "Plugin Context (ctx)",
									link: "/docs/plugin-essentials/plugin-context",
								},
							],
						},
						{
							text: "Global APIs",
							collapsed: true,
							items: [
								{
									text: "CodeMirror & Legacy Ace",
									link: "/docs/global-apis/ace",
								},
								{
									text: "Acode",
									link: "/docs/global-apis/acode",
								},
								{
									text: "Added Folder",
									link: "/docs/global-apis/added-folder",
								},
								{
									text: "EditorManager",
									link: "/docs/global-apis/editor-manager",
								},
								{
									text: "Other Global Utilities",
									link: "/docs/global-apis/global-utilities",
								},
							],
						},
						{
							text: "UI Components",
							collapsed: true,
							items: [
								{
									text: "Dialogs",
									collapsed: true,
									items: [
										{
											text: "Alert",
											link: "/docs/ui-components/dialogs/alert",
										},
										{
											text: "Confirm",
											link: "/docs/ui-components/dialogs/confirm",
										},
										{
											text: "Color Picker",
											link: "/docs/ui-components/dialogs/color-picker",
										},
										{
											text: "Loader",
											link: "/docs/ui-components/dialogs/loader",
										},
										{
											text: "Multi Prompt",
											link: "/docs/ui-components/dialogs/multi-prompt",
										},
										{
											text: "Prompt",
											link: "/docs/ui-components/dialogs/prompt",
										},
										{
											text: "Select",
											link: "/docs/ui-components/dialogs/select",
										},
										{
											text: "Custom Dialog",
											link: "/docs/ui-components/dialogs/custom-dialog",
										},
									],
								},
								{
									text: "Toast",
									link: "/docs/ui-components/toast",
								},
								{
									text: "Tutorial",
									link: "/docs/ui-components/tutorial",
								},
								{
									text: "Selection Menu",
									link: "/docs/ui-components/selection-menu",
								},
							],
						},
						{
							text: "Utilities",
							collapsed: true,
							items: [
								{
									text: "File System(fs)",
									link: "/docs/utilities/fs",
								},
								{
									text: "URL",
									link: "/docs/utilities/url",
								},
								{
									text: "Projects",
									link: "/docs/utilities/projects",
								},
								{
									text: "Commands",
									link: "/docs/utilities/commands",
								},
								{
									text: "CodeMirror packages",
									link: "/docs/utilities/codemirror",
								},
								{
									text: "Editor Languages",
									link: "/docs/utilities/ace-modes",
								},
								{
									text: "Editor Themes",
									link: "/docs/utilities/editor-themes",
								},
								{
									text: "File Icons",
									link: "/docs/utilities/file-icons",
								},
								{
									text: "Code Highlight",
									link: "/docs/utilities/code-highlight",
								},
								{
									text: "Encoding",
									link: "/docs/utilities/encoding",
								},
								{
									text: "OpenFolder",
									link: "/docs/utilities/open-folder",
								},
								{
									text: "Keyboard",
									link: "/docs/utilities/keyboard",
								},
								{
									text: "CreateKeyboardEvent",
									link: "/docs/utilities/keyboard-event",
								},
								{
									text: "Window Resize",
									link: "/docs/utilities/window-resize",
								},
								{
									text: "Fullscreen and Orientation",
									link: "/docs/utilities/fullscreen-orientation",
								},
							],
						},
						{
							text: "Editor Components",
							collapsed: true,
							items: [
								{
									text: "File Browser",
									link: "/docs/editor-components/file-browser",
								},
								{
									text: "Editor File",
									link: "/docs/editor-components/editor-file",
								},
								{
									text: "File List",
									link: "/docs/editor-components/file-list",
								},
								{
									text: "File Index",
									link: "/docs/editor-components/file-index",
								},
								{
									text: "Page",
									link: "/docs/editor-components/page",
								},
								{
									text: "Palette",
									link: "/docs/editor-components/palette",
								},
								{
									text: "Settings",
									link: "/docs/editor-components/settings",
								},
							],
						},
						{
							text: "Helpers",
							collapsed: true,
							items: [
								{
									text: "Input Hints",
									link: "/docs/helpers/input-hints",
								},
								{
									text: "Fonts",
									link: "/docs/helpers/fonts",
								},
								{
									text: "Themes",
									link: "/docs/helpers/themes",
								},
								{
									text: "Theme Builder",
									link: "/docs/helpers/theme-builder",
								},
								{
									text: "Color",
									link: "/docs/helpers/color",
								},
							],
						},
						{
							text: "Interface APIs",
							collapsed: true,
							items: [
								{
									text: "SideBar Apps",
									link: "/docs/interface-apis/sidebar-apps",
								},
								{
									text: "Side Buttons",
									link: "/docs/interface-apis/side-buttons",
								},
								{
									text: "Context Menu",
									link: "/docs/interface-apis/context-menu",
								},
							],
						},
						{
							text: "Advanced APIs",
							collapsed: true,
							items: [
								{
									text: "Terminal",
									link: "/docs/advanced-apis/terminal",
								},
								{
									text: "Executor",
									link: "/docs/advanced-apis/executor",
								},
								{
									text: "System",
									link: "/docs/advanced-apis/system",
								},
								{
									text: "LSP",
									link: "/docs/advanced-apis/lsp",
								},
								{
									text: "File Handlers",
									link: "/docs/advanced-apis/file-handlers",
								},
								{
									text: "Action Stack",
									link: "/docs/advanced-apis/action-stack",
								},
								{
									text: "Intent",
									link: "/docs/advanced-apis/intent",
								},
								{
									text: "WebView",
									link: "/docs/advanced-apis/webview",
								},
							],
						},
					],
					"/tutorials/": [
						{
							text: "Command Palette",
							link: "/tutorials/command-palette",
						},
						{
							text: "How to run java",
							link: "/tutorials/how-to-run-java",
						},
					],
				},
			},
		},
	},
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		logo: "/acode.png",
		footer: {
			message: "Released under the MIT License.",
			copyright:
				'Copyright © 2025 <a class="link" href="//acode.app">Acode</a>',
		},
		search: {
			provider: "local",
		},
		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/Acode-Foundation/acode-plugin-docs",
			},
			{ icon: "discord", link: "https://discord.gg/nDqZsh7Rqz" },
		],
		editLink: {
			pattern:
				"https://github.com/Acode-Foundation/acode-plugin-docs/edit/main/:path",
			text: "Edit this page on GitHub",
		},
	},
});
