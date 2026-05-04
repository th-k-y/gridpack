import React from "react";
import { Grid } from "../src/Grid.jsx";

export default function Docs() {
	let S = ({ children }) => <span style={{ color: "#c3e88d" }}>{children}</span>;
	let K = ({ children }) => <span style={{ color: "#c792ea" }}>{children}</span>;
	let C = ({ children }) => <span style={{ color: "#7fdbca" }}>{children}</span>;
	let F = ({ children }) => <span style={{ color: "#f78c6c" }}>{children}</span>;

	let Section = ({ title, children }) => <div style={{ marginBottom: 20 }}>
		<div style={{ fontSize: 13, fontWeight: 700, color: "#7fdbca", marginBottom: 8, borderBottom: "1px solid #2a2a4a", paddingBottom: 4 }}>{title}</div>
		<div style={{ fontSize: 12, lineHeight: 1.8 }}>{children}</div>
	</div>;

	let Ex = ({ code, desc }) => <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
		<code style={{ color: "#c3e88d", background: "#0f0f23", padding: "1px 6px", borderRadius: 3, whiteSpace: "nowrap", flexShrink: 0 }}>{code}</code>
		<span style={{ color: "#888" }}>{desc}</span>
	</div>;

	return <Grid gap={16} style={{ padding: 8, overflow: "auto", width: "100%", height: "100%" }}>
		<div style={{ maxWidth: 700, padding: "0 4px", lineHeight: 1.8 }}>
			<Section title="Layout String Grammar">
				<code style={{ color: "#c3e88d", display: "block", background: "#0f0f23", padding: 10, borderRadius: 4, marginBottom: 10, border: "1px solid #2a2a4a" }}>
					[<F>|</F>] [<K>legend</K>|<F>*</F>|<F>*N</F>] [<K>rows</K>] [<F>gap</F> [<F>gap</F>]] [<F>?flags</F>] [<F>|</F> <K>cols</K> [<F>|</F> <K>rows</K>]]
				</code>
			</Section>
			<Section title="Map Tokens">
				<Ex code="a-z" desc="Area (lowercase in map)" />
				<Ex code="A-Z" desc="Grow area in legend (tracks become 1fr)" />
				<Ex code="." desc="Empty cell (in map) / auto (in sizes)" />
				<Ex code="#" desc="1fr (in sizes)" />
				<Ex code="number" desc="Gap (in map) / px size (in sizes)" />
				<Ex code="|" desc="Transpose prefix / pipe separator for col|row sizes" />
				<Ex code="*" desc="Auto-legend from children count (single row)" />
				<Ex code="*N" desc="Auto-flow grid with N columns, rows derived from children count" />
				<Ex code="ab*" desc="Repeat row — expands based on children" />
				<Ex code="Ab*" desc="Uppercase in repeat row = pinned (shared, not numbered)" />
				<Ex code="a~b" desc="minmax(a, b) — e.g. 200~# = minmax(200px, 1fr)" />
				<Ex code="," desc="Optional separator (commas or spaces)" />
				<Ex code="{var}" desc="Template variable" />
			</Section>
			<Section title="? Flags (container-level)">
				<div style={{ color: "#888", marginBottom: 4 }}>Lowercase = justify-content, Uppercase = align-content</div>
				<Ex code="?w" desc="Force full width" />
				<Ex code="?h" desc="Force full height" />
				<Ex code="?s / ?S" desc="start" />
				<Ex code="?e / ?E" desc="end" />
				<Ex code="?c / ?C" desc="center" />
				<Ex code="?b / ?B" desc="space-between (Borders)" />
				<Ex code="?a / ?A" desc="space-around" />
				<Ex code="?g / ?G" desc="space-evenly (Gaps)" />
				<div style={{ color: "#555", marginTop: 4 }}>Mnemonic: <C>SECBAG</C> — Start End Center Borders Around Gaps</div>
			</Section>
			<Section title="Legend Modifiers (per-area alignment)">
				<Ex code="a(s/e/c)" desc="justify-self" />
				<Ex code="a(S/E/C)" desc="align-self" />
				<Ex code="a(cC)" desc="center both" />
			</Section>
			<Section title="Legend Modifiers (per-area alignment)">
				<div style={{ color: "#888", marginBottom: 4 }}>Repeating area chars in map rows → columns default to 1fr (proportional)</div>
				<Ex code="ab abb" desc="a=1fr b=2fr (b appears twice)" />
				<Ex code="ab aab" desc="a=2fr b=1fr" />
			</Section>
			<Section title="Grid Component Props">
				<Ex code="layout" desc="Layout string" />
				<Ex code="col" desc="Boolean — prepend | for vertical layout" />
				<Ex code="gap" desc="Override gap — number (px) or string" />
				<Ex code="vars" desc="Template vars — values for {placeholder} substitution" />
				<Ex code="onVarsChange" desc="Callback when extensions mutate vars" />
				<Ex code="extensions" desc="Extension array" />
				<Ex code="xs/sm/md/lg/xl" desc="Layout strings for breakpoints" />
				<Ex code="breaks" desc="Custom thresholds — default { xs:0, sm:576, md:768, lg:992, xl:1200 }" />
			</Section>
			<Section title="Extensions">
				<div style={{ color: "#888", marginBottom: 6 }}>Behavioral extensions — composable, stackable on any Grid.</div>
				<Ex code="debug({ color? })" desc="Show grid cell overlay" />
				<Ex code='scrollable({ area, axis? })' desc='Make area scrollable — axis: "both" | "x" | "y". Area can be string or array.' />
				<Ex code='overlay({ area, over })' desc="Place area over another — same grid cells, higher z-index" />
				<Ex code='animate({ properties?, duration?, easing? })' desc="CSS transitions on grid changes" />
				<Ex code='splitPane({ var, edge, min?, max? })' desc='Draggable resize handle — edge: "s:e" = right edge of area s' />
				<Ex code='collapsible({ var, area, expanded?, collapsed? })' desc="Toggle area size on click" />
				<Ex code='accordion({ var, items, collapsed? })' desc="Mutual exclusion — items: [{ area, sizeVar, expanded }]" />
				<Ex code='tabs({ var, items, position? })' desc='Tab bar — items: [{ label, area, sizeVar? }], position: "top" | "bottom"' />
				<Ex code='multiColumn({ area, fill? })' desc='Auto-align CSS multi-column to grid tracks the area spans — fill: "auto"|"balance"' />
				<Ex code='fisheye({ axis?, intensity?, min? })' desc='Tracks expand near cursor, compress away — axis: "x" | "y" | "both"' />
				<div style={{ color: "#555", marginTop: 8, fontSize: 11 }}>Extension interface: {"{ name, render?, containerStyle?, areaStyle?, transformVars?, transformAreas? }"}</div>
			</Section>
			<Section title="Quick Examples">
				<Ex code="ab" desc="Two equal columns" />
				<Ex code="|ab" desc="Two equal rows" />
				<Ex code="*" desc="Auto h-stack (needs children)" />
				<Ex code="|" desc="Auto v-stack (needs children)" />
				<Ex code="hsCf hhh scc sff 8" desc="Holy grail with grow" />
				<Ex code="a(e)B ab* 8 | .#" desc="Form with right-aligned labels" />
				<Ex code="sa ss Sa* 8 | 120#" desc="Pinned sidebar + repeating list" />
				<Ex code='abc | 100~# 100~# 100~#' desc="Responsive 3-col with min 100px" />
				<Ex code='*7 ?wh' desc="7-column auto-flow grid (calendar, data table)" />
			</Section>
		</div>
		<Section title="Full Grammar & Rules">
			<code><pre style={{ lineHeight: "14px", tabSize: 4 }}>{`
	layout       = [transpose] [main] ["|" col-sizes ["|" row-sizes]]

	transpose    = "|"

	main         = [legend] [map-rows] [gap] [flags]
				-- (flags float freely among segments)

	legend       = "*"                              -- auto-legend, single row
				| "*" digit+                       -- auto-flow grid with N columns
				| area-def+

	area-def     = letter
				| LETTER                           -- uppercase = grow
				| letter "(" modifiers ")"
				| LETTER "(" modifiers ")"

	modifiers    = self-mod+
	self-mod     = "s" | "e" | "c"                  -- justify-self: start/end/center
				| "S" | "E" | "C"                  -- align-self: start/end/center

	map-rows     = map-row+
	map-row      = cell+
				| cell+ "*"                         -- repeat row (varargs)

	cell         = letter                            -- area reference
				| LETTER                            -- pinned area in repeat row
				| "."                               -- empty cell

	gap          = number                            -- uniform gap (px)
				| number number                     -- row-gap col-gap (px)

	flags        = "?" flag-char+
	flag-char    = "w"                               -- full width
				| "h"                               -- full height
				| "s" | "e" | "c" | "b" | "a" | "g"    -- justify-content
				| "S" | "E" | "C" | "B" | "A" | "G"    -- align-content

	col-sizes    = size-token+
	row-sizes    = size-token+

	size-token   = "."                               -- auto
				| "#"                               -- 1fr
				| number                            -- px
				| size-atom "~" size-atom            -- minmax(a, b)
				| css-size                           -- literal passthrough

	size-atom    = "." | "#" | number | css-size

	number       = digit+ ["." digit+]
	letter       = "a"-"z"
	LETTER       = "A"-"Z"
	css-size     = <any non-whitespace not matching above>

	-- separators: whitespace and commas interchangeable, commas optional
	-- size tokens: "." and "#" need no surrounding spaces
	-- size tokens: "~" binds adjacent tokens (200~# = minmax(200px, 1fr))

	-- implicit rules:
	--   legend only, no map rows     → legend doubles as single-row map
	--   empty input + childCount     → "*"
	--   "|" + empty + childCount     → transposed "*"
	--   all-numeric segments         → gap only, prepend "*" if childCount > 0
	--   *N + childCount              → N columns, ceil(childCount/N) rows, positional areas

	-- var substitution (pre-parser, in Grid component):
	--   "{" identifier "}" replaced from vars prop before parsing

	-- repeat row expansion (post-parse):
	--   row ending with "*" = repeat row (max one per layout)
	--   lowercase in repeat row → numbered: a→a1,a2,... b→b1,b2,...
	--   UPPERCASE in repeat row → pinned: shared across all repetitions
	--   repeat count = ceil((childCount - staticAreaCount) / repeatAreasPerRow)
			`}</pre></code>
		</Section>
	</Grid>
};
