import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

export const WIDTH = 1200;
export const HEIGHT = 630;

// The soft gradients and grain compress far better as JPEG than as a palette PNG
// (which leaves dither blotches), keeping cards well under the ~300KB chat apps accept.
const OUTPUT = {
	quality: 90,
	mozjpeg: true,
	chromaSubsampling: "4:4:4",
} as const;
const FONT = `font-family="Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif"`;
const COLORS = {
	background: "#08090c",
	text: "#f4f5f7",
	muted: "#9aa1ad",
	accent: "#3499fe",
};

const logo = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), "logo.svg"),
	"utf8",
).replace(/^[\s\S]*?<svg\b[^>]*>/, "");

export interface OgCard {
	title: string;
	subtitle: string;
}

function escapeXml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

// Without font metrics, estimate widths from glyph classes of a bold sans.
function characterWidth(character: string, size: number, tracking: number) {
	if (character === " ") return 0.28 * size + tracking;
	if (/[iljI.,:;'|!()]/.test(character)) return 0.3 * size + tracking;
	if (/[A-Z0-9MWmw@]/.test(character)) return 0.68 * size + tracking;
	return 0.57 * size + tracking;
}

function estimateWidth(value: string, size: number, tracking: number) {
	let width = 0;
	for (const character of value)
		width += characterWidth(character, size, tracking);
	return width;
}

/** Greedy word wrap; returns null when the text needs more than `maxLines`. */
function wrap(
	value: string,
	maxWidth: number,
	size: number,
	tracking: number,
	maxLines: number,
) {
	const lines: string[] = [];
	let line = "";
	for (const word of value.split(/\s+/)) {
		const next = line ? `${line} ${word}` : word;
		if (!line || estimateWidth(next, size, tracking) <= maxWidth) {
			line = next;
			continue;
		}
		lines.push(line);
		line = word;
	}
	lines.push(line);
	const fits = lines.every(
		(item) => estimateWidth(item, size, tracking) <= maxWidth,
	);
	return fits && lines.length <= maxLines ? lines : null;
}

/** Cut text to fit `maxWidth`, preferring a word boundary, and mark the cut with an ellipsis. */
function truncate(
	value: string,
	maxWidth: number,
	size: number,
	tracking: number,
) {
	if (estimateWidth(value, size, tracking) <= maxWidth) return value;
	let cut = value;
	while (cut && estimateWidth(`${cut}…`, size, tracking) > maxWidth) {
		cut = cut.slice(0, -1);
	}
	const space = cut.lastIndexOf(" ");
	return `${(space > cut.length / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

const TITLE_MAX_WIDTH = WIDTH - 200;
const TITLE_TRACKING = -3;
// Short titles get the biggest size that fits on one line; longer ones wrap onto two.
const ONE_LINE_SIZES = [96, 84, 72];
const TWO_LINE_SIZES = [76, 64];

function layoutTitle(title: string) {
	for (const size of ONE_LINE_SIZES) {
		const lines = wrap(title, TITLE_MAX_WIDTH, size, TITLE_TRACKING, 1);
		if (lines) return { size, lines };
	}
	for (const size of TWO_LINE_SIZES) {
		const lines = wrap(title, TITLE_MAX_WIDTH, size, TITLE_TRACKING, 2);
		if (lines) return { size, lines };
	}
	const size = TWO_LINE_SIZES.at(-1) as number;
	const [first, ...rest] = title.split(/\s+/);
	let line = first;
	while (
		rest.length &&
		estimateWidth(`${line} ${rest[0]}`, size, TITLE_TRACKING) <= TITLE_MAX_WIDTH
	) {
		line = `${line} ${rest.shift()}`;
	}
	return {
		size,
		lines: [
			line,
			truncate(rest.join(" "), TITLE_MAX_WIDTH, size, TITLE_TRACKING),
		],
	};
}

function svgDocument(content: string, defs = "") {
	return `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs>${defs}</defs>${content}</svg>`;
}

/** Acode mark followed by the bold wordmark, centered as one unit. */
function brandLockup(y: number, size: number) {
	const logoHeight = size * 0.9;
	const logoWidth = (logoHeight * 543) / 409;
	const wordWidth = size * 3.05;
	const gap = size * 0.32;
	const left = (WIDTH - (logoWidth + gap + wordWidth)) / 2;
	return `<svg x="${left}" y="${y}" width="${logoWidth}" height="${logoHeight}" viewBox="685 334 543 409">${logo}<text x="${Math.round(left + logoWidth + gap)}" y="${Math.round(y + logoHeight * 0.86)}" fill="${COLORS.text}" ${FONT} font-size="${size}" font-weight="700" letter-spacing="-0.5">Acode</text>`;
}

// [x, y, width, height, angle, color, opacity] before blurring.
type Beam = [number, number, number, number, number, string, number];
const BEAMS: Beam[] = [
	[700, -260, 180, 900, 38, COLORS.accent, 0.5],
	[930, -200, 120, 900, 38, "#1d4ed8", 0.45],
	[160, -320, 140, 760, -34, "#1e40af", 0.35],
	[420, 470, 520, 200, 0, COLORS.accent, 0.3],
];

let background: Promise<Buffer> | undefined;

/** Near-black canvas lit by soft, blurred beams of Acode blue, finished with a faint grain. */
function atmosphere() {
	background ??= (async () => {
		const light = svgDocument(
			`<rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.background}"/>${BEAMS.map(
				([x, y, width, height, angle, color, opacity]) =>
					`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${width / 2}" fill="${color}" fill-opacity="${opacity}" transform="rotate(${angle} ${x + width / 2} ${y + height / 2})"/>`,
			).join(
				"",
			)}<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#vignette)"/>`,
			`<radialGradient id="vignette" cx="0.5" cy="0.42" r="0.75"><stop offset="0.35" stop-color="${COLORS.background}" stop-opacity="0"/><stop offset="1" stop-color="${COLORS.background}" stop-opacity="0.92"/></radialGradient>`,
		);
		const grain = svgDocument(
			`<rect width="${WIDTH}" height="${HEIGHT}" filter="url(#grain)" opacity="0.06"/>`,
			'<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>',
		);
		const blurred = await sharp(Buffer.from(light)).blur(70).png().toBuffer();
		return sharp(blurred)
			.composite([{ input: Buffer.from(grain) }])
			.png()
			.toBuffer();
	})();
	return background;
}

function cardSvg({ title, subtitle }: OgCard) {
	const { size, lines } = layoutTitle(title);
	const lineHeight = size * 1.08;
	const widest = Math.max(
		...lines.map((line) => estimateWidth(line, size, TITLE_TRACKING)),
	);
	// Title and subtitle are centered together as one block just above the middle.
	const capHeight = size * 0.72;
	const subtitleGap = 60;
	const block = capHeight + lineHeight * (lines.length - 1) + subtitleGap;
	const firstBaseline = 318 - block / 2 + capHeight;
	const subtitleBaseline =
		firstBaseline + lineHeight * (lines.length - 1) + subtitleGap;
	const tspans = lines
		.map(
			(line, index) =>
				`<tspan x="${WIDTH / 2}" y="${Math.round(firstBaseline + index * lineHeight)}">${escapeXml(line)}</tspan>`,
		)
		.join("");
	const gradientLeft = Math.round(WIDTH / 2 - widest / 2);
	const gradientRight = Math.round(WIDTH / 2 + widest / 2);
	return Buffer.from(
		svgDocument(
			`${brandLockup(64, 40)}
			<text fill="url(#headline)" ${FONT} font-size="${size}" font-weight="700" letter-spacing="${TITLE_TRACKING}" text-anchor="middle">${tspans}</text>
			<text x="${WIDTH / 2}" y="${Math.round(subtitleBaseline)}" fill="${COLORS.muted}" ${FONT} font-size="30" text-anchor="middle">${escapeXml(truncate(subtitle, TITLE_MAX_WIDTH, 30, 0))}</text>`,
			`<linearGradient id="headline" x1="${gradientLeft}" x2="${gradientRight}" y1="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8f96a3"/><stop offset="0.3" stop-color="#ffffff"/><stop offset="0.7" stop-color="#ffffff"/><stop offset="1" stop-color="#8f96a3"/></linearGradient>`,
		),
	);
}

export async function renderOgImage(card: OgCard) {
	return sharp(await atmosphere())
		.composite([{ input: cardSvg(card) }])
		.jpeg(OUTPUT)
		.toBuffer();
}

export async function writeOgImage(file: string, card: OgCard) {
	await mkdir(dirname(file), { recursive: true });
	await writeFile(file, await renderOgImage(card));
}
