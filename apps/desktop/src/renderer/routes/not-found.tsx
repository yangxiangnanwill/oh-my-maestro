export function NotFound() {
	return (
		<div
			style={{
				display: "flex",
				height: "100vh",
				alignItems: "center",
				justifyContent: "center",
				background: "var(--background)",
				color: "var(--foreground)",
				fontFamily: "system-ui, sans-serif",
				fontSize: "18px",
				opacity: 0.6,
			}}
		>
			404 -- Page not found
		</div>
	);
}
