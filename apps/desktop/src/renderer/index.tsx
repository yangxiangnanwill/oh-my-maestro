import ReactDom from "react-dom/client";
import { App } from "./App";

import "./globals.css";

const rootElement = document.querySelector("app");

if (!rootElement) {
	throw new Error("Missing <app> root element");
}

ReactDom.createRoot(rootElement).render(<App />);
