import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import App from "./App";

// The archive mounts directly in the page; there is no embedded loading gate.
flushSync(() => createRoot(document.getElementById("root")!).render(<App />));
