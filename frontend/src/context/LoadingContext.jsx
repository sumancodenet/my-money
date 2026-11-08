import { createContext, useContext, useEffect, useState } from 'react';
import { loaderStore } from '../services/loaderStore';

// Optional helper — abhi app button-level loader (ButtonLoader.jsx) use kar rahi hai
// jo seedha loaderStore se subscribed hai. Ye context future me use ho sakta hai.

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
