import { createContext, useContext, useEffect, useState } from 'react';
import { loaderStore } from '../services/loaderStore';

// Optional helper — the app currently uses the button-level loader (ButtonLoader.jsx)
// which subscribes directly to loaderStore. This context can be used in the future.

const LoadingContext = createContext({ active: 0, visible: false, isLoading: false });

export const useLoading = () => useContext(LoadingContext);

export function LoadingProvider({ children }) {
  const [state, setState] = useState(loaderStore.getState());

  useEffect(() => loaderStore.subscribe(setState), []);

  return (
    <LoadingContext.Provider
      value={{ active: state.active, visible: state.visible, isLoading: state.visible }}
    >
      {children}
    </LoadingContext.Provider>
  );
}
