import React, { useRef, useCallback } from 'react'
import { useVirtualKeyboard } from '../../contexts/VirtualKeyboardContext'

interface InputWithKeyboardProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  keyboardLayout?: 'default' | 'numeric'
  keyboardSize?: 'normal' | 'large'
}

const InputWithKeyboard: React.FC<InputWithKeyboardProps> = ({
  value,
  onChange,
  keyboardLayout = 'default',
  keyboardSize = 'normal',
  onFocus,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { showKeyboard, setKeyboardLayout, setKeyboardSize } = useVirtualKeyboard()

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setKeyboardLayout(keyboardLayout)
    setKeyboardSize(keyboardSize)
    showKeyboard(inputRef, value, onChange)
    onFocus?.(e)
  }, [showKeyboard, value, onChange, keyboardLayout, setKeyboardLayout, keyboardSize, setKeyboardSize, onFocus])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }, [onChange])

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      {...props}
    />
  )
}

export default InputWithKeyboard

