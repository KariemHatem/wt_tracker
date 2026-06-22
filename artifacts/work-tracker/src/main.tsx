import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupApi } from "./lib/api-setup";

setupApi();

// Default to dark mode
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
