import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { InputWithKeyboard } from '../Components/VirtualKeyboard';

// Desabilitar link de cadastro na tela de login (mantém rota e página; só oculta o link)
const SHOW_CADASTRO_LINK = false;

const Login = () => {
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
        navigate('/ihm/leitor', { replace: true });
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

      await login(username.trim(), senha);
      
      // O redirecionamento será feito pelo useEffect quando o user for atualizado
    } catch (error: any) {
      setErro(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-4xl">
        <h2 className="text-4xl font-bold mb-8 text-center" style={{ color: '#4C79AF' }}>
          Login
        </h2>
        <form onSubmit={handleLogin}>
          {erro && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-lg">
              {erro}
            </div>
          )}
          <div className="mb-6">
            <label className="block text-xl font-medium text-gray-700 mb-3">
              Usuário
            </label>
            <InputWithKeyboard
              type="text"
              value={username}
              onChange={setUsername}
              className="w-full px-6 py-4 text-2xl border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite seu usuário"
              autoComplete="username"
              required
              disabled={carregando}
              keyboardSize="large"
            />
          </div>
          <div className="mb-8">
            <label className="block text-xl font-medium text-gray-700 mb-3">
              Senha
            </label>
            <InputWithKeyboard
              type="password"
              value={senha}
              onChange={setSenha}
              className="w-full px-6 py-4 text-2xl border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
              disabled={carregando}
              keyboardSize="large"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 px-6 text-white text-2xl rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#4C79AF' }}
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        {SHOW_CADASTRO_LINK && (
          <div className="mt-4 text-center">
            <Link
              to="/cadastro-usuario"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-2"
            >
              <i className="bi bi-person-plus"></i>
              <span>Cadastrar novo usuário</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

