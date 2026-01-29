import { useEffect, useRef, useCallback } from 'react'
import Keyboard from 'react-simple-keyboard'
import 'react-simple-keyboard/build/css/index.css'
import { useVirtualKeyboard } from '../../contexts/VirtualKeyboardContext'

const VirtualKeyboard = () => {
  const {
    isKeyboardVisible,
    inputValue,
    hideKeyboard,
    setInputValue,
    onChangeCallback,
    keyboardLayout
  } = useVirtualKeyboard()

  const keyboardRef = useRef<any>(null)

  // Sincronizar o valor do teclado quando o inputValue mudar externamente
  useEffect(() => {
    if (keyboardRef.current) {
      keyboardRef.current.setInput(inputValue)
    }
  }, [inputValue])

  const handleChange = useCallback((input: string) => {
    setInputValue(input)
    if (onChangeCallback) {
      onChangeCallback(input)
    }
  }, [setInputValue, onChangeCallback])

  const handleKeyPress = useCallback((button: string) => {
    if (button === '{enter}') {
      hideKeyboard()
    }
  }, [hideKeyboard])

  if (!isKeyboardVisible) {
    return null
  }

  // Layout padrão QWERTY brasileiro
  const defaultLayout = {
    default: [
      '1 2 3 4 5 6 7 8 9 0 {bksp}',
      'q w e r t y u i o p',
      'a s d f g h j k l ç',
      '{shift} z x c v b n m , .',
      '{space} {enter}'
    ],
    shift: [
      '! @ # $ % ¨ & * ( ) {bksp}',
      'Q W E R T Y U I O P',
      'A S D F G H J K L Ç',
      '{shift} Z X C V B N M < >',
      '{space} {enter}'
    ]
  }

  // Layout numérico
  const numericLayout = {
    default: [
      '1 2 3',
      '4 5 6',
      '7 8 9',
      '{bksp} 0 {enter}'
    ]
  }

  const display = {
    '{bksp}': '⌫',
    '{enter}': '✓',
    '{shift}': '⇧',
    '{space}': 'Espaço'
  }

  return (
    <div className="virtual-keyboard-container">
      {/* Overlay para fechar o teclado ao clicar fora */}
      <div 
        className="virtual-keyboard-overlay"
        onClick={hideKeyboard}
      />
      
      {/* Container do teclado */}
      <div className="virtual-keyboard-wrapper">
        <div className="virtual-keyboard-header">
          <span className="text-sm text-gray-600">Teclado Virtual</span>
          <button
            onClick={hideKeyboard}
            className="virtual-keyboard-close"
            aria-label="Fechar teclado"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <Keyboard
          keyboardRef={(r) => (keyboardRef.current = r)}
          layout={keyboardLayout === 'numeric' ? numericLayout : defaultLayout}
          display={display}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          theme="hg-theme-default virtual-keyboard-theme"
          physicalKeyboardHighlight={true}
          physicalKeyboardHighlightPress={true}
        />
      </div>
    </div>
  )
}

export default VirtualKeyboard

