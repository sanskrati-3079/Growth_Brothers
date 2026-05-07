import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const UploadCtx = createContext(null);

const buildMediaPayload = (file) => {
  const url = URL.createObjectURL(file);
  return {
    file,
    url,
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
  };
};

export function UploadProvider({ children }) {
  const [media, setMedia] = useState(null);

  const setMediaFile = useCallback((file) => {
    if (!file) {
      return;
    }

    setMedia((previous) => {
      if (previous?.url) {
        URL.revokeObjectURL(previous.url);
      }
      return buildMediaPayload(file);
    });
  }, []);

  const clearMedia = useCallback(() => {
    setMedia((previous) => {
      if (previous?.url) {
        URL.revokeObjectURL(previous.url);
      }
      return null;
    });
  }, []);

  const value = useMemo(
    () => ({
      media,
      setMediaFile,
      clearMedia,
    }),
    [media, setMediaFile, clearMedia],
  );

  return <UploadCtx.Provider value={value}>{children}</UploadCtx.Provider>;
}

export const useUploadContext = () => useContext(UploadCtx);
