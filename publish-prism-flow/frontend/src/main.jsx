import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { router } from "./routes";
import "./styles/tailwind.css";
import "./styles/globals.css";
import { AuthProvider } from "./context/AuthContext";
import { AIProvider } from "./context/AIContext";
import { ThemeProvider } from "./context/ThemeContext";
import { UploadProvider } from "./context/UploadContext";

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AIProvider>
          <UploadProvider>
            <RouterProvider router={router} />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  borderRadius: "12px",
                  background: "rgba(15, 23, 42, 0.95)",
                  color: "#fff",
                  fontSize: "14px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
                },
                success: { iconTheme: { primary: "#10B981", secondary: "#fff" } },
                error:   { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
              }}
            />
          </UploadProvider>
        </AIProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
