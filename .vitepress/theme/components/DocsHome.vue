<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedVariables: used in the template
const sections = [
	{
		eyebrow: "PLUGINS",
		title: "Plugin docs",
		text: "Create, test and publish plugins with the full Acode API.",
		link: "/docs/getting-started/intro",
	},
	{
		eyebrow: "GUIDE",
		title: "User guide",
		text: "Files, terminal, remote access, settings and keybindings.",
		link: "/user-guide/",
	},
	{
		eyebrow: "TUTORIALS",
		title: "Tutorials",
		text: "Step-by-step walkthroughs for common setups.",
		link: "/tutorials/",
	},
];

// biome-ignore lint/correctness/noUnusedVariables: used in the template
const references = [
	{
		title: "Manifest",
		code: "plugin.json",
		link: "/docs/plugin-essentials/manifest",
	},
	{
		title: "Plugin context",
		code: "ctx",
		link: "/docs/plugin-essentials/plugin-context",
	},
	{ title: "Acode", code: "acode", link: "/docs/global-apis/acode" },
	{
		title: "EditorManager",
		code: "editorManager",
		link: "/docs/global-apis/editor-manager",
	},
	{
		title: "Commands",
		code: "acode.require('commands')",
		link: "/docs/utilities/commands",
	},
	{
		title: "Terminal",
		code: "acode.require('terminal')",
		link: "/docs/advanced-apis/terminal",
	},
];
</script>

<template>
	<div class="docs-home">
		<div class="docs-home__grid" aria-hidden="true" />

		<section class="docs-home__hero">
			<h1>
				<span class="docs-home__brand" role="img" aria-label="Acode">
					<span class="docs-home__logo-a" aria-hidden="true">
						<svg viewBox="685 334 543 409" focusable="false">
							<path
								fill="currentColor"
								d="M901.06 368.39c1.54-9.11 9.61-17.98 16.49-17.98h42.28c9.31 0 17.81 11.45 15 25.95-16.32 84.09-48.75 253.82-63.92 334.21-2.15 11.4-10.51 17.02-16.04 17.02h-36.49c-7.06 0-17.09-9.66-15.71-17.67 18.15-105.18 43.83-255.62 58.39-341.53z"
							/>
							<path
								fill="currentColor"
								d="M1011.84 367.92c-1.54-9.11-9.61-17.98-16.49-17.98h-42.28c-9.31 0-17.81 11.45-15 25.95 16.32 84.09 48.75 253.82 63.92 334.21 2.15 11.4 10.51 17.02 16.04 17.02h36.49c7.06 0 17.09-9.66 15.71-17.67-18.14-105.18-43.81-255.63-58.39-341.53z"
							/>
							<path
								fill="currentColor"
								d="M789.67 546.46c4.64-4.84 53.34-55.72 70.25-72.53 6.23-6.19 6.23-16.45 3.45-23.32-2.17-5.36-8.75-11.32-15.15-11.29h-46.31c-4.16 0-7.87 2.18-11.59 5.95-20.31 20.55-59 60.43-80.61 83.36-1.44 1.52-2.93 2.88-4.1 4.12-3.54 3.75-4.64 8.13-4.84 11.56-.09.93-.13 1.8-.15 2.58-.09 3.59.81 8.86 4.99 13.27 1.17 1.24 2.66 2.6 4.1 4.12 21.61 22.93 60.3 62.81 80.61 83.36 3.72 3.77 7.43 5.95 11.59 5.95h46.31c6.4.03 12.98-5.93 15.15-11.29 2.78-6.87 2.78-17.13-3.45-23.32-16.91-16.81-65.61-67.69-70.25-72.53z"
							/>
							<path
								fill="currentColor"
								d="M1123.02 545.88c-4.64-4.84-53.34-55.72-70.25-72.53-6.23-6.19-6.23-16.45-3.45-23.32 2.17-5.36 8.75-11.32 15.15-11.29h46.31c4.16 0 7.87 2.18 11.59 5.95 20.31 20.55 59 60.43 80.61 83.36 1.44 1.52 2.93 2.88 4.1 4.12 3.54 3.75 4.64 8.13 4.84 11.56.09.93.13 1.8.15 2.58.09 3.59-.81 8.86-4.99 13.27-1.17 1.24-2.66 2.6-4.1 4.12-21.61 22.93-60.3 62.81-80.61 83.36-3.72 3.77-7.43 5.95-11.59 5.95h-46.31c-6.4.03-12.98-5.93-15.15-11.29-2.78-6.87-2.78-17.13 3.45-23.32 16.91-16.81 65.61-67.69 70.25-72.53z"
							/>
						</svg>
					</span>code
				</span>
				Docs
			</h1>
			<p class="docs-home__lede">
				Learn the editor, then extend it. Guides for everyday use and the
				complete API for building Acode plugins.
			</p>
			<div class="docs-home__actions">
				<a class="docs-home__primary" href="/docs/getting-started/intro">
					Build your first plugin
				</a>
				<a class="docs-home__more" href="/user-guide/">
					New to Acode? Read the user guide
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="m9 6 6 6-6 6" />
					</svg>
				</a>
			</div>
		</section>

		<section class="docs-home__section" aria-label="Documentation sections">
			<a
				v-for="section in sections"
				:key="section.link"
				class="docs-home__tile"
				:href="section.link"
			>
				<span class="docs-home__eyebrow">{{ section.eyebrow }}</span>
				<strong>{{ section.title }}</strong>
				<span class="docs-home__text">{{ section.text }}</span>
			</a>
		</section>

		<section class="docs-home__section docs-home__reference">
			<h2>API reference</h2>
			<div class="docs-home__rows">
				<a
					v-for="item in references"
					:key="item.link"
					class="docs-home__row"
					:href="item.link"
				>
					<span>{{ item.title }}</span>
					<code>{{ item.code }}</code>
				</a>
			</div>
			<a class="docs-home__more" href="/docs/">
				Browse every API
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path d="m9 6 6 6-6 6" />
				</svg>
			</a>
		</section>
	</div>
</template>

<style scoped>
.docs-home {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 0 24px;
	color: var(--acode-text);
	font-family: var(--vp-font-family-base);
}

.docs-home > *:not(.docs-home__grid) {
	position: relative;
	z-index: 1;
}

/* Faint 80px grid with a 20px subgrid, fading out from the top like acode.app. */
.docs-home__grid {
	pointer-events: none;
	position: absolute;
	top: calc(-1 * var(--vp-nav-height));
	left: 50%;
	width: 100vw;
	height: 900px;
	transform: translateX(-50%);
	background-image:
		linear-gradient(to right, var(--acode-grid) 1px, transparent 1px),
		linear-gradient(to bottom, var(--acode-grid) 1px, transparent 1px),
		linear-gradient(to right, var(--acode-grid-fine) 1px, transparent 1px),
		linear-gradient(to bottom, var(--acode-grid-fine) 1px, transparent 1px);
	background-size:
		80px 80px,
		80px 80px,
		20px 20px,
		20px 20px;
	background-position: center top;
	mask-image: radial-gradient(
		70% 70% at 50% 0%,
		#000 0%,
		rgba(0, 0, 0, 0.4) 48%,
		transparent 78%
	);
}

.docs-home__hero {
	width: 100%;
	max-width: 1120px;
	padding: clamp(4rem, 10vw, 7rem) 0 clamp(3.5rem, 8vw, 5.5rem);
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
}

.docs-home__hero h1 {
	max-width: 18ch;
	margin: 0;
	font-size: clamp(2.75rem, 8vw, 5.4rem);
	font-weight: 500;
	letter-spacing: -0.055em;
	word-spacing: 0.18em;
	line-height: 0.95;
	text-wrap: balance;
	color: var(--acode-heading);
}

.docs-home__brand {
	display: inline-flex;
	align-items: baseline;
	gap: 0.02em;
	white-space: nowrap;
	word-spacing: normal;
}

.docs-home__logo-a {
	display: inline-block;
	flex: 0 0 auto;
	height: 0.79em;
	width: calc(0.79em * 543 / 409);
	height: 1.1cap;
	width: calc(1.1cap * 543 / 409);
	line-height: 0;
	color: #3499fe;
	transform: translateY(0.04em);
}

.docs-home__logo-a svg {
	display: block;
	width: 100%;
	height: 100%;
	overflow: visible;
}

.docs-home__lede {
	max-width: 34rem;
	margin: 1.35rem 0 0;
	font-size: clamp(1.02rem, 1.6vw, 1.2rem);
	line-height: 1.55;
	color: var(--acode-muted);
	text-wrap: pretty;
}

.docs-home__actions {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 18px;
	margin-top: 2.25rem;
}

a.docs-home__primary {
	display: inline-flex;
	align-items: center;
	height: 50px;
	padding: 0 24px;
	border-radius: 10px;
	background: var(--acode-button);
	color: var(--acode-button-text);
	font-size: 0.95rem;
	font-weight: 600;
	letter-spacing: -0.01em;
	text-decoration: none;
	white-space: nowrap;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
	transition: background-color 0.2s ease;
}

a.docs-home__primary:hover {
	background: var(--acode-button-hover);
}

a.docs-home__more {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 6px 4px;
	border-radius: 6px;
	color: var(--acode-muted);
	font-size: 0.88rem;
	font-weight: 500;
	text-decoration: none;
	transition: color 0.2s ease;
}

a.docs-home__more svg {
	width: 16px;
	height: 16px;
	fill: none;
	stroke: currentColor;
	stroke-width: 2;
	stroke-linecap: round;
	stroke-linejoin: round;
	transition: transform 0.25s ease;
}

a.docs-home__more:hover {
	color: var(--acode-heading);
}

a.docs-home__more:hover svg {
	transform: translateX(2px);
}

.docs-home a:focus-visible {
	outline: 2px solid var(--acode-accent);
	outline-offset: 3px;
}

.docs-home__section {
	width: 100%;
	max-width: 1040px;
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14px;
}

a.docs-home__tile {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 22px 22px 24px;
	border: 1px solid var(--acode-line);
	border-radius: 16px;
	background: var(--acode-surface);
	color: inherit;
	text-decoration: none;
	transition:
		border-color 0.2s ease,
		background-color 0.2s ease;
}

a.docs-home__tile:hover {
	border-color: var(--acode-line-strong);
	background: var(--acode-surface-strong);
}

.docs-home__eyebrow {
	font-family: var(--vp-font-family-mono);
	font-size: 0.65rem;
	font-weight: 500;
	letter-spacing: 0.1em;
	color: var(--acode-accent);
}

.docs-home__tile strong {
	margin-top: 6px;
	font-size: 1.35rem;
	font-weight: 500;
	letter-spacing: -0.03em;
	line-height: 1.15;
	color: var(--acode-heading);
}

.docs-home__text {
	font-size: 0.92rem;
	line-height: 1.55;
	color: var(--acode-muted);
}

.docs-home__reference {
	grid-template-columns: minmax(0, 1fr);
	justify-items: center;
	gap: 18px;
	margin-top: clamp(4rem, 9vw, 6rem);
}

.docs-home__reference h2 {
	margin: 0;
	padding: 0;
	border: 0;
	font-size: clamp(1.6rem, 3vw, 2.1rem);
	font-weight: 500;
	letter-spacing: -0.045em;
	line-height: 1.1;
	color: var(--acode-heading);
}

.docs-home__rows {
	width: 100%;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	column-gap: 40px;
	margin-top: 6px;
	border-top: 1px solid var(--acode-line);
}

a.docs-home__row {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 16px;
	padding: 16px 2px;
	border-bottom: 1px solid var(--acode-line);
	color: var(--acode-text);
	font-size: 0.98rem;
	font-weight: 500;
	text-decoration: none;
	transition: color 0.2s ease;
}

a.docs-home__row code {
	overflow: hidden;
	padding: 0;
	background: none;
	color: var(--acode-faint);
	font-family: var(--vp-font-family-mono);
	font-size: 0.78rem;
	text-overflow: ellipsis;
	white-space: nowrap;
	transition: color 0.2s ease;
}

a.docs-home__row:hover,
a.docs-home__row:hover code {
	color: var(--acode-accent);
}

@media (max-width: 760px) {
	.docs-home__section {
		grid-template-columns: minmax(0, 1fr);
	}

	.docs-home__rows {
		grid-template-columns: minmax(0, 1fr);
	}
}
</style>
