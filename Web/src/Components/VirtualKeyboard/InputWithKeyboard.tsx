import React, { useRef, useCallback } from 'react'
import { useVirtualKeyboard } from '../../contexts/VirtualKeyboardContext'

interface InputWithKeyboardProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  keyboardLayout?: 'default' | 'numeric'
}

const InputWithKeyboard: React.FC<InputWithKeyboardProps> = ({
  value,
  onChange,
  keyboardLayout = 'default',
  onFocus,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { showKeyboard, setKeyboardLayout } = useVirtualKeyboard()

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setKeyboardLayout(keyboardLayout)
    showKeyboard(inputRef, value, onChange)
    onFocus?.(e)
  }, [showKeyboard, value, onChange, keyboardLayout, setKeyboardLayout, onFocus])

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

