import { Routes, Route, Navigate } from "react-router-dom";
import Funcionarios from "./Pages/Funcionarios";
import Modelos from "./Pages/Modelos";
import Registros from "./Pages/Registros";
import Dashboard from "./Pages/Dashboard";
import Login from "./Pages/Login";
import LeitorIHM from "./Pages/IHM/Leitor";
import OperacaoIHM from "./Pages/IHM/Operacao";
import LeitorFinalizar from "./Pages/IHM/LeitorFinalizar";
import ProtectedRoute from "./Components/ProtectedRoute";
import Produtos from "./Pages/Produtos";
import Linhas from "./Pages/Linhas";
import Postos from "./Pages/Postos";
import Operacoes from "./Pages/Operacoes";
import Usuarios from "./Pages/Usuarios";
import Auditoria from "./Pages/Auditoria";


function App() {
  return (
    <Routes>
      {/* Rota de login */}
      <Route path="/login" element={<Login />} />
      
      {/* Rotas públicas/admin */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute onlyAdmin>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/funcionarios" 
        element={
          <ProtectedRoute onlyAdmin>
            <Funcionarios />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/modelos" 
        element={
          <ProtectedRoute onlyAdmin>
            <Modelos />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/registros" 
        element={
          <ProtectedRoute onlyAdmin>
            <Registros />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/produtos" 
        element={
          <ProtectedRoute onlyAdmin>
            <Produtos />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/linhas" 
        element={
          <ProtectedRoute onlyAdmin>
            <Linhas />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/postos" 
        element={
          <ProtectedRoute onlyAdmin>
            <Postos />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/operacoes" 
        element={
          <ProtectedRoute onlyAdmin>
            <Operacoes />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/usuarios" 
        element={
          <ProtectedRoute allowedRoles={['master']}>
            <Usuarios />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/auditoria" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'master']}>
            <Auditoria />
          </ProtectedRoute>
        } 
      />
      
      {/* Rotas IHM - apenas para operadores (fluxo sequencial) */}
      <Route 
        path="/ihm/leitor" 
        element={
          <ProtectedRoute onlyOperador>
            <LeitorIHM />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/ihm/operacao" 
        element={
          <ProtectedRoute onlyOperador>
            <OperacaoIHM />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/ihm/leitor-finalizar" 
        element={
          <ProtectedRoute onlyOperador>
            <LeitorFinalizar />
          </ProtectedRoute>
        } 
      />
      
      {/* Redireciona rotas não encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
