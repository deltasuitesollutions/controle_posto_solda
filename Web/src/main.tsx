/**
 * ARQUITETURA API-FIRST
 * 
 * Este projeto segue uma arquitetura onde o frontend NUNCA acessa o banco de dados diretamente.
 * 
 * REGRAS IMPORTANTES:
 * - ✅ Use apenas funções de Web/src/api/api.ts para comunicação com o backend
 * - ❌ NUNCA importe código de Server/ ou database/
 * - ❌ NUNCA adicione dependências de banco de dados (psycopg2, sqlalchemy, etc.)
 * - ❌ NUNCA execute queries SQL diretamente
 * 
 * Para mais informações, consulte: docs/ARQUITETURA_API.md
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { VirtualKeyboardProvider } from './contexts/VirtualKeyboardContext'
import { VirtualKeyboard } from './Components/VirtualKeyboard'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <VirtualKeyboardProvider>
          <App />
          <VirtualKeyboard />
        </VirtualKeyboardProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
