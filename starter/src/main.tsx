import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app"; // Import the root App component

// Rendering the App component to the root div in your HTML file
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
