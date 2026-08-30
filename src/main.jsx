import React from "react";
import ReactDOM from "react-dom/client";
import App, { SetupNeeded } from "./App.jsx";
import { firebaseConfigured } from "./firebase.js";

// firebaseConfigured is fixed for the life of the page load (it comes from
// build-time env vars), so choosing between these two component trees here
// — rather than inside App with an early return — keeps App free to call
// hooks (useAuth, etc.) unconditionally, as React requires.
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>{firebaseConfigured ? <App /> : <SetupNeeded />}</React.StrictMode>
);
