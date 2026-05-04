import React from "react";
import { parseGridLayout, toGridStyle, toAreaStyle } from "./grid-layout-dsl.js";

// --- default breakpoints (container-width based) ---
let DefaultBreaks = { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200 };
let BreakpointNames = ["xs", "sm", "md", "lg", "xl"];

// --- useContainerWidth: ResizeObserver hook ---
let useContainerWidth = (ref) => {
	let [width, setWidth] = React.useState(0);
	React.useEffect(() => {
		let el = ref.current;
		if (!el) return;
		setWidth(el.clientWidth);
		let observer = new ResizeObserver(entries => {
			for (let entry of entries) {
				let w = entry.contentBoxSize
					? entry.contentBoxSize[0]?.inlineSize
					: entry.contentRect.width;
				setWidth(Math.round(w));
			}
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, [ref]);
	return width;
};

// --- resolve active layout from breakpoint props ---
let resolveLayout = (baseLayout, bpLayouts, breaks, width) => {
	if (width === 0) return baseLayout;

	// walk breakpoints descending, find largest that fits
	let sorted = [...BreakpointNames]
		.map(name => ({ name, px: breaks[name] ?? DefaultBreaks[name] }))
		.sort((a, b) => b.px - a.px);
	for (let { name, px } of sorted) {
		if (width >= px && bpLayouts[name]) return bpLayouts[name];
	}
	return baseLayout;
};

// --- flatten children helper ---
let flattenChildren = (children) => {
	let arr = [];
	let flatten = (c) => {
		if (c == null || typeof c === "boolean") return;
		if (Array.isArray(c)) c.forEach(flatten);
		else arr.push(c);
	};
	flatten(children);
	return arr;
};

// ============================================================
// --- extensions ---
// ============================================================

// --- debug: cell overlay ---
let debug = (opts = {}) => ({
	name: "debug",
	render: ({ parsed }) => {
		let color = opts.color || "rgba(255,255,255,0.25)";
		let elements = [];
		for (let r = 0; r < parsed.rowCount; r++) {
			for (let c = 0; c < parsed.colCount; c++) {
				elements.push(
					<div key={`debug-${r}-${c}`} style={{
						gridRow: `${r + 1} / ${r + 2}`,
						gridColumn: `${c + 1} / ${c + 2}`,
						border: `1px dashed ${color}`,
						pointerEvents: "none",
						zIndex: 1000,
					}} />
				);
			}
		}
		return elements;
	},
});

// --- collapsible: toggle an area between expanded/collapsed ---
// uses a var to control the size, toggles on click
// opts: { var, expanded, collapsed, area, handle }
// - var: name of the var to control (e.g. "sidebar")
// - expanded: value when expanded (default: 250)
// - collapsed: value when collapsed (default: 0)
// - area: which area to place the toggle handle in
// - handle: "start" | "end" | "top" | "bottom" — where the toggle renders
let collapsible = (opts) => ({
	name: "collapsible",
	render: ({ parsed, vars, setVar, containerRef }) => {
		let { var: varName, expanded = 250, collapsed = 0, area, handle = "end" } = opts;
		let isCollapsed = (vars[varName] ?? expanded) <= collapsed;

		let isVertical = handle === "start" || handle === "end";
		let handleStyle = {
			gridArea: area,
			alignSelf: handle === "top" || handle === "start" ? "start" :
				handle === "bottom" || handle === "end" ? "end" : "center",
			justifySelf: isVertical ? "end" : "center",
			width: isVertical ? "16px" : "100%",
			height: isVertical ? "100%" : "16px",
			cursor: "pointer",
			display: "flex",
			alignItems: "center",
			justifyContent: "end",
			zIndex: 100,
			userSelect: "none",
			fontSize: "10px",
			color: "rgba(255,255,255,0.4)",
			pointerEvents: "auto",
			position: "relative",
			left: 8,
		};

		let arrow = isCollapsed
			? (isVertical ? "\u25B6" : "\u25BC")
			: (isVertical ? "\u25C0" : "\u25B2");

		let toggle = () => setVar(varName, isCollapsed ? expanded : collapsed);

		return [
			<div key={`collapse-${varName}`} style={handleStyle} onClick={toggle}>{arrow}</div>
		];
	},
	containerStyle: () => ({ /*transition: "grid-template-columns 0.2s, grid-template-rows 0.2s",*/ overflow: "unset" }),
});

// --- accordion: mutual exclusion — expanding one collapses others ---
// opts: { var, items: [{ area, expanded }], collapsed }
// the var holds the currently expanded area name (or null for all collapsed)
let accordion = (opts) => ({
	name: "accordion",
	render: ({ parsed, vars, setVar }) => {
		let { var: varName, items, collapsed = 0 } = opts;
		let activeArea = vars[varName] ?? null;

		return items.map(item => {
			let isActive = activeArea === item.area;
			let handleStyle = {
				gridArea: item.area,
				alignSelf: "start",
				justifySelf: "stretch",
				height: "24px",
				cursor: "pointer",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 100,
				userSelect: "none",
				fontSize: "10px",
				color: "rgba(255,255,255,0.5)",
				background: "rgba(255,255,255,0.05)",
				borderRadius: "2px",
				pointerEvents: "auto",
			};

			let toggle = () => setVar(varName, isActive ? null : item.area);
			let arrow = isActive ? "\u25B2" : "\u25BC";

			return (
				<div key={`accordion-${item.area}`} style={handleStyle} onClick={toggle}>
					{item.area} {arrow}
				</div>
			);
		});
	},
	// accordion needs to set size vars for each item based on active state
	transformVars: (vars, opts2) => {
		let { var: varName, items, collapsed = 0 } = opts;
		let activeArea = vars[varName] ?? null;
		let newVars = { ...vars };
		for (let item of items) {
			if (item.sizeVar) newVars[item.sizeVar] = activeArea === item.area ? (item.expanded || 200) : collapsed;
		}
		return newVars;
	},
});

// --- splitPane: draggable handle between areas ---
// opts: { var, edge, axis, min, max }
// - var: name of the var to control
// - edge: "a:e" means right edge of area a, "b:s" means left edge of area b
//         "a:S" / "a:E" for top/bottom (vertical splits)
// - axis: "x" | "y" — inferred from edge if not specified
// - min/max: pixel constraints
let splitPane = (opts) => ({
	name: "splitPane",
	render: ({ parsed, vars, setVar, containerRef }) => {
		let { var: varName, edge, axis: axisOpt, min = 0, max = 9999, handleSize = 6 } = opts;

		// parse edge: "a:e" → area a, side end
		let [edgeArea, edgeSide] = edge.split(":");
		let axis = axisOpt || (edgeSide === "s" || edgeSide === "e" ? "x" : "y");
		let isX = axis === "x";

		let handleStyle = {
			gridArea: edgeArea,
			alignSelf: "stretch",
			justifySelf: "stretch",
			position: "relative",
			zIndex: 200,
			pointerEvents: "none",
		};

		let barStyle = {
			position: "absolute",
			pointerEvents: "auto",
			zIndex: 201,
			...(isX ? {
				top: 0, bottom: 0, width: handleSize + "px",
				cursor: "col-resize",
				[edgeSide === "e" || edgeSide === "E" ? "right" : "left"]: -Math.floor(handleSize / 2) + "px",
			} : {
				left: 0, right: 0, height: handleSize + "px",
				cursor: "row-resize",
				[edgeSide === "E" || edgeSide === "S" ? "bottom" : "top"]: -Math.floor(handleSize / 2) + "px",
			}),
			background: "rgba(255,255,255,0.08)",
			transition: "background 0.15s",
		};

		let onMouseDown = (e) => {
			e.preventDefault();
			let container = containerRef.current;
			if (!container) return;
			let startPos = isX ? e.clientX : e.clientY;
			let startVal = parseFloat(vars[varName]) || 0;

			// invert direction for right/bottom edges
			let invert = edgeSide === "s" || edgeSide === "S" ? -1 : 1;

			let onMouseMove = (e2) => {
				let delta = ((isX ? e2.clientX : e2.clientY) - startPos) * invert;
				let newVal = Math.round(Math.min(max, Math.max(min, startVal + delta)));
				setVar(varName, newVal);
			};

			let onMouseUp = () => {
				document.removeEventListener("mousemove", onMouseMove);
				document.removeEventListener("mouseup", onMouseUp);
				document.body.style.cursor = "";
				document.body.style.userSelect = "";
			};

			document.body.style.cursor = isX ? "col-resize" : "row-resize";
			document.body.style.userSelect = "none";
			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("mouseup", onMouseUp);
		};

		return [
			<div key={`split-zone-${varName}`} style={handleStyle}>
				<div
					style={barStyle}
					onMouseDown={onMouseDown}
					onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.2)"}
					onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.08)"}
				/>
			</div>
		];
	},
});

// --- scrollable: make an area scrollable ---
// opts: { area, axis? }
// axis: "both" (default) | "x" | "y"
let scrollable = (opts) => ({
	name: "scrollable",
	render: ({ parsed }) => {
		let areas = Array.isArray(opts.area) ? opts.area : [opts.area];
		let axis = opts.axis || "both";
		let overflow = axis === "x" ? { overflowX: "auto", overflowY: "hidden" }
			: axis === "y" ? { overflowX: "hidden", overflowY: "auto" }
			: { overflow: "auto" };
		return areas.map(area => <div key={`scroll-${area}`} style={{
			gridArea: area, alignSelf: "stretch", justifySelf: "stretch",
			...overflow, pointerEvents: "none", zIndex: 0,
		}} />);
	},
	// the real work: inject overflow on the area's wrapper div
	areaStyle: (area) => {
		let areas = Array.isArray(opts.area) ? opts.area : [opts.area];
		if (!areas.includes(area)) return null;
		let axis = opts.axis || "both";
		if (axis === "x") return { overflowX: "auto", overflowY: "hidden" };
		if (axis === "y") return { overflowX: "hidden", overflowY: "auto" };
		return { overflow: "auto" };
	},
});

// --- overlay: place an area on top of another area's grid cells ---
// opts: { area, over, blur? }
// the overlay area gets the same grid-row/grid-column as the "over" area, with high z-index
// optionally adds a backdrop blur
let overlay = (opts) => ({
	name: "overlay",
	areaStyle: (area, vars) => {
		if (area !== opts.area) return null;
		// override grid-area with explicit row/col matching the "over" target
		// we can't resolve this here since we don't know the parsed grid positions
		// instead we mark it for the render hook to handle
		return { zIndex: 500, position: "relative" };
	},
	render: ({ parsed }) => {
		// find the "over" area's grid position from template-areas
		// and inject it as grid-row/grid-column on the overlay area's wrapper
		// but we can't modify the wrapper from render — we return overlay elements instead
		return [];
	},
	// the key trick: remap the area in the parsed result so it covers the "over" area's cells
	transformAreas: (parsed) => {
		if (!opts.over) return parsed;
		// find bounding box of "over" area in templateAreas
		let rows = parsed.templateAreas.map(r => r.replace(/"/g, "").trim().split(/\s+/));
		let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;
		for (let r = 0; r < rows.length; r++) {
			for (let c = 0; c < rows[r].length; c++) {
				if (rows[r][c] === opts.over) {
					minR = Math.min(minR, r); maxR = Math.max(maxR, r);
					minC = Math.min(minC, c); maxC = Math.max(maxC, c);
				}
			}
		}
		if (minR > maxR) return parsed; // "over" area not found
		return { ...parsed, _overlayPositions: { ...parsed._overlayPositions, [opts.area]: { row: `${minR+1}/${maxR+2}`, col: `${minC+1}/${maxC+2}` } } };
	},
});

// --- animate: CSS transitions on grid changes ---
// opts: { properties?, duration?, easing? }
let animate = (opts = {}) => ({
	name: "animate",
	containerStyle: () => {
		let props = opts.properties || ["grid-template-columns", "grid-template-rows"];
		let dur = opts.duration || "0.25s";
		let ease = opts.easing || "ease";
		return { transition: props.map(p => `${p} ${dur} ${ease}`).join(", ") };
	},
});

// --- multiColumn: CSS multi-column inside an area, aligned to grid tracks ---
// opts: { area }
// reads computed grid column widths and sets column-width/column-gap to match
let multiColumn = (opts) => ({
	name: "multiColumn",
	render: ({ containerRef, parsed }) => {
		let area = opts.area;
		// find which grid columns this area spans
		let rows = parsed.templateAreas.map(r => r.replace(/"/g, "").trim().split(/\s+/));
		let minC = Infinity, maxC = -1;
		for (let r of rows)
			for (let c = 0; c < r.length; c++)
				if (r[c] === area) { minC = Math.min(minC, c); maxC = Math.max(maxC, c); }
		if (minC > maxC) return [];

		let spanCount = maxC - minC + 1;
		if (spanCount <= 1) return []; // single column, nothing to do

		// we need to measure actual computed track widths after render
		// use a zero-height measuring element that spans the area
		// and a ResizeObserver / useEffect to read computed column widths
		// but since render returns static elements, we'll use a self-measuring component
		return [<MultiColumnMeasurer key={`mcol-${area}`} area={area} spanStart={minC} spanCount={spanCount} containerRef={containerRef} gapH={parsed.gapH} fill={opts.fill} />];
	},
	areaStyle: (area) => {
		if (area !== opts.area) return null;
		// mark for multi-column — actual values set by measurer
		return { _multiColumn: true };
	},
});

// helper component that measures grid tracks and applies CSS columns
let MultiColumnMeasurer = ({ area, spanStart, spanCount, containerRef, gapH, fill }) => {
	React.useEffect(() => {
		let container = containerRef.current;
		if (!container) return;

		let update = () => {
			let computed = getComputedStyle(container);
			let colWidths = computed.gridTemplateColumns.split(/\s+/).map(parseFloat);
			let gap = parseFloat(computed.columnGap) || gapH || 0;

			// find the area's wrapper div by grid-area
			let areaEl = container.querySelector(`[style*="grid-area: ${area}"]`) ||
				container.querySelector(`[style*="grid-area:${area}"]`);
			if (!areaEl) return;

			// each spanned grid column becomes a CSS column
			// column-width = first track width (they may differ, use min for safety)
			let trackWidths = colWidths.slice(spanStart, spanStart + spanCount);
			let minTrack = Math.min(...trackWidths);

			areaEl.style.columnCount = spanCount;
			areaEl.style.columnGap = gap + "px";
			areaEl.style.columnWidth = minTrack + "px";
			if (fill) areaEl.style.columnFill = fill;
		};

		update();
		let observer = new ResizeObserver(update);
		observer.observe(container);
		return () => observer.disconnect();
	}, [area, spanStart, spanCount, containerRef, gapH, fill]);

	return null; // invisible, just runs the effect
};

// --- fisheye: grid tracks expand near cursor, compress away ---
// works in fr units — only redistributes fr-based tracks, fixed tracks (px, auto) stay untouched
// opts: { axis?, intensity?, min?, sticky? }
// sets --fe-scale, --fe-scale-x, --fe-scale-y CSS custom properties on each child
let FisheyeEffect = ({ containerRef, parsed, axis, intensity, minFr, stickyMode }) => {
	React.useEffect(() => {
		let container = containerRef.current;
		if (!container) return;
		let raf = null;

		let colSizes = parsed.colSizes;
		let rowSizes = parsed.rowSizes;
		let colFlex = colSizes.map(s => s.includes("fr"));
		let rowFlex = rowSizes.map(s => s.includes("fr"));
		let flexColCount = colFlex.filter(Boolean).length;
		let flexRowCount = rowFlex.filter(Boolean).length;

		let gaussian = (dist, sigma) => sigma === 0 ? 1 : Math.exp(-(dist * dist) / (2 * sigma * sigma));

		let computeFr = (flexMask, cursorRatio) => {
			let totalTracks = flexMask.length;
			let flexCount = flexMask.filter(Boolean).length;
			if (flexCount === 0) return flexMask.map(() => 1);
			let sigma = 0.3 * intensity;
			let boost = 1 + intensity * 2;
			let frs = flexMask.map((isFlex, i) => {
				if (!isFlex) return 1;
				let center = (i + 0.5) / totalTracks;
				let w = gaussian(Math.abs(center - cursorRatio), sigma);
				return Math.max(minFr, 1 + (boost - 1) * w - (1 - w) * intensity * 0.5);
			});
			let flexFrs = frs.filter((_, i) => flexMask[i]);
			let avg = flexFrs.reduce((a, b) => a + b, 0) / flexCount;
			return frs.map((f, i) => flexMask[i] ? f / avg : 1);
		};

		let buildSizeStr = (origSizes, flexMask, frs) =>
			origSizes.map((s, i) => flexMask[i] ? frs[i].toFixed(4) + "fr" : s).join(" ");

		let applyScales = (colFrs, rowFrs) => {
			let colCount = parsed.colCount;
			for (let child of container.children) {
				let cs = getComputedStyle(child);
				let col = parseInt(cs.gridColumnStart);
				let row = parseInt(cs.gridRowStart);
				// fallback for named areas: extract index from gridArea like "c15"
				if (isNaN(col) || isNaN(row)) {
					let area = (child.style.gridArea || "").trim();
					let match = area.match(/^c(\d+)$/);
					if (match) {
						let idx = parseInt(match[1]);
						col = (idx % colCount) + 1;
						row = Math.floor(idx / colCount) + 1;
					}
				}
				let sx = !isNaN(col) && col > 0 && col <= colFrs.length ? colFrs[col - 1] : 1;
				let sy = !isNaN(row) && row > 0 && row <= rowFrs.length ? rowFrs[row - 1] : 1;
				child.style.setProperty("--fe-scale", Math.min(sx, sy).toFixed(3));
				child.style.setProperty("--fe-scale-x", sx.toFixed(3));
				child.style.setProperty("--fe-scale-y", sy.toFixed(3));
			}
		};

		let onMouseMove = (e) => {
			let rect = container.getBoundingClientRect();
			if (raf) cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				let colFrs = Array(colSizes.length).fill(1);
				let rowFrs = Array(rowSizes.length).fill(1);
				if ((axis === "x" || axis === "both") && flexColCount > 0) {
					colFrs = computeFr(colFlex, (e.clientX - rect.left) / rect.width);
					container.style.gridTemplateColumns = buildSizeStr(colSizes, colFlex, colFrs);
				}
				if ((axis === "y" || axis === "both") && flexRowCount > 0) {
					rowFrs = computeFr(rowFlex, (e.clientY - rect.top) / rect.height);
					container.style.gridTemplateRows = buildSizeStr(rowSizes, rowFlex, rowFrs);
				}
				applyScales(colFrs, rowFrs);
			});
		};

		let onMouseLeave = () => {
			if (stickyMode) return;
			if (raf) cancelAnimationFrame(raf);
			if (axis === "x" || axis === "both")
				container.style.gridTemplateColumns = colSizes.join(" ");
			if (axis === "y" || axis === "both")
				container.style.gridTemplateRows = rowSizes.join(" ");
			applyScales(Array(colSizes.length).fill(1), Array(rowSizes.length).fill(1));
		};

		container.addEventListener("mousemove", onMouseMove);
		container.addEventListener("mouseleave", onMouseLeave);
		return () => {
			container.removeEventListener("mousemove", onMouseMove);
			container.removeEventListener("mouseleave", onMouseLeave);
			if (raf) cancelAnimationFrame(raf);
		};
	}, [containerRef, parsed, axis, intensity, minFr, stickyMode]);

	return null;
};

let fisheye = (opts = {}) => ({
	name: "fisheye",
	render: ({ containerRef, parsed }) => {
		let { axis = "x", intensity = 0.6, min: minFr = 0.15, sticky: stickyMode = false } = opts;
		return [<FisheyeEffect key="fisheye" containerRef={containerRef} parsed={parsed}
			axis={axis} intensity={intensity} minFr={minFr} stickyMode={stickyMode} />];
	},
});

// --- tabs: tab headers with content switching ---
// opts: { var, items: [{ label, area }], position? }
// position: "top" (default) | "bottom"
let tabs = (opts) => ({
	name: "tabs",
	render: ({ vars, setVar }) => {
		let { var: varName, items, position = "top" } = opts;
		let activeArea = vars[varName] ?? items[0]?.area;

		let barStyle = {
			gridColumn: "1 / -1",
			gridRow: position === "bottom" ? "-1" : "1",
			display: "flex", gap: 0,
			background: "rgba(255,255,255,0.03)",
			borderBottom: position === "top" ? "1px solid rgba(255,255,255,0.1)" : "none",
			borderTop: position === "bottom" ? "1px solid rgba(255,255,255,0.1)" : "none",
			zIndex: 100, alignSelf: "stretch", justifySelf: "stretch",
		};

		let tabButtons = items.map(item => {
			let isActive = activeArea === item.area;
			return <div key={`tab-${item.area}`} onClick={() => setVar(varName, item.area)} style={{
				padding: "6px 14px", cursor: "pointer", fontSize: 11, userSelect: "none",
				color: isActive ? "rgba(127,219,202,1)" : "rgba(255,255,255,0.4)",
				borderBottom: isActive ? "2px solid rgba(127,219,202,1)" : "2px solid transparent",
				transition: "all 0.15s",
			}}>{item.label || item.area}</div>;
		});

		return [<div key="tab-bar" style={barStyle}>{tabButtons}</div>];
	},
	// hide inactive areas by setting height to 0
	areaStyle: (area) => {
		let { var: varName, items } = opts;
		let isTabArea = items.some(it => it.area === area);
		if (!isTabArea) return null;
		// we can't read vars here directly, but we can return a function-like marker
		// actually areaStyle gets vars passed — let's adjust the interface
		return { _tabVar: varName, _tabArea: area };
	},
	transformVars: (vars) => {
		let { var: varName, items } = opts;
		let activeArea = vars[varName] ?? items[0]?.area;
		let newVars = { ...vars };
		for (let item of items) {
			let sizeVar = item.sizeVar || ("_tab_" + item.area);
			newVars[sizeVar] = activeArea === item.area ? "." : "0";
		}
		return newVars;
	},
});

// ============================================================
// --- Grid component ---
// ============================================================

let Grid = ({ layout, col, gap, breaks, xs, sm, md, lg, xl,
	vars: varsProp, onVarsChange, extensions = [],
	className, style, children, ...rest
}) => {
	// --- internal vars state (used when uncontrolled) ---
	let [internalVars, setInternalVars] = React.useState({});
	let vars = varsProp ?? internalVars;
	let setVar = React.useCallback((key, val) => {
		let next = { ...vars, [key]: val };
		if (onVarsChange) onVarsChange(next);
		else setInternalVars(next);
	}, [vars, onVarsChange]);

	// --- apply transformVars from extensions ---
	let effectiveVars = vars;
	for (let ext of extensions) {
		if (ext.transformVars) effectiveVars = ext.transformVars(effectiveVars);
	}

	// --- responsive ---
	let bpLayouts = { xs, sm, md, lg, xl };
	let hasResponsive = BreakpointNames.some(n => bpLayouts[n]);

	let containerRef = React.useRef(null);

	let isArea = c => c.type!="style" && c.type.name!="Style" && !c.type?.__notAComponent;
	let childArray = React.useMemo(() => flattenChildren(children), [children]);
	let childCount = childArray.filter(isArea).length;

	// resolve layout string
	let baseLayout = layout || "";
	if (col && !baseLayout.startsWith("|")) baseLayout = "|" + baseLayout;

	// check if base layout produces a full-width grid
	let baseResolved = baseLayout;
	if (effectiveVars) baseResolved = baseResolved.replace(/\{(\w+)\}/g, (_, k) => effectiveVars[k] ?? "");
	let baseParsed = React.useMemo(() => parseGridLayout(baseResolved, childCount), [baseResolved, childCount]);
	let baseIsFullWidth = !baseParsed.error && (
		baseParsed.flags?.fullWidth ||
		baseParsed.growAreas?.length > 0
//		||
//		baseParsed.colSizes?.some(s => s.includes("fr"))
	);

	// only observe when responsive AND the grid is externally sized (full width)
	let shouldObserve = hasResponsive && baseIsFullWidth;
	let width = useContainerWidth(shouldObserve ? containerRef : { current: null }, breaks);

	let activeLayout = hasResponsive
		? resolveLayout(baseLayout, bpLayouts, breaks || {}, width)
		: baseLayout;

	// replace {varname} placeholders
	if (effectiveVars)
		activeLayout = activeLayout.replace(/\{(\w+)\}/g, (_, k) => effectiveVars[k] ?? "");

	// parse
	let parsed = React.useMemo(
		() => parseGridLayout(activeLayout, childCount),
		[activeLayout, childCount],
	);

	if (parsed.error) {
		console.warn("Grid layout error:", parsed.error);
		return <div ref={containerRef} className={className} style={style} {...rest}>{children}</div>;
	}

	// build container style
	let gridStyle = toGridStyle(parsed);

	// override gap from prop if provided
	if (gap != null) gridStyle.gap = typeof gap === "number" ? gap + "px" : gap;

	// apply extension container styles
	for (let ext of extensions) {
		if (ext.containerStyle) Object.assign(gridStyle, ext.containerStyle({ parsed, vars: effectiveVars }));
	}

	// apply transformAreas (overlay positioning)
	let effectiveParsed = parsed;
	for (let ext of extensions) {
		if (ext.transformAreas) effectiveParsed = ext.transformAreas(effectiveParsed);
	}
	let overlayPositions = effectiveParsed._overlayPositions || {};

	// merge with user style
	let containerStyle = { ...gridStyle, ...style };

	// assign children to areas
	let i = 0;
	let mappedChildren = childArray.map(child => {
		if (i >= parsed.areas.length) return child; // overflow children render without grid-area
		let area = parsed.areas[i];
		if (!parsed.templateAreas.some(t => t.includes(area))) { i++; return null; }
		let areaStyle = toAreaStyle(parsed, area);

		// apply overlay position overrides (replaces grid-area with explicit row/col)
		let ovPos = overlayPositions[area];
		if (ovPos) {
			delete areaStyle.gridArea;
			areaStyle.gridRow = ovPos.row;
			areaStyle.gridColumn = ovPos.col;
			areaStyle.zIndex = 500;
		}

		// apply extension area styles
		for (let ext of extensions) {
			if (ext.areaStyle) {
				let extStyle = ext.areaStyle(area, effectiveVars);
				if (extStyle) {
					// filter out internal markers
					let clean = {};
					for (let [k, v] of Object.entries(extStyle)) { if (!k.startsWith("_")) clean[k] = v; }
					Object.assign(areaStyle, clean);
				}
			}
		}
		return isArea(child) ? <div key={area + "-" + i++} style={areaStyle}>{child}</div> : child;
	});

	// --- render extension elements ---
	let extCtx = { parsed, vars: effectiveVars, setVar, containerRef };
	let extensionElements = extensions.flatMap(ext => ext.render ? ext.render(extCtx) : []);

	return <div ref={containerRef} className={className} style={containerStyle} {...rest}>
		{mappedChildren}
		{extensionElements}
	</div>
};

export default Grid;
export { Grid, DefaultBreaks, useContainerWidth, debug,
	collapsible, accordion, splitPane, scrollable, overlay, animate, tabs, multiColumn, fisheye };
