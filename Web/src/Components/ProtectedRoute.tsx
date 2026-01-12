import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'operador')[];
  onlyOperador?: boolean;
  onlyAdmin?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  onlyOperador, 
  onlyAdmin 
}: ProtectedRouteProps) => {
  const { user, isOperador, isAdmin } = useAuth();
  const location = useLocation();

  // Se não há usuário logado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Verifica se o usuário tem permissão baseado nas props
  if (onlyOperador && !isOperador) {
    return <Navigate to="/" replace />;
  }

  if (onlyAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

