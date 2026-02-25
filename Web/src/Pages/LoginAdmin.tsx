import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginAdmin = () => {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login, user, isOperador, isAdmin, isMaster } = useAuth();
  const navigate = useNavigate();

  // Redireciona se já estiver logado
  useEffect(() => {
    if (user) {
      if (isOperador) {
        // Operador não pode acessar área admin, redireciona para login operador
        setErro('Acesso restrito a administradores. Use a tela de operador.');
      } else if (isAdmin || isMaster) {
        navigate('/', { replace: true });
      }
    }
  }, [user, isOperador, isAdmin, isMaster, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      if (!username.trim() || !senha.trim()) {
        setErro('Por favor, preencha todos os campos');
        setCarregando(false);
        return;
      }

      const userData = await login(username.trim(), senha);
      
      // Verificar se é admin ou master
      if (userData.tipo === 'operador') {
        setErro('Acesso restrito a administradores. Use a tela de operador.');
        setCarregando(false);
        return;
      }
      
      // O redirecionamento será feito pelo useEffect quando o user for atualizado
    } catch (error: any) {
      setErro(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: '#4C79AF' }}>
          Painel Administrativo
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Acesso restrito a administradores
        </p>
        <form onSubmit={handleLogin}>
          {erro && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {erro}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite seu usuário"
              autoComplete="username"
              required
              disabled={carregando}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
              disabled={carregando}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 text-white rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#4C79AF' }}
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginAdmin;

