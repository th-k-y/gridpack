import React from "react";
import { Grid, debug, debug2, accordion, collapsible, splitPane, scrollable, animate, overlay, tabs, multiColumn, fisheye, render } from "../src/Grid.jsx";
import { parseGridLayout, toGridStyle } from "../src/grid-layout-dsl.js";

let Style = ({ children }) => <style>{children}</style>
Style.__notAComponent = true;
let Box = ({ c = 0, children, style }) => <div className={`demo-box c${c % 8}`} style={style}>{children}</div>

// --- children builders ---
let boxes = (labels) => labels.map((l, i) => <Box key={i} c={i}>{l}</Box>);
let loremItems = (n) => Array.from({ length: n }, (_, i) =>
	<div key={i} style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12, color: "#888" }}>Item {i + 1} — Lorem ipsum dolor sit amet</div>);

let calendarCells = () => {
	let dn = ["Mo","Tu","We","Th","Fr","Sa","Su"], sd = 2, dm = 30;
	let ev = { 3: "Sync", 7: "Dentist", 12: "Release", 15: "Review", 19: "Hack", 23: "Today", 27: "Demo" };
	let cells = [];
	for (let d = 0; d < 7; d++) cells.push(<div key={`h${d}`} style={{ background: "#16213e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "calc(7px + var(--fe-scale, 1) * 3px)", color: d >= 5 ? "#c792ea" : "#7fdbca", fontWeight: 700, borderBottom: "2px solid #2a2a4a", borderRight: "1px solid #1a1a2a", overflow: "hidden" }}>{dn[d]}</div>);
	for (let w = 0; w < 5; w++) for (let d = 0; d < 7; d++) { let idx = w*7+d, dayNum = idx-sd+1, ok = dayNum >= 1 && dayNum <= dm, we = d >= 5, e = ok ? ev[dayNum] : null, td = dayNum === 23;
		cells.push(<div key={`c${w}-${d}`} style={{ background: td ? "#2a3a5f" : ok ? (we ? "#1a1525" : "#151520") : "#0f0f18", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 2, borderRight: "1px solid #1a1a2a", borderBottom: "1px solid #1a1a2a", opacity: ok ? 1 : 0.25 }}>
			<span style={{ fontSize: "calc(8px + var(--fe-scale, 1) * 5px)", fontWeight: 600, color: td ? "#7fdbca" : we ? "#c792ea" : "#888" }}>{ok ? dayNum : ""}</span>
			{e && <span style={{ fontSize: "calc(var(--fe-scale, 1) * 8px)", color: "#f78c6c", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textAlign: "center", opacity: "calc(0.1 + var(--fe-scale, 1) * 0.7)" }}>{e}</span>}
		</div>);
	}
	return cells;
};

// ============================================================
// --- presets ---
// ============================================================

let presets = [
	// --- basics ---
	{ cat: "Basics", name: "Single Area", layout: "a", w: 200, h: 80, children: () => boxes(["A"]) },
	{ cat: "Basics", name: "H-Stack", layout: "8", w: 400, h: 80, children: () => boxes(["A", "B", "C"]) },
	{ cat: "Basics", name: "V-Stack", layout: "|8", w: 200, h: 200, children: () => boxes(["A", "B", "C"]) },
	{ cat: "Basics", name: "Two Cols", layout: "ab", w: 300, h: 80, children: () => boxes(["A", "B"]) },
	{ cat: "Basics", name: "Two Cols 1:2", layout: "ab abb", w: 400, h: 100, children: () => boxes(["Narrow", "Wide"]) },
	{ cat: "Basics", name: "Two Cols Sized", layout: "ab ab | 100 200", w: 400, h: 100, children: () => boxes(["A", "B"]) },
	{ cat: "Basics", name: "Centered Card", layout: "c .c. 16", w: 400, h: 200, children: () => boxes(["Card"]) },
	{ cat: "Basics", name: "Empty Corners", layout: "hf h. .f 8", w: 300, h: 200, children: () => boxes(["Header", "Footer"]) },

	// --- layouts ---
	{ cat: "Layouts", name: "Page Layout (basic)", layout: "hsCf hhhh sccc sfff 8", w: 500, h: 300,
		children: () => boxes(["Header", "Sidebar", "Content", "Footer"]),
		src: '<Grid layout="hsCf hhhh sccc sfff 8">\n  <Header/><Sidebar/><Content/><Footer/>\n</Grid>' },
	{ cat: "Layouts", name: "Page Layout (advanced)", layout: "hs(S)Cf(e) hh sc sf 8 | 100# | .#.", w: 500, h: 300,
		children: () => boxes(["Header", "Sidebar", "Content", "Footer"]) },
	{ cat: "Layouts", name: "Sidebar + Main (vars)", layout: "sM sm | {w}#", w: 500, h: 250, vars: { w: 250 },
		children: () => boxes(["Sidebar", "Main"]),
		params: [{ key: "w", label: "sidebar", type: "range", min: 80, max: 400, def: 250 }] },
	{ cat: "Layouts", name: "Dashboard (sneak👀)", layout: "hnsCaf hhh nss nca fff 8 | {nav}#{aside} | 40 40#{footer}", w: 600, h: 350,
		vars: { nav: 180, aside: 100, footer: 80 },
		ext: () => [splitPane({ var: "nav", edge: "n:e", min: 50, max: 300 }), splitPane({ var: "aside", edge: "a:s", min: 50, max: 300 }), splitPane({ var: "footer", edge: "f:s", axis: "y", min: 50, max: 300 })],
		children: () => boxes(["Header", "Nav", "Stats", "Content", "Aside", "Footer"]), info: "Drag edges to resize" },

	// --- alignment ---
	{ cat: "Alignment", name: "Full Width", layout: "ab ?w 8", w: 400, h: 80, children: () => boxes(["A", "B"]) },
	{ cat: "Alignment", name: "Full Both", layout: "ab ?wh 8", w: 400, h: 200, children: () => boxes(["A", "B"]) },
	{ cat: "Alignment", name: "Center Both (Justify)", layout: "abc ?whcC", w: 400, h: 200, children: () => boxes(["A", "B", "C"]) },
//	{ cat: "Alignment", name: "Space Evenly", layout: "abc ?whg", w: 400, h: 100, children: () => boxes(["A", "B", "C"]) },
//	{ cat: "Alignment", name: "Space Between", layout: "abc ?wb", w: 400, h: 80, children: () => boxes(["A", "B", "C"]) },
	{ cat: "Alignment", name: "Per-Area", layout: "a(e)b(s)c(cC) abc ?wh", w: 400, h: 200,
		children: () => boxes(["end", "start", "center"]) },

	// --- minmax ---
	{ cat: "Sizing", name: "Some Layout", layout: "hnMsf hhhh nnnn ssmm ffff 12 6 | 100## 300 | 48 48#40", w: 550, h: 300,
		children: () => boxes(["Header", "Nav", "Main", "Sidebar", "Footer"]) },
	{ cat: "Sizing", name: "Minmax Sidebar", layout: "sc 8 ?w | 100~300 #", w: 500, h: 200,
		children: () => boxes(["Sidebar", "Content"]), info: "Resize container — sidebar clamps 100-300px" },
	{ cat: "Sizing", name: "Minmax Responsive", layout: "abc | 100~# 100~# 100~#", w: 500, h: 150,
		children: () => boxes(["A", "B", "C"]), info: "Resize container — cols min 100px" },
//	{ cat: "Sizing", name: "Minmax Range", layout: "ab | 200~400 #", w: 500, h: 120,
//		children: () => boxes(["200-400px", "Rest"]) },

	// --- responsive ---
	{ cat: "Responsive", name: "Sidebar Collapse", layout: "|sc ?w 8", w: 500, h: 250,
		sm: "sC sc 8 | 200#",
		children: () => boxes(["Sidebar", "Content"]),
		info: "Below md: stacked. Above: side by side",
		src: '<Grid layout="|sc ?w 8" md="sC sc 8 | 200#">\n  <Sidebar/><Content/>\n</Grid>' },
	{ cat: "Responsive", name: "Article Layout", layout: "|hnCf 4", w: 600, h: 350,
		sm: "hnCf hhhh nccc ffff 8 | 150###",
		md: "hnCf hhhh nccc nccc ffff 16 | 200###",
		children: () => boxes(["Header", "Nav", "Content", "Footer"]),
		info: "xs: stacked, md: 4-col, lg: sidebar nav" },
	{ cat: "Responsive", name: "Stack → 2col → 3col", layout: "|abc ?w 8", w: 600, h: 200,
		sm: "ab aab ?w 8", md: "abc ?w 8",
		children: () => boxes(["A", "B", "C"]),
		info: "Resize container to see layout switch",
		src: '<Grid layout="|abc ?w 8" sm="ab aab ?w 8" lg="abc ?w 8">\n  <A/><B/><C/>\n</Grid>' },
	{ cat: "Responsive", name: "Product Grid", layout: "|* ?w 4", w: 600, h: 300,
		sm: "ab ab* ?w 4", md: "abc abc* ?w 4",
		children: (v, p) => { let n = p?.n || 6; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>Product {i+1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 12, def: 6 }],
		info: "xs: 1 col, sm: 2 cols, lg: 3 cols" },

	// --- repeat ---
	{ cat: "Repeat", name: "* Auto", layout: "* 8 | 40 80 120", w: 400, h: 80,
		children: (v, p) => { let n = p?.n || 3; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{String.fromCharCode(65+i)}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 8, def: 3 }] },
	{ cat: "Repeat", name: "| Auto", layout: "| 8", w: 200, h: 250,
		children: (v, p) => { let n = p?.n || 4; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{String.fromCharCode(65+i)}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 8, def: 4 }] },
	{ cat: "Repeat", name: "*N Grid", layout: "*4 4 ?w", w: 400,
		children: (v, p) => { let n = p?.n || 8; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i+1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 16, def: 8 }],
		src: '<Grid layout="*4 4 ?w">\n  {items}\n</Grid>' },
	{ cat: "Repeat", name: "Form 2-Col", layout: "habf hh ab* ff 8 | .#", w: 400,
		children: (v, p) => { let n = p?.rows || 3; return [<Box key="h" c={0}>Header</Box>, <Box key="f" c={3}>Footer</Box>, ...Array.from({ length: n }, (_, i) => [<Box key={`l${i}`} c={1}>Label {i+1}</Box>, <Box key={`v${i}`} c={2}>Input {i+1}</Box>]).flat()]; },
		params: [{ key: "rows", label: "rows", type: "range", min: 1, max: 8, def: 3 }],
		src: '<Grid layout="habf hh ab* ff 8 | .#">\n  <Header/><Footer/>\n  {fields.map(f => <><Label/><Input/></>)}\n</Grid>' },
	{ cat: "Repeat", name: "Pinned Sidebar", layout: "sah sh Sa* 8 | {sw}# | 50", w: 400, h: 260, vars: { sw: 120 },
		children: (v, p) => { let n = p?.items || 4; return [<Box key="h" c={0}>Header</Box>, <Box key="s" c={1}>Sidebar</Box>, ...Array.from({ length: n }, (_, i) => <Box key={`i${i}`} c={2+i}>Item {i+1}</Box>)]; },
		params: [{ key: "sw", label: "sidebar", type: "range", min: 60, max: 250, def: 120 }, { key: "items", label: "items", type: "range", min: 1, max: 8, def: 4 }] },
	{ cat: "Repeat", name: "Card Grid", layout: "abc aabc* 4 | ####", w: 450,
		children: (v, p) => { let n = p?.cards || 6; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>Card {i+1}</Box>); },
		params: [{ key: "cards", label: "cards", type: "range", min: 3, max: 12, def: 6 }] },
	{ cat: "Repeat", name: "List", layout: "a a* 4 ?w", w: 300,
		children: (v, p) => { let n = p?.items || 5; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>Item {i+1}</Box>); },
		params: [{ key: "items", label: "items", type: "range", min: 1, max: 10, def: 5 }] },

	// --- extensions ---
	{ cat: "Extensions", name: "Split Pane", layout: "sC | {w}", w: 500, h: 280, vars: { w: 200 },
		ext: () => [splitPane({ var: "w", edge: "s:e", min: 80, max: 400 })],
		children: () => boxes(["Sidebar", "Content"]), info: "Drag the edge",
		src: '<Grid layout="sC | {w}" vars={v} onVarsChange={setV}\n  extensions={[splitPane({ var: "w", edge: "s:e", min: 80, max: 400 })]}>\n  <Sidebar/><Content/>\n</Grid>' },
	{ cat: "Extensions", name: "Collapsible", layout: "sC | {sb}", w: 500, h: 250, vars: { sb: 200 },
		ext: () => [collapsible({ var: "sb", area: "s", expanded: 200, collapsed: 0 })],
		children: (v) => [<Box key="s" c={1}>{(v.sb||0) > 0 ? "Sidebar" : ""}</Box>, <Box key="c" c={2}>Content</Box>],
		info: "Click arrow",
		src: 'collapsible({ var: "sb", area: "s", expanded: 200, collapsed: 0 })' },
	{ cat: "Extensions", name: "Animate", layout: "sC sc | {w}#", w: 500, h: 200, vars: { w: 200 },
		ext: () => [animate({ duration: "0.6s" })], children: () => boxes(["Sidebar", "Content"]),
		params: [{ key: "w", label: "sidebar", type: "toggle", on: 400, off: 200 }] },
	{ cat: "Extensions", name: "Animated Collapsible", layout: "sC | {sb}", w: 500, h: 250, vars: { sb: 200 },
		ext: () => [animate({ duration: "0.2s" }), collapsible({ var: "sb", area: "s", expanded: 200, collapsed: 0 })],
		children: (v) => [<Box key="s" c={1}>{(v.sb||0) > 0 ? "Sidebar" : ""}</Box>, <Box key="c" c={2}>Content</Box>],
		info: "Click arrow",
		src: 'collapsible({ var: "sb", area: "s", expanded: 200, collapsed: 0 })' },
	{ cat: "Extensions", name: "Accordion", layout: "| abc 8 | {a} {b} {c}", w: 400, h: 300, vars: { active: "a", a: "#", b: ".", c: "." },
		ext: () => [accordion({ var: "active", collapsed: ".", items: [{ area: "a", sizeVar: "a", expanded: "#" }, { area: "b", sizeVar: "b", expanded: "#" }, { area: "c", sizeVar: "c", expanded: "#" }] })],
		children: () => boxes(["Section A", "Section B", "Section C"]), info: "Click headers" },
	{ cat: "Extensions", name: "Scrollable", layout: "hscf hhh scc sff 8 | {sb}# | 40#40", w: 500, h: 350, vars: { sb: 200 },
		ext: () => [scrollable({ area: ["s", "c"] }), splitPane({ var: "sb", edge: "s:e", min: 80, max: 300 })],
		children: () => [<Box key="h" c={0}>Header</Box>, <div key="s" style={{ background: "#1a1a2e" }}><div style={{ padding: 8, fontSize: 11, color: "#c792ea", borderBottom: "1px solid #2a2a4a" }}>Sidebar</div>{loremItems(12)}</div>, <div key="c" style={{ background: "#1a1a2e" }}><div style={{ padding: 8, fontSize: 11, color: "#c3e88d", borderBottom: "1px solid #2a2a4a" }}>Content</div>{loremItems(20)}</div>, <Box key="f" c={3}>Footer</Box>] },
	{ cat: "Extensions", name: "Tabs", layout: "| abc .abc | 28 {_tab_a} {_tab_b} {_tab_c}", w: 400, h: 250, vars: { tab: "a" },
		ext: () => [tabs({ var: "tab", items: [{ label: "Overview", area: "a", sizeVar: "_tab_a" }, { label: "Details", area: "b", sizeVar: "_tab_b" }, { label: "Settings", area: "c", sizeVar: "_tab_c" }] }), animate({ duration: "0.2s" })],
		children: () => [
			<div key="a" style={{ background: "#1e3a5f", padding: 16, color: "#7fdbca", fontSize: 13, overflow: "hidden", height: "100%" }}><b>Overview</b><br/>Dashboard overview</div>,
			<div key="b" style={{ background: "#3a1e5f", padding: 16, color: "#c792ea", fontSize: 13, overflow: "hidden", height: "100%" }}><b>Details</b><br/>Detailed data</div>,
			<div key="c" style={{ background: "#1e5f3a", padding: 16, color: "#c3e88d", fontSize: 13, overflow: "hidden", height: "100%" }}><b>Settings</b><br/>Configuration</div>] },
	{ cat: "Extensions", name: "Overlay", layout: "| hmCf hcfm 8 | 40#40", w: 500, h: 280,
		ext: () => [overlay({ area: "m", over: "c" }), debug()],
		children: (v, p) => {
			let show = p?._showOverlay;
			return [<Box key="h" c={0}>Header</Box>,
				show ? <div key="m" style={{ background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", borderRadius: 4 }}><div style={{ background: "#1e2a4a", border: "1px solid #3a4a6a", borderRadius: 8, padding: "20px 28px", color: "#ccc", fontSize: 13, textAlign: "center" }}><div style={{ fontWeight: 700, color: "#7fdbca", marginBottom: 8 }}>Modal</div><div style={{ color: "#888" }}>Overlaying area "c"</div></div></div> : <div key="m" />,
				<div key="c" style={{ background: "#1a1a2e", padding: 16, color: "#888", fontSize: 12 }}>Content area</div>,
				<Box key="f" c={3}>Footer</Box>];
		},
		params: [{ key: "_showOverlay", label: "show overlay", type: "toggle", on: true, off: false }] },
	{ cat: "Extensions", name: "Multi-Column", layout: "hscf hhhh sccc ffff {g} | {sb}### | 40#40", w: 600, h: 300, vars: { sb: 200, g: 8 },
		ext: (v, p) => [multiColumn({ area: "c", fill: p?.fill || "auto" })],
		children: () => [<Box key="h" c={0}>Header</Box>, <div key="s" style={{ background: "#3a1e5f", padding: 12, color: "#c792ea", fontSize: 11 }}>Sidebar</div>, <div key="c" style={{ background: "#1a1a2e", padding: 12, color: "#999", fontSize: 12, lineHeight: 1.7 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</div>, <Box key="f" c={3}>Footer</Box>],
		params: [{ key: "sb", label: "sidebar", type: "range", min: 100, max: 350, def: 200 }, { key: "g", label: "gap", type: "range", min: 0, max: 20, def: 8 }, { key: "fill", label: "col-fill", type: "toggle", on: "balance", off: "auto" }] },

	// --- fisheye ---
	{ cat: "Fisheye", name: "Calendar 2D", layout: "*7 ?wh || 30", w: 280, h: 220,
		ext: (v, p) => [fisheye({ axis: p?.axis || "both", intensity: (p?.intensity || 60) / 100, min: (p?.minFr || 15) / 100 })],
		children: calendarCells, gridStyle: { cursor: "crosshair" },
		params: [{ key: "intensity", label: "intensity", type: "range", min: 10, max: 95, def: 60 }, { key: "minFr", label: "min fr%", type: "range", min: 5, max: 50, def: 15 }] },
	{ cat: "Fisheye", name: "Week View", layout: "*7 ?wh 2", w: 500, h: 160,
		ext: (v, p) => [fisheye({ axis: "x", intensity: (p?.intensity || 60) / 100, min: (p?.minFr || 15) / 100 })],
		children: () => ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((d, i) =>
			<div key={d} style={{ background: i < 5 ? "#1e2a3e" : "#2a1e3e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: "calc(6px + var(--fe-scale-x, 1) * 8px)", color: i < 5 ? "#7fdbca" : "#c792ea", fontWeight: 600, overflow: "hidden", gap: 4, height: "100%" }}>
				<span>{d}</span><span style={{ fontSize: "calc(var(--fe-scale-x, 1) * 9px)", color: "#555", opacity: "calc(var(--fe-scale-x, 1) * 0.8)" }}>{i < 5 ? "9am-5pm" : "Free"}</span>
			</div>),
		gridStyle: { cursor: "crosshair" },
		params: [{ key: "intensity", label: "intensity", type: "range", min: 10, max: 95, def: 60 }, { key: "minFr", label: "min fr%", type: "range", min: 5, max: 50, def: 15 }] },

	// --- auto-flow ---
	{ cat: "Auto-Flow", name: "Basic Grid", layout: "*4 4 ?wh", w: 400, h: 200,
		children: (v, p) => { let n = p?.n || 8; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 16, def: 8 }],
		info: "Auto-flow grid, 4 columns",
		src: '<Grid layout="*4 4 ?wh">\n  {items.map(i => <Card/>)}\n</Grid>' },
	{ cat: "Auto-Flow", name: "Column Flow", layout: "*3 4 ?whf", w: 400, h: 250,
		children: (v, p) => { let n = p?.n || 9; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 12, def: 9 }],
		info: "?f reverses flow: fills top?bottom, left?right",
		src: '<Grid layout="*3 4 ?whf">\n  {items}\n</Grid>' },
	{ cat: "Auto-Flow", name: "Dense Packing", layout: "*4 4 ?wF", w: 450, h: 280,
		children: () => {
			// use span pattern children: some span 2, leaving gaps that dense backfills
			let spans = [2, 1, 2, 1, 1, 2, 1, 1, 1, 2];
			return spans.map((sp, i) => {
				let wide = sp > 1;
				return <div key={i} style={{
					background: wide ? "#3a1e5f" : `hsl(${i * 35 + 180}, 35%, 22%)`,
					border: `1px solid ${wide ? "#5a2a8f" : `hsl(${i * 35 + 180}, 25%, 32%)`}`,
					borderRadius: 6, padding: "8px 12px", fontSize: 11, fontWeight: 600,
					color: wide ? "#c792ea" : `hsl(${i * 35 + 180}, 50%, 70%)`,
					display: "flex", alignItems: "center", justifyContent: "center",
				}}>{wide ? `Wide ${i + 1}` : i + 1}</div>;
			});
		},
		// override childSpans via a custom ext that sets grid-column on the wrapper
		ext: () => [{
			name: "_denseSpans",
			areaStyle: (area) => {
				let idx = parseInt(area.replace("c", ""));
				let spans = [2, 1, 2, 1, 1, 2, 1, 1, 1, 2];
				let sp = spans[idx];
				return sp > 1 ? { gridColumn: "span " + sp } : null;
		},
		}],
		info: "?F = dense — backfills gaps left by wide items. Remove ?F to see gaps.",
		src: '<Grid layout="*4 4 ?whF">\n  // wide items span 2 cols, dense backfills gaps\n</Grid>' },
	{ cat: "Auto-Flow", name: "Transpose |*N", layout: "|*3 4 ?wh", w: 400, h: 250,
		children: (v, p) => { let n = p?.n || 9; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 12, def: 9 }],
		info: "| transposes: 3 rows, children flow as columns",
		src: '<Grid layout="|*3 4 ?wh">\n  {items}\n</Grid>' },
	{ cat: "Auto-Flow", name: "Size Repeat *", layout: "*6 4 ?wh | 80 # *", w: 500, h: 200,
		children: (v, p) => { let n = p?.n || 12; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 18, def: 12 }],
		info: "Trailing * cycles col sizes: 80px # 80px # 80px #",
		src: '<Grid layout="*6 4 ?wh | 80 # *">\n  {items}\n</Grid>' },
	{ cat: "Auto-Flow", name: "Alternating Rows", layout: "*3 4 ?wh || 40 80 *", w: 400, h: 280,
		children: (v, p) => { let n = p?.n || 12; return Array.from({ length: n }, (_, i) => <Box key={i} c={i}>{i + 1}</Box>); },
		params: [{ key: "n", label: "children", type: "range", min: 1, max: 18, def: 12 }],
		info: "Row sizes cycle: 40px 80px 40px 80px ...",
		src: '<Grid layout="*3 4 ?wh || 40 80 *">\n  {items}\n</Grid>' },
	{ cat: "Auto-Flow", name: "Dashboard Grid", layout: "*4 6 ?whC | .*", w: 500, h: 300,
		ext: () => [{
			name: "_dashSpans",
			areaStyle: (area) => {
				let idx = parseInt(area.replace("c", ""));
				// first row: 2 wide cards, second row: 4 narrow, third row: 1 full-width + 3
				let spans = [2, 2, 1, 1, 1, 1, 4, 1, 1, 1];
				let sp = spans[idx];
				return sp > 1 ? { gridColumn: "span " + sp } : null;
			},
		}],
		children: () => {
			let labels = ["Revenue", "Users", "CPU", "Memory", "Disk", "Net", "Activity Log", "Alerts", "Tasks", "Deploy"];
			return labels.map((l, i) => {
				let hue = [200, 260, 150, 35, 350, 180, 220, 0, 280, 120][i];
			return <div key={i} style={{
					background: `hsl(${hue}, 30%, 16%)`, border: `1px solid hsl(${hue}, 20%, 28%)`,
					borderRadius: 6, padding: 10, fontSize: 11, fontWeight: 600,
					color: `hsl(${hue}, 50%, 65%)`, display: "flex", alignItems: "center", justifyContent: "center",
				}}>{l}</div>;
			});
		},
		info: "Mixed-span dashboard — wide cards via areaStyle extension" },
	{ cat: "Auto-Flow", name: "Scrollable Grid", layout: "*3 8 ?wh", w: 400, h: 250,
		ext: () => [scrollable({ area: ["c0", "c1", "c2", "c3", "c4", "c5"] })],
		children: () => Array.from({ length: 6 }, (_, i) =>
			<div key={i} style={{ background: `hsl(${i * 50 + 200}, 30%, 18%)`, border: `1px solid hsl(${i * 50 + 200}, 20%, 30%)`, borderRadius: 6, padding: 8, fontSize: 11, color: `hsl(${i * 50 + 200}, 50%, 65%)`, overflow: "auto" }}>
				<div style={{ fontWeight: 700, marginBottom: 4 }}>Panel {i + 1}</div>
				{loremItems(6)}
			</div>),
		info: "Auto-flow + scrollable extension (needsAreas)",
		src: '<Grid layout="*3 8 ?wh"\n  extensions={[scrollable({ area: ["c0","c1",...] })]}>\n  {panels}\n</Grid>' },

	// --- render ---
	{ cat: "Render", name: "Scrollable Table", layout: "*5 ?wh", w: 550, h: 300,
		ext: () => {
			let sg = { display: "grid", gridTemplateColumns: "subgrid", gridColumn: "1 / -1" };
			return [render({
				cell: (child, style, key) => <td key={key} style={style}>{child}</td>,
				container: ({ props, children, parsed }) => {
					let n = parsed.colCount;
					let cells = children.filter(c => c != null);
					let head = cells.slice(0, n);
					let body = cells.slice(n);
					let bodyRows = [];
					for (let i = 0; i < body.length; i += n) bodyRows.push(body.slice(i, i + n));
					return <table {...props} style={{ ...props.style, gridTemplateRows: "32px 1fr" }}>
						<thead style={sg}><tr style={sg}>{head}</tr></thead>
						<tbody style={{ ...sg, overflow: "auto", minHeight: 0, alignContent: "start" }}>
							{bodyRows.map((row, i) => <tr key={i} style={sg}>{row}</tr>)}
						</tbody>
					</table>;
				},
			})];
		},
		children: (v, p) => {
			let cols = ["Name", "Role", "Dept", "Status", "Score"];
			let data = [
				["Alice", "Engineer", "Platform", "Active", "94"],
				["Bob", "Designer", "Product", "Active", "87"],
				["Carol", "PM", "Growth", "On Leave", "91"],
				["Dave", "Engineer", "Infra", "Active", "88"],
				["Eve", "Analyst", "Data", "Active", "95"],
				["Frank", "Engineer", "Platform", "Active", "82"],
				["Grace", "Designer", "Brand", "Active", "90"],
				["Hank", "PM", "Core", "Inactive", "76"],
				["Iris", "Engineer", "Mobile", "Active", "93"],
				["Jack", "Analyst", "Data", "On Leave", "85"],
			];
			let n = p?.rows || 10;
			let hdr = cols.map((c, i) => <span key={"h" + i} style={{ fontWeight: 700, color: "#7fdbca", fontSize: 11, padding: "6px 10px", background: "#16213e", borderBottom: "2px solid #2a4a6a", whiteSpace: "nowrap" }}>{c}</span>);
			let rows = data.slice(0, n).flatMap((row, r) =>
				row.map((cell, c) => <span key={`r${r}c${c}`} style={{ padding: "4px", fontSize: 11, color: "#999", borderBottom: "1px solid #1a1a2e", whiteSpace: "nowrap", background: r % 2 ? "#111122" : "transparent" }}>{cell}</span>)
			);
			return [...hdr, ...rows];
		},
		params: [{ key: "rows", label: "rows", type: "range", min: 2, max: 10, def: 10 }],
		gridStyle: { borderCollapse: "collapse", tableLayout: "fixed" },
		info: "table/thead/tbody/tr/td — tbody scrolls, header stays synced via subgrid",
		src: 'render({\n  cell: (child, style, key) => <td ...>,\n  container: ({ props, children, parsed }) => {\n    // split children into head/body rows\n    return <table><thead>...</thead>\n      <tbody style={{overflow:"auto"}}>...</tbody>\n    </table>\n  }\n})' },
	{ cat: "Render", name: "Definition List", layout: "*2 4 ?w | .#", w: 400,
		ext: () => [render({
			cell: (child, style, key, idx, parsed) => {
				let Tag = idx % parsed.colCount === 0 ? "dt" : "dd";
				return <Tag key={key} style={style}>{child}</Tag>;
			},
			container: ({ props, children }) => <dl {...props}>{children}</dl>,
		})],
		children: () => {
			let items = [
				["gridpack", "CSS Grid layout DSL for React"],
				["layout", "Compact string describing grid areas"],
				["extension", "Composable behavioral plugin"],
				["auto-flow", "Automatic child placement in a grid"],
				["transpose", "Swap columns and rows with | prefix"],
			];
			return items.flatMap(([term, def], i) => [
				<span key={"t" + i} style={{ fontWeight: 700, color: "#c792ea", fontSize: 12, padding: "4px 0" }}>{term}</span>,
				<span key={"d" + i} style={{ color: "#888", fontSize: 12, padding: "4px 0" }}>{def}</span>,
			]);
		},
		info: "dl/dt/dd — cell callback picks tag based on column index",
		src: 'render({\n  cell: (child, style, key, idx, parsed) =>\n    idx % parsed.colCount===0\n      ? <dt ...> : <dd ...>,\n  container: ({props, children}) =>\n    <dl {...props}>{children}</dl>\n})' },
];

// ============================================================
// --- playground ---
// ============================================================

let categories = [...new Set(presets.map(p => p.cat))];

let Playground = () => {
	let [presetIdx, setPresetIdx] = React.useState(11); // holy grail
	let preset = presets[presetIdx];
	let [layout, setLayout] = React.useState(preset.layout);
	let [vars, setVars] = React.useState(preset.vars || {});
	let [params, setParams] = React.useState(() => {
		let d = {}; (preset.params || []).forEach(p => { if (p.def != null) d[p.key] = p.def; }); return d;
	});
	let [showGrid, setShowGrid] = React.useState(true);
	let [showDebug, setShowDebug] = React.useState(true);
	let [vars2, setVars2] = React.useState({ sb: 260 });

	let selectPreset = (idx) => {
		let p = presets[idx];
		setPresetIdx(idx);
		setLayout(p.layout);
		setVars(p.vars ? { ...p.vars } : {});
		let d = {}; (p.params || []).forEach(pm => { if (pm.def != null) d[pm.key] = pm.def; }); setParams(d);
	};

	let extensions = preset.ext ? preset.ext(vars, params) : [];
	if (showGrid) extensions = [...extensions, debug()];

	let allVars = { ...vars, ...params };
	let children = preset.children ? preset.children(allVars, params) : [];
	let childCount = Array.isArray(children) ? children.length : 0;

	let resolved = layout.replace(/\{(\w+)\}/g, (_, k) => allVars[k] ?? "");
	let parsed = parseGridLayout(resolved, childCount);

	// generated CSS
	let cssLines = [];
	if (!parsed.error) {
		let gs = toGridStyle(parsed);
		if (gs) cssLines = Object.entries(gs).map(([k, v]) => {
			let prop = k.replace(/([A-Z])/g, "-$1").toLowerCase();
			return `  ${prop}: ${v};`;
		});
	}

	// extension summary
	let extSummary = extensions.filter(e => e.name !== "debug").map(e => e.name).join(", ") || "none";

	// responsive props
	let responsiveProps = {};
	["xs","sm","md","lg","xl"].forEach(bp => { if (preset[bp]) responsiveProps[bp] = preset[bp]; });

	return <Grid layout="pC pc ?wh | {sb}#" vars={vars2} onVarsChange={setVars2} extensions={[
		scrollable({ area: ["p", "c"] }), splitPane({ var: "sb", edge: "p:e", min: 80, max: 300 })
	]}>
		<Style>{`
			.pg-input { width: 100%; background: #0f0f23; border: 1px solid #2a2a4a; border-radius: 4px; color: #c3e88d; font-family: inherit; font-size: 13px; padding: 8px 10px; resize: none; outline: none; line-height: 1.5; }
			.pg-input:focus { border-color: #7fdbca; }
			.pg-h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #fff; padding: 8px 10px 4px; }
			.pg-cat { font-size: 9px; color: #fff; text-transform: uppercase; letter-spacing: 1px; padding: 6px 8px 2px; }
			.pg-pre { display: block; width: 100%; text-align: left; background: none; border: 1px solid transparent; border-radius: 3px; color: #999; font-family: inherit; font-size: 11px; padding: 3px 8px; margin-bottom: 1px; cursor: pointer; transition: all 0.1s; }
			.pg-pre:hover { color: #ccc; background: #ffffff08; }
			.pg-pre.act { color: #7fdbca; border-color: #7fdbca40; background: #7fdbca10; }
			.pg-row { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
			.pg-row label { font-size: 12px; color: #9cc; min-width: 55px; }
			.pg-chk { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #9cc; cursor: pointer; }
			.pg-chk input { accent-color: #7fdbca; }
			.pg-dbg { background: #0f0f23; border: 1px solid #2a2a4a; border-radius: 4px; padding: 8px; font-size: 11px; line-height: 1.6; overflow: auto; }
			.pg-dbg .k { color: #c792ea; } .pg-dbg .v { color: #c3e88d; }
		`}</Style>

		{/* --- left panel --- */}
		<div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
			<div className="pg-h2">Layout</div>
			<div style={{ padding: "0 10px 4px" }}>
				<textarea className="pg-input" rows={3} spellCheck={false} value={layout} onChange={e => setLayout(e.target.value)} />
			</div>

			{(preset.params || []).length > 0 && <div style={{ padding: "2px 10px 4px" }}>
				{preset.params.map(pm => <div key={pm.key} className="pg-row">
					<label>{pm.label}</label>
					{pm.type === "range" && <>
						<input type="range" min={pm.min} max={pm.max} value={params[pm.key] ?? pm.def ?? pm.min} onChange={e => {
							let val = +e.target.value;
							setParams({ ...params, [pm.key]: val });
							if (vars[pm.key] != null) setVars({ ...vars, [pm.key]: val });
						}} style={{ flex: 1 }} />
						<span style={{ fontSize: 10, color: "#9cc", minWidth: 20 }}>{params[pm.key] ?? pm.def}</span>
					</>}
					{pm.type === "toggle" && <label className="pg-chk">
						<input type="checkbox" checked={params[pm.key]==pm.on} onChange={e => {
							let val = e.target.checked ? pm.on : pm.off;
							setParams({ ...params, [pm.key]: val });
							if (typeof pm.on === "number" && vars[pm.key] != null) setVars({ ...vars, [pm.key]: val });
						}} />
						{String(params[pm.key] ?? pm.off)}
					</label>}
				</div>)}
			</div>}

			<div style={{ padding: "0 10px 4px", display: "flex", gap: 10 }}>
				<label className="pg-chk"><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} /> grid</label>
				<label className="pg-chk"><input type="checkbox" checked={showDebug} onChange={e => setShowDebug(e.target.checked)} /> debug</label>
			</div>
			{preset.info && <div style={{ padding: "2px 10px 4px", fontSize: 10, color: "#f78c6c" }}>{preset.info}</div>}

			<div className="pg-h2">Presets</div>
			<div style={{ flex: 1, overflowY: "auto", padding: "0 10px 10px" }}>
				{categories.map(cat => <div key={cat}>
					<div className="pg-cat">{cat}</div>
					{presets.map((p, i) => p.cat !== cat ? null :
						<button key={i} className={`pg-pre ${i === presetIdx ? "act" : ""}`} onClick={() => selectPreset(i)}>{p.name}</button>
					)}
				</div>)}
			</div>
		</div>

		{/* --- right panel --- */}
		<div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
			<div className="pg-h2" style={{ display: "flex", gap: 8, alignItems: "center" }}>
				Preview <span style={{ color: "#fff8", fontSize: 9 }}>{preset.cat} / {preset.name}</span>
			</div>
			<div style={{ padding: "0 12px 8px", flexShrink: 0 }}>
				<div style={{ width: preset.w || "100%", height: preset.h || "auto", minHeight: 60, border: "1px dashed #2a2a4a", borderRadius: 4, position: "relative", overflow: "hidden", resize: "both" }}>
					<Grid layout={layout} vars={allVars} onVarsChange={setVars} extensions={extensions}
						style={{ ...(preset.gridStyle || {}) }}
						{...responsiveProps}>
						{children}
					</Grid>
				</div>
			</div>

			{showDebug && <div style={{ flex: 1, padding: "0 12px 12px", overflow: "auto" }}>
				<div className="pg-dbg">
					{parsed.error
						? <div style={{ color: "#ff5370" }}>Error: {parsed.error}</div>
						: <>
							{parsed.expanded && <div><span className="k">expanded: </span><span className="v">{parsed.areas.join(" ")}</span></div>}
							{parsed.repeatInfo && <div><span className="k">repeat: </span><span className="v">[{parsed.repeatInfo.pattern}] ×{parsed.repeatInfo.count}{parsed.repeatInfo.pinned?.length ? ` pinned [${parsed.repeatInfo.pinned}]` : ""}</span></div>}
							{parsed.templateAreas && <div><span className="k">areas: </span><span className="v">{parsed.templateAreas.join(" ")}</span></div>}
							<div><span className="k">cols: </span><span className="v">{parsed.colSizes.join(" ")}</span></div>
							<div><span className="k">rows: </span><span className="v">{parsed.rowSizes.join(" ")}</span></div>
							{parsed.gapH != null && <div><span className="k">gap: </span><span className="v">{parsed.gapH === parsed.gapV ? parsed.gapH + "px" : parsed.gapH + "px " + parsed.gapV + "px"}</span></div>}
							{parsed.flags?.justifyContent && <div><span className="k">justify: </span><span className="v">{parsed.flags.justifyContent}</span></div>}
							{parsed.flags?.alignContent && <div><span className="k">align: </span><span className="v">{parsed.flags.alignContent}</span></div>}
							<div><span className="k">extensions: </span><span className="v">{extSummary}</span></div>
							{Object.keys(vars).length > 0 && <div><span className="k">vars: </span><span className="v">{JSON.stringify(vars)}</span></div>}
							{Object.keys(params).length > 0 && <div><span className="k">params: </span><span className="v">{JSON.stringify(params)}</span></div>}
							<div style={{ borderTop: "1px solid #2a2a4a", margin: "6px 0 4px", paddingTop: 4 }}><span className="k">css:</span></div>
							<pre style={{ color: "#888", fontSize: 10, margin: 0, whiteSpace: "pre" }}>{"." + (preset.name.toLowerCase().replace(/\s+/g, "-")) + " {\n" + cssLines.join("\n") + "\n}"}</pre>
							{preset.src && <><div style={{ borderTop: "1px solid #2a2a4a", margin: "6px 0 4px", paddingTop: 4 }}><span className="k">example:</span></div><pre style={{ color: "#7fdbca", fontSize: 10, margin: 0, whiteSpace: "pre" }}>{preset.src}</pre></>}
						</>
					}
				</div>
			</div>}
		</div>
	</Grid>;
};

// ============================================================
// --- app ---
// ============================================================

import LandingPage from "./LandingPage";
import Docs from "./Docs";
import OgImage from "./OgImage";

export default function App() {
	let [tab,setTab] = React.useState("landing");
	let tabList = [["Welcome","landing"], ["Playground","playground"], ["Docs","docs"]];
	if (document.location.hash=="#og:image" && tab!="ogimage")
		setTab("ogimage");

	return <Grid layout="|?wh|.#" style={{height:"100vh"}}>
		<Style>{`
			/*
			@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');
			*/

			* { margin: 0; padding: 0; box-sizing: border-box; }
			body {
				--font-body: "DM Sans", sans-serif;
				--font-mono: "SF Mono", "Fira Code", monospace;
				/*--font-mono: "JetBrains Mono", monospace;*/
				font-family: var(--font-mono);

				background: #13131f; color: #ccc;
			}
			.demo-box { border-radius: 6px; padding: 12px 16px; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; min-height: 40px; height: 100%; width: 100%; }
			.c0 { background: #1e3a5f; color: #7fdbca; border: 1px solid #2a5a8f; }
			.c1 { background: #3a1e5f; color: #c792ea; border: 1px solid #5a2a8f; }
			.c2 { background: #1e5f3a; color: #c3e88d; border: 1px solid #2a8f5a; }
			.c3 { background: #5f3a1e; color: #f78c6c; border: 1px solid #8f5a2a; }
			.c4 { background: #5f1e3a; color: #ff5370; border: 1px solid #8f2a5a; }
			.c5 { background: #3a5f1e; color: #dcedc8; border: 1px solid #5a8f2a; }
			.c6 { background: #1e5f5f; color: #80cbc4; border: 1px solid #2a8f8f; }
			.c7 { background: #5f5f1e; color: #ffeb3b; border: 1px solid #8f8f2a; }
		`}</Style>
		<div style={{ padding: "12px", background: "#16213e", borderBottom: "1px solid #2a2a4a", display: "flex", alignItems: "center", gap: 8 }}>
			<svg width="28" height="28" viewBox="0 0 56 56"><path fill="#7fdbca" d=
				"m41.266 19.117l8.812-5.015c-.352-.352-.774-.633-1.289-.915l-16.523-9.42C30.813 2.946 29.406 2.5 28 2.5s-2.812.445-4.266 1.266L18.977 6.46ZM28 26.641l10.008-5.672l-22.195-12.68l-8.602 4.899c-.516.28-.937.562-1.29.914ZM29.594 53.5c.164-.047.304-.117.469-.21l18.351-10.454c2.18-1.242 3.375-2.508 3.375-5.906V18.672c0-.703-.07-1.266-.187-1.781L29.594 29.453Zm-3.188 0V29.453L4.4 16.891a7.8 7.8 0 0 0-.188 1.78V36.93c0 3.398 1.195 4.664 3.375 5.906l18.352 10.453c.164.094.304.164.468.211"
			/></svg>
			<span style={{ fontSize: 18, fontWeight: 700, color: "#7fdbca", marginRight: 8 }}>gridpack</span>
			{tabList.map(([name,tabId]) =>
				<button key={name} onClick={() => setTab(tabId)} style={{ background: "none", border: "none", color: tab==tabId ? "#7fdbca" : "#476", fontFamily: "inherit", fontSize: 14, cursor: "pointer", borderBottom: tab==tabId ? "2px solid #7fdbca" : "2px solid transparent", padding: "4px 8px" }}>{name}</button>
			)}
		</div>
		{tab=="landing" && <LandingPage onNavigate={setTab} />}
		{tab=="playground" && <Playground />}
		{tab=="docs" && <Docs />}
		{tab=="ogimage" && <OgImage />}
	</Grid>
}
