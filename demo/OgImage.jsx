import React from "react";
import { Grid, debug } from "../src/Grid.jsx";

let Style = ({ children }) => <style>{children}</style>;

let Logo = ({ size = 56, color = "#7fdbca" }) =>
	<svg width={size} height={size} viewBox="0 0 56 56">
		<path fill={color} d="m41.266 19.117l8.812-5.015c-.352-.352-.774-.633-1.289-.915l-16.523-9.42C30.813 2.946 29.406 2.5 28 2.5s-2.812.445-4.266 1.266L18.977 6.46ZM28 26.641l10.008-5.672l-22.195-12.68l-8.602 4.899c-.516.28-.937.562-1.29.914ZM29.594 53.5c.164-.047.304-.117.469-.21l18.351-10.454c2.18-1.242 3.375-2.508 3.375-5.906V18.672c0-.703-.07-1.266-.187-1.781L29.594 29.453Zm-3.188 0V29.453L4.4 16.891a7.8 7.8 0 0 0-.188 1.78V36.93c0 3.398 1.195 4.664 3.375 5.906l18.352 10.453c.164.094.304.164.468.211" />
	</svg>;

let MiniBox = ({ c = 0, children }) =>
	<div style={{
		background: `hsl(${c * 47 + 200}, 40%, ${20 + c * 3}%)`,
		color: `hsl(${c * 47 + 200}, 60%, 75%)`,
		borderRadius: 6, padding: "8px 12px", fontSize: 24, fontWeight: 600,
		display: "flex", alignItems: "center", justifyContent: "center",
		height: "100%", width: "100%",
		border: `1px solid hsl(${c * 47 + 200}, 30%, 30%)`,
	}}>{children}</div>;

let OgImage = () =>
	<div className="og-root">
		<Style>{`
			.og-root {
				width: 1200px; height: 630px;
				background: #0c0c1a;
				font-family: "SF Mono", "Fira Code", "JetBrains Mono", monospace;
				color: #b8b8d0;
				display: flex;
				position: relative;
				overflow: hidden;
			}
			.og-bg {
				position: absolute; inset: 0; opacity: 0.035;
				background-image:
					linear-gradient(rgba(127,219,202,0.3) 1px, transparent 1px),
					linear-gradient(90deg, rgba(127,219,202,0.3) 1px, transparent 1px);
				background-size: 60px 60px;
			}
			.og-glow {
				position: absolute; top: -300px; left: 30%; width: 900px; height: 900px;
				border-radius: 50%;
				background: radial-gradient(circle, rgba(127,219,202,0.07) 0%, transparent 70%);
				pointer-events: none;
			}
			.og-left {
				flex: 1; display: flex; flex-direction: column;
				justify-content: start; padding: 48px;
				position: relative; z-index: 1;
			}
			.og-right {
				width: 550px; display: flex; flex-direction: column;
				padding: 112px 48px 0 0;
				position: relative; z-index: 1;
			}
			.og-title {
				font-size: 52px; font-weight: 800; color: #e8e8f0;
				line-height: 1.15; letter-spacing: -2px; margin: 0 0 6px;
			}
			.og-title em { font-style: normal; color: #7fdbca; }
			.og-sub {
				font-size: 32px; color: #aabbcc; line-height: 1.5;
				margin: 0 0 28px; max-width: 420px;
			}
			.og-layout-str {
				font-size: 24px; font-weight: 600; color: #c3e88d;
				background: rgba(0,0,0,0.35);
				border: 1px solid rgba(127,219,202,0.12);
				border-radius: 8px; padding: 10px 16px;
				16px; display: inline-block;
			}
			.og-demo {
				border: 1px solid rgba(255,255,255,0.06);
				border-radius: 10px; overflow: hidden;
				background: #0a0a18; padding: 8px;
			}
			.og-arrow {
				color: #ccc; font-size: 32px; text-align: center;
				padding: 8px 0; letter-spacing: 4px;
			}
			.og-badge {
				display: inline-block; font-size: 24px; color: #7fdbca;
				background: rgba(127,219,202,0.08);
				border: 1px solid rgba(127,219,202,0.15);
				border-radius: 20px; padding: 4px 14px;
				letter-spacing: 1px; text-transform: uppercase;
				margin-bottom: 20px;
			}
			.og-brand {
				display: flex; align-items: center; gap: 14px;
				margin-bottom: 24px;
			}
			.og-brand-name {
				font-size: 32px; font-weight: 700; color: #e8e8f0;
			}
			.og-footer-right {
				margin: 20px auto;
				font-size: 32px; color: #999; z-index: 1;
			}
			.og-footer {
				position: absolute; bottom: 40px; left: 48px;
				font-size: 24px; color: #999; z-index: 1;
			}
			.og-footer span { color: #555; }
		`}</Style>

		<div className="og-bg" />
		<div className="og-glow" />

		{/* --- left: branding + tagline --- */}
		<div className="og-left">
			<div className="og-brand">
				<Logo size={48} color="#ffffff" />
				<span className="og-brand-name">gridpack</span>
			</div>
			<div className="og-badge">CSS Grid Layout DSL</div>
			<h1 className="og-title">
				Layouts in<br /><em>one string.</em>
			</h1>
			<p className="og-sub">
				A compact DSL that compiles into CSS Grid.<br />
				One React component. Zero wrapper divs.
			</p>
		</div>

		{/* --- right: live example --- */}
		<div className="og-right">
			<div className="og-layout-str">hsCf hhh scc sff 8</div>
			<div className="og-arrow">↓</div>
			<div className="og-demo">
				<Grid layout="hsCf hhh scc sff 8 | 140##" style={{ height: 275 }}
					extensions={[debug({ color: "rgba(255,255,255,0.2)" })]}>
					<MiniBox c={0}>Header</MiniBox>
					<MiniBox c={1}>Sidebar</MiniBox>
					<MiniBox c={2}>Content</MiniBox>
					<MiniBox c={3}>Footer</MiniBox>
				</Grid>
			</div>
			<div className="og-footer-right">
				Discover demos →
			</div>
		</div>

		<div className="og-footer">
			thekeydev <span>/</span> gridpack
		</div>
	</div>;

export default OgImage;
