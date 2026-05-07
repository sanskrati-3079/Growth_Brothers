import { useState, useCallback } from "react";

export function useScheduler() {
  const [items, setItems] = useState([]);

  const add = useCallback((entry) => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), ...entry }]);
  }, []);

  return { items, add };
}
export default useScheduler;
