import React, { type ComponentRef, forwardRef, useState } from 'react';
import {
  type StyleProp,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import { tokens } from '@/theme/tokens';

import { styles } from './styles';

export type InputRef = ComponentRef<typeof TextInput>;

export interface InputProps extends TextInputProps {
  label?: string;
  labelRight?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  helperText?: string;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input = forwardRef<InputRef, InputProps>(function Input(
  {
    label,
    labelRight,
    rightAdornment,
    helperText,
    error,
    editable = true,
    containerStyle,
    style,
    onFocus,
    onBlur,
    placeholderTextColor,
    ...rest
  },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {(label || labelRight) && (
        <View style={styles.headerRow}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {labelRight}
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          isFocused && !hasError && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
        ]}>
        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={placeholderTextColor ?? tokens.colors.text.secondary}
          selectionColor={tokens.colors.accent.primary}
          style={[styles.input, style]}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          {...rest}
        />
        {rightAdornment}
      </View>

      {hasError ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
});
