import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

interface VirtualKeyboardContextType {
  isKeyboardVisible: boolean
  inputValue: string
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null> | null
  showKeyboard: (ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>, value: string, onChange: (value: string) => void) => void
  hideKeyboard: () => void
  setInputValue: (value: string) => void
  onChangeCallback: ((value: string) => void) | null
  keyboardLayout: 'default' | 'numeric'
  setKeyboardLayout: (layout: 'default' | 'numeric') => void
}

const VirtualKeyboardContext = createContext<VirtualKeyboardContextType | undefined>(undefined)

export const VirtualKeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [inputRef, setInputRef] = useState<React.RefObject<HTMLInputElement | HTMLTextAreaElement | null> | null>(null)
  const [keyboardLayout, setKeyboardLayout] = useState<'default' | 'numeric'>('default')
  const onChangeCallbackRef = useRef<((value: string) => void) | null>(null)

  const showKeyboard = useCallback((
    ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
    value: string,
    onChange: (value: string) => void
  ) => {
    setInputRef(ref)
    setInputValue(value)
    onChangeCallbackRef.current = onChange
    setIsKeyboardVisible(true)
  }, [])

  const hideKeyboard = useCallback(() => {
    setIsKeyboardVisible(false)
    setInputRef(null)
    onChangeCallbackRef.current = null
  }, [])

  return (
    <VirtualKeyboardContext.Provider
      value={{
        isKeyboardVisible,
        inputValue,
        inputRef,
        showKeyboard,
        hideKeyboard,
        setInputValue,
        onChangeCallback: onChangeCallbackRef.current,
        keyboardLayout,
        setKeyboardLayout
      }}
    >
      {children}
    </VirtualKeyboardContext.Provider>
  )
}

export const useVirtualKeyboard = () => {
  const context = useContext(VirtualKeyboardContext)
  if (context === undefined) {
    throw new Error('useVirtualKeyboard must be used within a VirtualKeyboardProvider')
  }
  return context
}

