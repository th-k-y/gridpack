<h1 align="center">gridpack</h1>

<p align="center">
  <strong>CSS Grid layouts in one string. <a href="https://thekeydev.github.io/gridpack/demo/">See demo.</a></strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/gridpack"><img src="https://img.shields.io/npm/v/gridpack.svg" alt="npm" /></a>
  <a href="https://bundlejs.com/?q=gridpack&treeshake=[{Grid}]"><img src="https://deno.bundlejs.com/badge?q=gridpack&treeshake=%5B%7BGrid%7D%5D" alt="bundle size" /></a>
  <a href="https://github.com/thekeydev/gridpack/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/gridpack" alt="license" /></a>
</p>

---

A compact DSL that compiles layout strings into CSS Grid. One React component, optional extensions, zero wrapper divs.

```jsx
<Grid layout="hsCf hhh scc sff 8">
  <Header />
  <Sidebar />
  <Content />
  <Footer />
</Grid>
```

That's a full page layout. No CSS files, no class names, no nesting.

## Install

```bash
npm install gridpack
```

```jsx
import { Grid } from "gridpack";
```

## The Layout String

Everything fits in one prop. The string has a simple grammar:

```
[|] [legend] [rows...] [gap] [?flags] [| col-sizes [| row-sizes]]
```

### Quick examples

| String | Result |
|--------|--------|
| `ab` | Two equal columns |
| `\|ab` | Two equal rows (transpose) |
| `ab abb` | Two columns, 1:2 ratio |
| `ab a2b3` | Two columns, 2:3 ratio (char-count shorthand) |
| `hsCf hhh scc sff 8` | Holy grail, 8px gap, content grows |
| `ab ab \| 100 #` | Two columns: 100px fixed + fill remaining |
| `* 8` | Auto h-stack with gap (needs children) |
| `\| 12` | Auto v-stack with 12px gap |
| `*7 ?wh` | 7-column auto-flow grid |
| `a(e)B ab* 8 \| .#` | Form: labels right-aligned, inputs grow, repeat rows |
| `sah sh Sa* 8 | {sw}# | 50` | Pinned sidebar + header, repeating items |
| `abc \| 100~# 100~# 100~#` | 3 columns, each min 100px |
| `abcdef \| 50 # *` | 6 columns, sizes cycle: 50px 1fr 50px 1fr ... |

### Token vocabulary

| Token | Meaning |
|-------|---------|
| `a-z` | Named area |
| `A-Z` | Grow area (tracks become `1fr`) |
| `.` | Empty cell (in map) / `auto` (in sizes) |
| `#` | `1fr` (in sizes) |
| `\|` | Transpose prefix / pipe separator |
| `~` | `minmax(a, b)` — e.g. `200~#` |
| `*` | Auto-legend / repeat row / size cycling |
| `?` | Flags (`?w` width, `?h` height, `?cC` center) |
| `( )` | Per-area alignment — `a(cC)` centers area `a` |
| `{ }` | Template variable — `{sidebar}` |
| `0-9` | After area letter: repeat count (`h12` = 12 h's) |

### Flags — SECBAG

Lowercase = `justify-content`, uppercase = `align-content`:

- **S** start · **E** end · **C** center · **B** space-between · **A** space-around · **G** space-evenly
- `?w` / `?h` — force full width / height
- `?f` — reverse auto-flow direction (row → column)
- `?F` — dense packing (`grid-auto-flow: dense`)

### Sizes and auto-fill

When you write explicit `#` (1fr) in the pipe sizes section, the grid automatically fills its container — no `?w` needed. Proportional sizing from repeated area characters (like `ab abb`) keeps the grid content-sized.

```jsx
// 100px + fill remaining — grid auto-fills container width
<Grid layout="ab ab | 100 #">

// 1:2 proportional — grid is content-sized
<Grid layout="ab abb">

// 1:2 proportional — grid auto-fills container width
<Grid layout="ab abb ?w">
```

A trailing `*` in sizes cycles the pattern: `| 50 # *` with 6 columns becomes `50px 1fr 50px 1fr 50px 1fr`.

### Repeat rows

Append `*` to a row to repeat it based on children count:

```jsx
<Grid layout="habf hh ab* ff 8 | .#">
  <Header />
  <Footer />
  {fields.map(f => <><Label /><Input /></>)}
</Grid>
```

Uppercase letters in repeat rows are **pinned** — they span all repetitions:

```jsx
// Sidebar spans all rows, items repeat next to it
<Grid layout="sa Sa* 8">
  <Sidebar />
  {items.map(i => <Card />)}
</Grid>
```

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `layout` | `string` | Layout string |
| `col` | `boolean` | Shorthand for transpose (`\|` prefix) |
| `gap` | `number \| string` | Override gap |
| `vars` | `object` | Values for `{placeholder}` substitution |
| `onVarsChange` | `function` | Callback when extensions mutate vars |
| `extensions` | `array` | Extension objects |
| `xs` `sm` `md` `lg` `xl` | `string` | Layout strings per container breakpoint |
| `breaks` | `object` | Custom breakpoint thresholds |

### Minimal usage

```jsx
// Horizontal stack — no props needed
<Grid>
  <A /> <B /> <C />
</Grid>

// Vertical stack
<Grid col>
  <Header /> <Content /> <Footer />
</Grid>

// Responsive — each breakpoint is a complete layout string
<Grid layout="|abc ?w 8" sm="ab aab ?w 8" md="abc ?w 8">
  <A /> <B /> <C />
</Grid>
```

## Extensions

Behavioral plugins. Composable. Stack them in an array.

```jsx
import { Grid, splitPane, scrollable, debug } from "gridpack";

let [v, setV] = useState({ w: 200 });

<Grid
  layout="sC | {w}#"
  vars={v}
  onVarsChange={setV}
  extensions={[
    splitPane({ var: "w", edge: "s:e", min: 80, max: 400 }),
    scrollable({ area: ["s", "c"] }),
    debug(),
  ]}
>
  <Sidebar />
  <Content />
</Grid>
```

### Available extensions

| Extension | Description |
|-----------|-------------|
| `debug({ color? })` | Grid cell overlay |
| `splitPane({ var, edge, min?, max? })` | Draggable resize handle |
| `collapsible({ var, area, expanded?, collapsed? })` | Toggle area size on click |
| `accordion({ var, items, collapsed? })` | Mutual exclusion — expand one, collapse others |
| `scrollable({ area, axis? })` | Independent scrolling per area |
| `overlay({ area, over })` | Layer one area over another's grid cells |
| `animate({ properties?, duration?, easing? })` | CSS transitions on track changes |
| `tabs({ var, items, position? })` | Tab bar with content switching |
| `multiColumn({ area, fill? })` | CSS columns aligned to grid tracks |
| `fisheye({ axis?, intensity?, min? })` | Tracks expand near cursor, compress away |
| `render({ container?, cell? })` | Custom DOM output (semantic HTML, tables, etc.) |

### Writing custom extensions

Extensions are plain objects with lifecycle hooks:

```js
let myExtension = (opts) => ({
  name: "myExtension",
  needsAreas: false,                                          // force template-areas in auto-flow
  render: ({ parsed, vars, setVar, containerRef }) => [],   // inject elements
  renderContainer: ({ props, children, parsed }) => el,       // replace container output
  wrapCell: (child, areaStyle, key, childIdx, parsed) => el,  // replace cell wrapper
  containerStyle: ({ parsed, vars }) => ({}),                // modify container
  areaStyle: (area, vars) => null,                           // modify area wrappers
  transformVars: (vars) => vars,                             // derive vars from vars
  transformAreas: (parsed) => parsed,                        // modify parsed result
});
```

## Grammar (BNF)

```
layout    = ["|"] [legend] [map-rows] [gap] [?flags] ["|" cols ["|" rows]]
legend    = "*" | "*"digit+ | "*"pattern | area-def+
area-def  = letter [digit+] | LETTER [digit+]
          | letter"("mods")" | LETTER"("mods")"
mods      = ("s"|"e"|"c"|"S"|"E"|"C")+
map-row   = (letter [digit+] | LETTER | ".")+ ["*"]
gap       = number [number]
?flags    = "?" ("w"|"h"|"f"|"F"|"s"|"e"|"c"|"b"|"a"|"g"|"S"|"E"|"C"|"B"|"A"|"G")+
size      = "." | "#" | number | atom"~"atom | css-literal
sizes     = size+ ["*"]

Implicit rules:
  legend-only           → single-row map
  empty + children      → "*" (auto-legend)
  "|" + empty           → transposed "*"
  *N + children         → N columns, auto rows
  repeated chars        → 1fr (proportional)
  row ending "*"        → repeat (varargs)
  UPPER in repeat       → pinned (shared across repetitions)
  "{var}"               → replaced from vars prop
  trailing "*" in sizes → cycle preceding tokens
  explicit # in sizes   → auto full-width/height
  ?secbag flags         → default track size becomes auto
```

## Before & After

<table>
<tr><th>Traditional CSS Grid</th><th>Gridpack</th></tr>
<tr>
<td>

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar content content"
    "sidebar footer footer";
  grid-template-columns: 200px 1fr 1fr;
  grid-template-rows: auto 1fr auto;
  gap: 8px;
}
.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.content { grid-area: content; }
.footer  { grid-area: footer; }
```

</td>
<td>

```jsx
<Grid layout="hscf hhh scc sff 8 | 200##">
  <Header />
  <Sidebar />
  <Content />
  <Footer />
</Grid>
```

</td>
</tr>
</table>

## Links

- [Playground](https://thekeydev.github.io/gridpack/demo/) — interactive demo with 40+ presets, guided tutorials, and live source view
- [Documentation](https://thekeydev.github.io/gridpack/demo/) — full reference
- [npm](https://www.npmjs.com/package/gridpack)

## Support

If gridpack saves you time, consider supporting development: [![Donate](https://img.shields.io/badge/Donate-PayPal-blue)](https://www.paypal.com/donate/?hosted_button_id=9X7QBXKPBB2YW)

## License

MIT
