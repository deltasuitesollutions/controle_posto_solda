import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { usuariosAPI } from '../api/api';

export type UserRole = 'admin' | 'operador' | 'master';

interface User {
  id: number;
  usuario_id?: number;
  nome: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, senha: string) => Promise<void>;
  logout: () => void;
  isOperador: boolean;
  isAdmin: boolean;
  isMaster: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(() => {
    // Recupera usuário do localStorage ao inicializar
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = async (username: string, senha: string) => {
    try {
      const userData = await usuariosAPI.login({ username, senha });
      
      // Garantir que temos id ou usuario_id
      const user: User = {
        id: userData.id || userData.usuario_id,
        usuario_id: userData.usuario_id || userData.id,
        nome: userData.nome,
        role: userData.role
      };
      
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const isOperador = user?.role === 'operador';
  const isAdmin = user?.role === 'admin';
  const isMaster = user?.role === 'master';

  return (
    <AuthContext.Provider value={{ user, login, logout, isOperador, isAdmin, isMaster }}>
      {children}
    </AuthContext.Provider>
  );
};

