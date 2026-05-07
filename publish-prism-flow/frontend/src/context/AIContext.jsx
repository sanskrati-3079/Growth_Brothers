import React, { createContext, useContext, useState } from "react";

const AICtx = createContext(null);

export function AIProvider({ children }) {
  const [outputs, setOutputs] = useState({
    caption: "",
    hashtags: "",
    post: "",
  });

  return (
    <AICtx.Provider value={{ outputs, setOutputs }}>
      {children}
    </AICtx.Provider>
  );
}

export const useAIContext = () => useContext(AICtx);
