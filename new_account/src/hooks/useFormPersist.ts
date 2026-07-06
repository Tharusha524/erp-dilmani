import { useState, useEffect } from 'react';

/**
 * Custom hook for persisting form data in localStorage to prevent data loss on refresh
 * 
 * @param key - unique identifier for the form state in localStorage
 * @param initialState - initial form state
 * @returns [formState, setFormState, clearFormState] - form state, setter, and clear function
 */
const useFormPersist = <T extends Record<string, any>>(
  key: string,
  initialState: T
): [T, (values: T) => void, () => void] => {
  // Try to get any saved state from localStorage
  const [state, setState] = useState<T>(() => {
    try {
      const savedState = localStorage.getItem(key);
      return savedState ? JSON.parse(savedState) : initialState;
    } catch (error) {
      console.error('Error loading persisted form state:', error);
      return initialState;
    }
  });

  // Update localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving form state to localStorage:', error);
    }
  }, [key, state]);

  // Clear persisted form data
  const clearPersistedFormState = () => {
    try {
      localStorage.removeItem(key);
      setState(initialState);
    } catch (error) {
      console.error('Error clearing persisted form state:', error);
    }
  };

  return [state, setState, clearPersistedFormState];
};

export default useFormPersist;