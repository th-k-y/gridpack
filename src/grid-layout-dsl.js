// grid-layout-dsl.js
// Compact grid layout DSL parser
// Input: layout string + optional child count
// Output: CSS grid properties ready to apply

let tokenizeSizes = (s) => {
	let tokens = [], buf = "";
	let flush = () => { if (buf) { tokens.push(buf); buf = ""; } };
	for (let i = 0; i < s.length; i++) {
		let ch = s[i];
		if (ch === " " || ch === "\t") flush();
		else if (ch === "~") buf += ch;
		else if (ch === "." || ch === "#") {
			let prevTilde = buf.endsWith("~");
			let nextTilde = i + 1 < s.length && s[i + 1] === "~";
			if (prevTilde || nextTilde) buf += ch;
			else { flush(); tokens.push(ch); }
		} else buf += ch;
	}
	flush();
	return tokens;
};

let normSizeAtom = (s) => {
	if (s === ".") return "auto";
	if (s === "#") return "1fr";
	if (/^\d+(\.\d+)?$/.test(s)) return s + "px";
	return s;
};

let normSize = (s) => {
	if (s.includes("~")) {
		let [min, max] = s.split("~");
		return `minmax(${normSizeAtom(min)}, ${normSizeAtom(max)})`;
	}
	return normSizeAtom(s);
};

// --- ? flags: secbag/SECBAG + w/h ---
let JustifyMap = { s: "start", e: "end", c: "center", b: "space-between", a: "space-around", g: "space-evenly" };
let AlignMap = { S: "start", E: "end", C: "center", B: "space-between", A: "space-around", G: "space-evenly" };

let parseFlags = (str) => {
	let f = { fullWidth: false, fullHeight: false, justifyContent: null, alignContent: null };
	for (let ch of str) {
		if (ch === "w") f.fullWidth = true;
		else if (ch === "h") f.fullHeight = true;
		else if (JustifyMap[ch]) f.justifyContent = JustifyMap[ch];
		else if (AlignMap[ch]) f.alignContent = AlignMap[ch];
	}
	return f;
};

// --- legend parser: a(eC)B(s)c ---
let SelfJMap = { s: "start", e: "end", c: "center", l: "baseline" };
let SelfAMap = { S: "start", E: "end", C: "center", L: "baseline" };

let parseLegend = (legend) => {
	let areas = [], growAreas = new Set(), areaAlign = {};
	let i = 0;
	while (i < legend.length) {
		let ch = legend[i];
		if (!/[a-zA-Z]/.test(ch)) return { error: `invalid legend char "${ch}"` };
		let areaLetter = ch.toLowerCase();
		if (ch !== ch.toLowerCase()) growAreas.add(areaLetter);
		let justifySelf = null, alignSelf = null;
		if (i + 1 < legend.length && legend[i + 1] === "(") {
			let close = legend.indexOf(")", i + 2);
			if (close === -1) return { error: `unclosed '(' after "${ch}"` };
			let mods = legend.substring(i + 2, close);
			for (let m of mods) {
				if (SelfJMap[m]) justifySelf = SelfJMap[m];
				else if (SelfAMap[m]) alignSelf = SelfAMap[m];
				else return { error: `unknown modifier "${m}" in "${ch}(${mods})"` };
			}
			i = close + 1;
		} else i++;
		areas.push(areaLetter);
		if (justifySelf || alignSelf) areaAlign[areaLetter] = { justifySelf, alignSelf };
	}
	return { areas, growAreas, areaAlign };
};

// --- main parser ---
let parseGridLayout = (input, childCount) => {
	input = (input || "").trim();
	if (!input && childCount > 0) input = "*";

	let transpose = false;
	if (input.startsWith("|")) {
		transpose = true;
		input = input.substring(1).trim();
		if (!input && childCount > 0) input = "*";
	}
	if (!input) return { error: "empty layout" };

	let pipeParts = input.split("|").map(s => s.trim());
	let mainPart = pipeParts[0], colSizes = pipeParts[1] || null, rowSizes = pipeParts[2] || null;

	// tokenize main part, preserving parenthesized groups
	let segments = [], buf = "", depth = 0;
	for (let ch of mainPart) {
		if (ch === "(") { depth++; buf += ch; }
		else if (ch === ")") { depth--; buf += ch; }
		else if (depth === 0 && (ch === " " || ch === "\t" || ch === ",")) {
			if (buf) { segments.push(buf); buf = ""; }
		} else buf += ch;
	}
	if (buf) segments.push(buf);

	// extract ? flags (floating position)
	let flags = { fullWidth: false, fullHeight: false, justifyContent: null, alignContent: null };
	let remaining = [];
	for (let seg of segments) {
		if (seg.startsWith("?")) {
			let f = parseFlags(seg.substring(1));
			if (f.fullWidth) flags.fullWidth = true;
			if (f.fullHeight) flags.fullHeight = true;
			if (f.justifyContent) flags.justifyContent = f.justifyContent;
			if (f.alignContent) flags.alignContent = f.alignContent;
		} else remaining.push(seg);
	}
	segments = remaining;

	// all-numeric = gap only, prepend *
	if (segments.length > 0 && segments.every(s => /^\d+(\.\d+)?$/.test(s))) {
		if (childCount > 0) segments.unshift("*");
		else return { error: "gap without layout" };
	}
	if (segments.length < 1) {
		if (childCount > 0) segments = ["*"];
		else return { error: "need at least a legend or *" };
	}

	// expand * or *N legend
	let expanded = false;
	let autoFlow = 0; // >0 means auto-flow grid with N columns
	if (/^\*\d*$/.test(segments[0])) {
		if (!childCount || childCount < 1) return { error: "* requires children > 0" };
		let colNum = parseInt(segments[0].substring(1)) || 0; // *7 ? 7, * ? 0
		if (colNum > 0) {
			// auto-flow mode: *N creates N columns, ceil(children/N) rows
			autoFlow = colNum;

			// extract trailing gap(s) from remaining segments
			let localGapH = null, localGapV = null;
			let gEndIdx = segments.length;
			if (gEndIdx > 1 && /^\d+(\.\d+)?$/.test(segments[gEndIdx - 1])) {
				if (gEndIdx > 2 && /^\d+(\.\d+)?$/.test(segments[gEndIdx - 2])) {
					localGapH = parseFloat(segments[gEndIdx - 2]);
					localGapV = parseFloat(segments[gEndIdx - 1]);
				} else {
					localGapH = parseFloat(segments[gEndIdx - 1]);
					localGapV = localGapH;
				}
			}

			let rowNum = Math.ceil(childCount / colNum);

			let tokenRows = [];
			let allAreas = [];
			let ci = 0;
			for (let r = 0; r < rowNum; r++) {
				let row = [];
				for (let c = 0; c < colNum; c++) {
					let name = ci < childCount ? "c" + ci : ".";
					row.push(name);
					if (ci < childCount) allAreas.push("c" + ci);
					ci++;
				}
				tokenRows.push(row);
			}

			let templateAreas = tokenRows.map(row => '"' + row.join(" ") + '"');
			let colSizeList = colSizes ? tokenizeSizes(colSizes).map(normSize) : Array(colNum).fill("1fr");
			let rowSizeList = rowSizes ? tokenizeSizes(rowSizes).map(normSize) : Array(rowNum).fill("1fr");

			if (transpose) {
				let newRows = [];
				for (let c = 0; c < colNum; c++) {
					let row = [];
					for (let r = 0; r < rowNum; r++) row.push(tokenRows[r][c]);
					newRows.push(row);
				}
				templateAreas = newRows.map(row => '"' + row.join(" ") + '"');
				let tmp = colSizeList; colSizeList = rowSizeList; rowSizeList = tmp;
			}

			return {
				areas: allAreas, growAreas: [], areaAlign: {}, templateAreas,
				colSizes: colSizeList, rowSizes: rowSizeList,
				colCount: transpose ? rowNum : colNum,
				rowCount: transpose ? colNum : rowNum,
				gapH: localGapH, gapV: localGapV, transpose, expanded: true, flags, autoFlow: colNum,
			};
		}
		// plain * — single row of N children
		if (childCount > 26) return { error: "* supports max 26 children (a-z)" };
		segments[0] = "abcdefghijklmnopqrstuvwxyz".substring(0, childCount);
		expanded = true;
	}

	if (/^\d+(\.\d+)?$/.test(segments[0]))
		return { error: `"${segments[0]}" looks like a number, not a legend` };

	// parse legend
	let legendResult = parseLegend(segments[0]);
	if (legendResult.error) return legendResult;
	let { areas, growAreas, areaAlign } = legendResult;

	// extract trailing gap(s)
	let gapH = null, gapV = null, endIdx = segments.length;
	if (endIdx > 1 && /^\d+(\.\d+)?$/.test(segments[endIdx - 1])) {
		if (endIdx > 2 && /^\d+(\.\d+)?$/.test(segments[endIdx - 2])) {
			gapH = parseFloat(segments[endIdx - 2]);
			gapV = parseFloat(segments[endIdx - 1]);
			endIdx -= 2;
		} else {
			gapH = parseFloat(segments[endIdx - 1]);
			gapV = gapH;
			endIdx -= 1;
		}
	}

	let mapRows = segments.slice(1, endIdx);
	if (mapRows.length == 0) mapRows = [areas.join("")];

	// --- detect repeat row (ends with *) ---
	let repeatIdx = -1;
	let repeatRowRaw = null;
	let repeatRow = null;
	let repeatAreas = new Set();
	let pinnedAreas = new Set();
	for (let i = 0; i < mapRows.length; i++) {
		if (mapRows[i].endsWith("*")) {
			if (repeatIdx !== -1) return { error: "only one repeat row (*) allowed" };
			repeatIdx = i;
			repeatRowRaw = mapRows[i].slice(0, -1);
			repeatRow = repeatRowRaw.toLowerCase();
			for (let j = 0; j < repeatRowRaw.length; j++) {
				let ch = repeatRowRaw[j];
				if (ch === ".") continue;
				let lower = ch.toLowerCase();
				if (ch !== lower) pinnedAreas.add(lower);
				else repeatAreas.add(lower);
			}
			for (let p of pinnedAreas) repeatAreas.delete(p);
		}
	}

	let staticAreas = areas.filter(a => !repeatAreas.has(a));
	let repeatAreaList = areas.filter(a => repeatAreas.has(a));

	// --- repeat expansion ---
	if (repeatIdx !== -1) {
		if (!childCount || childCount < 1) return { error: "repeat row (*) requires children > 0" };

		let dynamicChildren = childCount - staticAreas.length;
		if (dynamicChildren < 0) return { error: `need at least ${staticAreas.length} children for static areas` };
		let areasPerRow = repeatAreas.size;
		if (areasPerRow === 0) return { error: "repeat row has no areas to repeat" };
		let repeatCount = Math.max(1, Math.ceil(dynamicChildren / areasPerRow));

		let expandedAreas = [...staticAreas];
		let expandedAlign = { ...areaAlign };
		let expandedGrow = new Set(growAreas);

		for (let n = 1; n <= repeatCount; n++) {
			for (let ch of repeatRow) {
				if (ch === "." || pinnedAreas.has(ch)) continue;
				let name = ch + n;
				if (!expandedAreas.includes(name)) {
					expandedAreas.push(name);
					if (areaAlign[ch]) expandedAlign[name] = areaAlign[ch];
					if (growAreas.has(ch)) expandedGrow.add(name);
				}
			}
		}

		let tokenRows = [];
		for (let i = 0; i < mapRows.length; i++) {
			if (i === repeatIdx) {
				for (let n = 1; n <= repeatCount; n++) {
					let tokens = [];
					for (let ch of repeatRow) {
						if (ch === ".") tokens.push(".");
						else if (pinnedAreas.has(ch)) tokens.push(ch);
						else tokens.push(ch + n);
					}
					tokenRows.push(tokens);
				}
			} else {
				tokenRows.push([...mapRows[i]].map(ch => ch === "." ? "." : ch));
			}
		}

		let colCount = tokenRows[0].length;
		for (let row of tokenRows) {
			if (row.length !== colCount) return { error: `row has ${row.length} cols, expected ${colCount}` };
		}

		let templateAreas = tokenRows.map(row => '"' + row.join(" ") + '"');

		let colSizeList = colSizes
			? tokenizeSizes(colSizes).map(normSize)
			: Array.from({ length: colCount }, (_, c) => {
				for (let row of tokenRows) {
					let name = row[c];
					let base = name.replace(/\d+$/, "");
					if (expandedGrow.has(name) || expandedGrow.has(base)) return "1fr";
				}
				return "auto";
			});

		let rowSizeList = [];
		if (rowSizes) {
			let sizeTokens = tokenizeSizes(rowSizes).map(normSize);
			for (let i = 0; i < mapRows.length; i++) {
				if (i === repeatIdx) {
					let sz = i < sizeTokens.length ? sizeTokens[i] : "auto";
					for (let n = 0; n < repeatCount; n++) rowSizeList.push(sz);
				} else rowSizeList.push(i < sizeTokens.length ? sizeTokens[i] : "auto");
			}
		} else {
			for (let row of tokenRows) {
				let hasGrow = false;
				for (let name of row) {
					let base = name.replace(/\d+$/, "");
					if (expandedGrow.has(name) || expandedGrow.has(base)) hasGrow = true;
				}
				rowSizeList.push(hasGrow ? "1fr" : "auto");
			}
		}

		if (transpose) {
			let newRows = [];
			for (let c = 0; c < colCount; c++) {
				let row = [];
				for (let r = 0; r < tokenRows.length; r++) row.push(tokenRows[r][c]);
				newRows.push(row);
			}
			templateAreas = newRows.map(row => '"' + row.join(" ") + '"');
			let tmp = colSizeList; colSizeList = rowSizeList; rowSizeList = tmp;
		}

		let rowCount = transpose ? colCount : tokenRows.length;
		let finalColCount = transpose ? tokenRows.length : colCount;

		return {
			areas: expandedAreas, growAreas: [...expandedGrow], areaAlign: expandedAlign,
			templateAreas, colSizes: colSizeList, rowSizes: rowSizeList,
			colCount: finalColCount, rowCount,
			gapH, gapV, transpose, expanded, flags,
			repeatInfo: { pattern: repeatAreaList, pinned: [...pinnedAreas], count: repeatCount, staticAreas },
		};
	}

	// --- non-repeat path ---
	let seen = new Set();
	for (let ch of areas) {
		if (seen.has(ch)) return { error: `duplicate area "${ch}" in legend` };
		seen.add(ch);
	}

	let colCount = mapRows[0].length;
	for (let row of mapRows) {
		if (row.length !== colCount)
			return { error: `row "${row}" has ${row.length} cols, expected ${colCount}` };
		for (let ch of row) {
			if (ch !== "." && !areas.includes(ch))
				return { error: `unknown area "${ch}" in row "${row}"` };
		}
	}

	for (let area of areas) {
		let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;
		for (let r = 0; r < mapRows.length; r++) {
			for (let c = 0; c < colCount; c++) {
				if (mapRows[r][c] === area) {
					minR = Math.min(minR, r); maxR = Math.max(maxR, r);
					minC = Math.min(minC, c); maxC = Math.max(maxC, c);
				}
			}
		}
		if (minR > maxR) continue;
		for (let r = minR; r <= maxR; r++) {
			for (let c = minC; c <= maxC; c++) {
				if (mapRows[r][c] !== area)
					return { error: `area "${area}" not rectangular (row ${r + 1}, col ${c + 1})` };
			}
		}
	}

	let templateAreas = mapRows.map(row =>
		'"' + [...row].map(ch => ch === "." ? "." : ch).join(" ") + '"'
	);

	let proportional = false;
	if (!colSizes) {
		// if any area repeats in this column's row, treat as proportional ? 1fr
		for (let row of mapRows) {
			// check if this char appears more than once in any row (proportional)
			if (row.match(/([a-z])\1/))
				proportional = true;
		}
	}
	let colSizeList = colSizes
		? tokenizeSizes(colSizes).map(normSize)
		: Array.from({ length: colCount }, (_, c) => {
			// if any area repeats in this column's row, treat as proportional ? 1fr
			for (let row of mapRows) {
				if (growAreas.has(row[c])) return "1fr";
			}
			return proportional ? "1fr" : "auto";
		});

	let rowSizeList = rowSizes
		? tokenizeSizes(rowSizes).map(normSize)
		: mapRows.map(row => {
			for (let ch of row) { if (growAreas.has(ch)) return "1fr"; }
			return "auto";
		});

	if (transpose) {
		let newRows = [];
		for (let c = 0; c < colCount; c++) {
			let row = "";
			for (let r = 0; r < mapRows.length; r++) row += mapRows[r][c];
			newRows.push(row);
		}
		templateAreas = newRows.map(row => '"' + [...row].join(" ") + '"');
		let tmp = colSizeList; colSizeList = rowSizeList; rowSizeList = tmp;
	}

	let rowCount = transpose ? colCount : mapRows.length;
	let finalColCount = transpose ? mapRows.length : colCount;

	return {
		areas, growAreas: [...growAreas], areaAlign, templateAreas,
		colSizes: colSizeList, rowSizes: rowSizeList,
		colCount: finalColCount, rowCount,
		gapH, gapV, transpose, expanded, flags,
	};
};

// --- helper: convert parsed result to CSS style object for the grid container ---
let toGridStyle = (parsed) => {
	if (parsed.error) return null;

	let hasFrCols = parsed.colSizes.some(s => s.includes("fr"));
	let hasFrRows = parsed.rowSizes.some(s => s.includes("fr"));
	let hasGrowAreas = !!parsed.growAreas.length && !parsed.flags.fullWidth && !parsed.flags.fullHeight;

	let style = {
		display: "grid",
		gridTemplateAreas: parsed.templateAreas.join(" "),
		gridTemplateColumns: parsed.colSizes.join(" "),
		gridTemplateRows: parsed.rowSizes.join(" "),
	};

	if (hasGrowAreas || parsed.flags.fullWidth) style.width = "100%"; else style.width = "fit-content";
	if (hasGrowAreas || parsed.flags.fullHeight) style.height = "100%"; else style.height = "fit-content";

	if (parsed.gapH != null) {
		style.gap = parsed.gapH === parsed.gapV
			? parsed.gapH + "px"
			: parsed.gapH + "px " + parsed.gapV + "px";
	}

	if (parsed.flags.justifyContent) style.justifyContent = parsed.flags.justifyContent;
	if (parsed.flags.alignContent) style.alignContent = parsed.flags.alignContent;
	style.overflow = "hidden";

	return style;
};

// --- helper: get style for a specific area ---
let toAreaStyle = (parsed, areaName) => {
	let style = { gridArea: areaName };
	let align = parsed.areaAlign[areaName];
	if (align) {
		if (align.justifySelf) style.justifySelf = align.justifySelf;
		if (align.alignSelf) style.alignSelf = align.alignSelf;
	}
	if (parsed.flags.fullHeight)
		style.minHeight = "0px";
	return style;
};

export { parseGridLayout, toGridStyle, toAreaStyle };
