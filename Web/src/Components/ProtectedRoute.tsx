import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'operador' | 'master')[];
  onlyOperador?: boolean;
  onlyAdmin?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  onlyOperador, 
  onlyAdmin 
}: ProtectedRouteProps) => {
  const { user, isOperador, isAdmin, isMaster } = useAuth();
  const location = useLocation();

  // Se não há usuário logado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Rotas apenas para operadores - nem master tem acesso
  if (onlyOperador) {
    if (!isOperador) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  // Master tem acesso total (exceto rotas onlyOperador)
  if (isMaster) {
    return <>{children}</>;
  }

  // Verifica se o usuário tem permissão baseado nas props

  if (onlyAdmin && !isAdmin) {
    // Se é operador tentando acessar rota de admin, redireciona para IHM
    if (isOperador) {
      return <Navigate to="/ihm/leitor" replace />;
    }
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Se é operador, redireciona para IHM, senão para dashboard
    if (isOperador) {
      return <Navigate to="/ihm/leitor" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

