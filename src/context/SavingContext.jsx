import { createContext, useState, useContext } from "react";

const SavingContext = createContext();

export const SavingProvider = ({ children }) => {
  const [saving, setSaving] = useState(false);

  return (
    <SavingContext.Provider value={{ saving, setSaving }}>
      {children}
    </SavingContext.Provider>
  );
};

export const useSaving = () => useContext(SavingContext);
