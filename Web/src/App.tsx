import { Routes, Route, Navigate } from "react-router-dom";
import Funcionarios from "./Pages/Funcionarios";
import Registros from "./Pages/Registros";
import Dashboard from "./Pages/Dashboard";
import Login from "./Pages/Login";
import LoginAdmin from "./Pages/LoginAdmin";
import LeitorIHM from "./Pages/IHM/Leitor";
import OperacaoIHM from "./Pages/IHM/Operacao";
import LeitorFinalizar from "./Pages/IHM/LeitorFinalizar";
import FinalizarProducao from "./Pages/IHM/FinalizarProducao";
import ProtectedRoute from "./Components/ProtectedRoute";
import Linhas from "./Pages/Linhas";
import Postos from "./Pages/Postos";
import Operacoes from "./Pages/Operacoes";
import Usuarios from "./Pages/Usuarios";
import OperacoesCanceladas from "./Pages/OperacoesCanceladas";
import CadastroProdutoModelo from "./Pages/CadastroProdutoModelo";
import ListagemPecas from "./Pages/ListagemPecas";
import CadastroUsuario from "./Pages/CadastroUsuario";
import DispositivosRaspberry from "./Pages/DispositivosRaspberry";


function App() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<LoginAdmin />} />
      <Route path="/cadastro-usuario" element={<CadastroUsuario />} />
      
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
        path="/cadastro-produto-modelo" 
        element={
          <ProtectedRoute onlyAdmin>
            <CadastroProdutoModelo />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/listagem-pecas" 
        element={
          <ProtectedRoute onlyAdmin>
            <ListagemPecas />
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
        path="/operacoesCanceladas" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'master']}>
            <OperacoesCanceladas />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/dispositivos-raspberry" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'master']}>
            <DispositivosRaspberry />
          </ProtectedRoute>
        }
      />
      <Route     
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
      <Route 
        path="/ihm/finalizar-producao" 
        element={
          <ProtectedRoute onlyOperador>
            <FinalizarProducao />
          </ProtectedRoute>
        }
      />
      
      {/* Redireciona rotas não encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
