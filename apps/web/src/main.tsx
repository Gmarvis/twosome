import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { initAudio } from "./hooks/use-sounds";

// Register global listener to unlock AudioContext on first user tap (iOS)
initAudio();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
