import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import usePersistState from '../hooks/usePersistState';

/**
 * TextField component that persists its value in localStorage/sessionStorage
 */
interface PersistentTextFieldProps extends Omit<TextFieldProps, 'value' | 'onChange'> {
  /** Unique storage key for this field */
  storageKey: string;
  /** Initial value for the field */
  initialValue?: string;
  /** Whether to use sessionStorage instead of localStorage */
  sessionOnly?: boolean;
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
}

/**
 * A text field component that automatically persists its value across page refreshes
 */
const PersistentTextField: React.FC<PersistentTextFieldProps> = ({
  storageKey,
  initialValue = '',
  sessionOnly = false,
  onValueChange,
  ...textFieldProps
}) => {
  const [value, setValue, resetValue] = usePersistState<string>(
    storageKey, 
    initialValue,
    sessionOnly
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <TextField
      {...textFieldProps}
      value={value}
      onChange={handleChange}
    />
  );
};

export default PersistentTextField;