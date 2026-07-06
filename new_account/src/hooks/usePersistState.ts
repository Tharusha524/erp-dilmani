import { useState, useEffect } from 'react';

/**
 * Generic hook for persisting any state in localStorage
 * This can be used for any kind of state, not just forms
 * 
 * @param key - unique identifier for storing in localStorage
 * @param initialState - initial state if nothing is stored
 * @param sessionOnly - if true, uses sessionStorage instead of localStorage
 * @returns [state, setState, resetState] - stateful value, setter and reset function
 */
function usePersistState<T>(
  key: string, 
  initialState: T, 
  sessionOnly: boolean = false
): [T, (value: T | ((prevState: T) => T)) => void, () => void] {
  const storage = sessionOnly ? sessionStorage : localStorage;
  
  // Initialize state from storage or use initial state
  const [state, setState] = useState<T>(() => {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : initialState;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return initialState;
    }
  });
  
  // Update storage when state changes
  useEffect(() => {
    try {
      if (state === initialState && storage.getItem(key) === null) {
        return; // Don't store if it's the initial state and nothing is currently stored
      }
      
      storage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error storing ${key} to storage:`, error);
    }
  }, [key, state, initialState, storage]);
  
  // Function to reset state to initial value
  const resetState = () => {
    try {
      storage.removeItem(key);
      setState(initialState);
    } catch (error) {
      console.error(`Error clearing ${key} from storage:`, error);
    }
  };
  
  return [state, setState, resetState];
}

export default usePersistState;