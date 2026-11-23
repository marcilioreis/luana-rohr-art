import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { store } from "./app/store";
import { router } from "./routes";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { ThemedToaster } from "./components/theme/ThemedToaster";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <ErrorBoundary>
          <ThemedToaster />
          <RouterProvider router={router} />
        </ErrorBoundary>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
);
