import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [nome, setNome] = useState('');
  const [role, setRole] = useState<'admin' | 'operador'>('operador');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim()) {
      login({
        id: 1,
        nome: nome.trim(),
        role: role
      });
      // Redireciona baseado no role
      if (role === 'operador') {
        navigate('/ihm/leitor');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#4C79AF' }}>
          Login
        </h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite seu nome"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Usuário
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'operador')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="operador">Operador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 text-white rounded-md font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#4C79AF' }}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

