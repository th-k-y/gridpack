# Changelog

## 0.2.3

### Masonry Extension

- **`masonry()` extension** — adapts the TrigenSoftware/masonry-grid algorithm into a gridpack extension. Uses `translateY()` (or `translateX()` when transposed) to close vertical gaps in auto-flow grids.
- **Dual sizing mode** — auto-detected per item. Items with `--width`/`--height` CSS vars get aspect-ratio-locked sizing. Items without get measured from `offsetHeight` (content-sized). Both modes work in the same grid.
- **Balanced mode** — `masonry({ balanced: true })` reorders items within rows via CSS `order` to minimize total grid height. Pairs shortest items with tallest columns. Stable sort with quantized comparisons to prevent oscillating order swaps during resize.
- **Transpose support** — respects the `|` transpose prefix. Masonry packs horizontally with `translateX()` instead of vertically.
- **Multi-size track support** — works with alternating track sizes like `* 80 60` (e.g. `repeat(auto-fill, 80px 60px)`). Each item uses its own column's track width for height calculation, including after balanced reordering.
- 5 playground presets: Regular, Balanced, Photo Gallery (with images + balanced toggle), Cards (content-measured), Transposed.

### Auto-Fill / Auto-Fit Sizes

- **Leading `*` on col/row sizes** — `| * 200~#` becomes `repeat(auto-fill, minmax(200px, 1fr))`. The browser determines column count based on container width. Works with any auto-flow layout.
- **Both leading + trailing `*`** — `| * 200~# *` becomes `repeat(auto-fit, minmax(200px, 1fr))`. Auto-fit collapses empty tracks so items stretch to fill the row.
- **Multi-size patterns** — `| * 200 300` becomes `repeat(auto-fill, 200px 300px)`, creating alternating track pairs.
- **Auto-implies full width** — auto-fill/auto-fit sizes automatically set `width: 100%` (or `height: 100%` when transposed) without needing `?w`.
- **`parseSizeRepeat()` helper** — strips leading/trailing `*` from sizes strings, returns repeat mode. `buildRepeatSizes()` generates the CSS `repeat()` value.
- `colRepeat`/`rowRepeat`/`colRepeatSizes`/`rowRepeatSizes` fields added to parsed result. Transpose correctly swaps them.
- 2 playground presets: Auto-Fill (responsive column count), Auto-Fit (empty track collapse comparison).

## 0.2.2

### Lol

- Forgot to update README.md and CHANGELOG.md

## 0.2.1

### Playground Overhaul

- **Guided tutorials** — every preset now has a `guide` with explanation text and `tryThis` hints that tell the user what to edit in the layout field. Content derived from the video tutorial script series.
- **Source view** — every preset shows its React source code alongside the guide. Responsive breakpoint props are displayed separately when present.
- **Guide + Debug tabs** — the right panel now has Guide (tutorial + source side by side) and Debug (parsed output, generated CSS) tabs. Guide is the default.
- **Tab persistence** — navigating between Welcome, Playground, and Docs no longer resets state. All tabs stay mounted once visited, hidden with `display: none`. Preset selection, layout edits, slider positions, and split pane widths are preserved.

### New Presets

- **Size Repeat** (Sizing) — demonstrates trailing `*` in sizes section: `abcdef | 50 # *` cycles the pattern across all tracks.
- **Product Grid (w/ repeat)** (Responsive) — combines responsive breakpoints with repeat rows.

### Explicit Sizes Auto-Fill

- **`explicitSizes` tracking** — the parser now tracks whether col/row sizes came from an explicit pipe section (`| ...`) or were auto-inferred. Added `explicitSizes: { cols, rows }` to the parsed result.
- **Smart `width: 100%`** — when the user writes explicit `#` (1fr) in the pipe sizes section (e.g. `| 100 #`), the grid automatically fills its container width. Proportional sizing from repeated area characters (like `ab abb`) no longer triggers auto-fill, keeping those grids content-sized. This distinction prevents the confusing case where `ab abb` and `ab abb | ###` produced identical output.
- **Per-axis grow detection** — grow areas (uppercase letters) now only force `width: 100%` or `height: 100%` on axes where they actually generate `1fr` tracks, instead of forcing both axes unconditionally.
- Transpose correctly swaps the `explicitSizes` flags along with everything else.

## 0.2.0

### Auto-Flow

- **`*N` auto-flow mode** — `*4` creates a 4-column grid, rows derived from child count. Uses `grid-auto-flow` instead of `grid-template-areas`. Children are named `c0`, `c1`, `c2`, ...
- **`*pattern` span patterns** — `*s3c6a3` creates a 12-column grid where children cycle spans of 3/6/3. `*w2*2` = w spans 2 + 2 singles = 4-col grid.
- **Mixed mode** — combine static map rows with auto-flow: `h12 *s3c6a3` = pinned header row + auto-flow body.
- **`?f` flag** — reverses auto-flow direction (row↔column). `*3 ?f` fills top→bottom instead of left→right.
- **`?F` flag** — enables dense packing (`grid-auto-flow: dense`). Backfills gaps left by spanning items.
- **`needsAreas` extension hook** — extensions that need grid-area placement (splitPane, collapsible, accordion, scrollable, overlay, multiColumn) declare `needsAreas: true`. When combined with auto-flow layouts, Grid automatically converts to template-areas so extensions work transparently.

### Size Cycling

- **Trailing `*` in col/row sizes** — cycles the preceding size tokens to fill all tracks. `*6 | 80 # *` → `80px 1fr 80px 1fr 80px 1fr`. Works independently on cols and rows: `|| 40 80 *` cycles row sizes only.

### Char-Count Shorthand

- **`h12` in map rows** — expands to `hhhhhhhhhhhh`. Any lowercase letter followed by digits repeats that letter. Useful for wide-spanning areas without typing repeated characters.

### Transpose Improvements

- Transpose now swaps **justify-self ↔ align-self** on all per-area alignment modifiers.
- Transpose now swaps **justifyContent ↔ alignContent** in `?` flags.
- Transpose now swaps **gapH ↔ gapV** when asymmetric gaps are specified.
- Fisheye extension auto-swaps its axis on transpose (`axis: "x"` becomes `"y"` and vice versa).

### Render Extension

- New **`render({ container, cell })`** extension for custom DOM output.
- `renderContainer({ props, children, parsed })` — full control over the container element and child grouping. Enables semantic HTML structures like `<table>/<thead>/<tbody>/<tr>/<td>` with CSS subgrid, `<dl>/<dt>/<dd>`, or any custom DOM shape.
- `wrapCell(child, areaStyle, key, childIdx, parsed)` — replace the default `<div>` wrapper per child with any element or component.

### Alignment Fix

- Auto-flow tracks now default to `auto` (instead of `1fr`) when `justifyContent` or `alignContent` flags are set. This makes `?whcC` correctly center content instead of stretching tracks to fill the container.

### Fisheye Improvements

- Fixed `--fe-scale` / `--fe-scale-x` / `--fe-scale-y` CSS custom properties not being set in auto-flow mode. Added index-based position fallback when `getComputedStyle` returns `auto` for grid positions.
- Fixed area name resolution for map-based layouts where `gridArea` serializes as `"a / a / a / a"` — now extracts the first token.
- When all tracks on an axis are `auto` (no `fr` tracks), fisheye treats them as flexible so the effect works with both `*7` and `abcdefg` style layouts.

### Bug Fixes

- Fixed React "fewer hooks than expected" error when typing produces a transient parse error. Error check moved after all hooks.
- Fixed `fillSizes` utility to correctly handle explicit sizes that exceed or match the target count.

## 0.1.2

- Bug fixes.

## 0.1.1

- Initial working release.
- Layout string DSL: areas, grow, empty cells, proportional sizing, transpose, minmax, gaps, `?` flags (w/h/secbag), per-area alignment modifiers, template variables, repeat rows.
- `Grid` React component with container-width breakpoints (xs/sm/md/lg/xl), `vars`/`onVarsChange` for bidirectional state, and `extensions` prop.
- Extensions: `debug`, `splitPane`, `collapsible`, `accordion`, `scrollable`, `overlay`, `animate`, `tabs`, `multiColumn`, `fisheye`.
- Landing page, playground with 35+ presets, and docs panel.

## 0.1.0

- Package name claimed on npm.
