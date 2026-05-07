import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import RequireAuth from "./components/common/RequireAuth";

import Home from "./pages/Home";
import Upload from "./pages/Upload";
import AIStudio from "./pages/AIStudio";
import Repurpose from "./pages/Repurpose";
import Scheduler from "./pages/Scheduler";
import Analytics from "./pages/Analytics";
import Engagement from "./pages/Engagement";
import Accounts from "./pages/Accounts";
import Admin from "./pages/Admin";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

export const router = createBrowserRouter([
  // PUBLIC ROUTES (NO SIDEBAR / NAVBAR)
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },

  // PRIVATE ROUTES (gated by RequireAuth, rendered inside App layout)
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <App />,
        children: [
          { index: true, element: <Home /> },
          { path: "upload", element: <Upload /> },
          { path: "ai", element: <AIStudio /> },
          { path: "repurpose", element: <Repurpose /> },
          { path: "scheduler", element: <Scheduler /> },
          { path: "analytics", element: <Analytics /> },
          { path: "engagement", element: <Engagement /> },
          { path: "accounts", element: <Accounts /> },
          { path: "admin", element: <Admin /> },
        ],
      },
    ],
  },
]);
