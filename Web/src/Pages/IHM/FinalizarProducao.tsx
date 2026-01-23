import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { producaoAPI, cancelamentoAPI } from '../../api/api';

const FinalizarProducao = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { posto, funcionario_matricula, operador } = (location.state as { 
    posto?: string; 
    funcionario_matricula?: string; 
    operador?: string;
  }) || {};

  const [quantidade, setQuantidade] = useState<string>('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [registroId, setRegistroId] = useState<number | null>(null);

  useEffect(() => {
    // Se não tiver os dados necessários, redirecionar para o leitor inicial
    if (!posto || !funcionario_matricula) {
      navigate('/ihm/leitor', { replace: true });
    }
  }, [posto, funcionario_matricula, navigate]);

  // Buscar registro aberto ao carregar a página
  useEffect(() => {
    if (!posto || !funcionario_matricula) {
      return;
    }

    const buscarRegistro = async () => {
      try {
        const registroResponse = await producaoAPI.buscarRegistroAberto(posto, funcionario_matricula);
        if (registroResponse.registro && registroResponse.registro.id) {
          setRegistroId(registroResponse.registro.id);
        } else {
          // Registro não encontrado, redirecionar para o leitor
          setErro('Nenhum registro em aberto encontrado');
          setTimeout(() => {
            navigate('/ihm/leitor', { replace: true });
          }, 2000);
        }
      } catch (error) {
        // Se não encontrar registro, redirecionar
        setErro('Nenhum registro em aberto encontrado');
        setTimeout(() => {
          navigate('/ihm/leitor', { replace: true });
        }, 2000);
      }
    };

    buscarRegistro();

    // Verificar periodicamente se o registro foi cancelado
    const verificarRegistroCancelado = async () => {
      try {
        const registroResponse = await producaoAPI.buscarRegistroAberto(posto, funcionario_matricula);
        if (!registroResponse.registro) {
          // Registro foi cancelado, redirecionar para o leitor
          setErro('Operação foi cancelada');
          setTimeout(() => {
            navigate('/ihm/leitor', { replace: true });
          }, 2000);
        }
      } catch (error) {
        // Se não encontrar registro, pode ter sido cancelado
        setErro('Operação foi cancelada');
        setTimeout(() => {
          navigate('/ihm/leitor', { replace: true });
        }, 2000);
      }
    };

    // Verificar a cada 5 segundos se o registro foi cancelado
    const interval = setInterval(verificarRegistroCancelado, 5000);
    return () => clearInterval(interval);
  }, [posto, funcionario_matricula, navigate]);

  const handleConcluir = async () => {
    if (!posto || !funcionario_matricula) {
      setErro('Dados insuficientes para finalizar');
      return;
    }

    // Validar quantidade
    const qtd = parseInt(quantidade);
    if (!quantidade.trim() || isNaN(qtd) || qtd < 0) {
      setErro('Informe uma quantidade válida');
      return;
    }

    try {
      setCarregando(true);
      setErro(null);

      // Verificar se ainda há registro aberto
      const registroResponse = await producaoAPI.buscarRegistroAberto(posto, funcionario_matricula);
      if (!registroResponse.registro) {
        setErro('Operação foi cancelada');
        setTimeout(() => {
          navigate('/ihm/leitor', { replace: true });
        }, 2000);
        return;
      }

      const registroIdAtual = registroResponse.registro.id || registroId;

      // Se quantidade for zero, cancelar a operação e salvar na tabela operacoes_canceladas
      if (qtd === 0) {
        if (!registroIdAtual) {
          setErro('Não foi possível identificar o registro para cancelamento');
          setCarregando(false);
          return;
        }

        try {
          // Cancelar operação com motivo padrão - isso salva na tabela operacoes_canceladas
          await cancelamentoAPI.cancelar({
            registro_id: registroIdAtual,
            motivo: 'Operação cancelada pelo operador (quantidade zero)'
          });

          // Sucesso - registro foi salvo na tabela operacoes_canceladas
          console.log('Operação cancelada e salva na tabela operacoes_canceladas');
        } catch (error: any) {
          console.error('Erro ao cancelar operação:', error);
          setErro(error.message || 'Erro ao cancelar operação');
          setCarregando(false);
          return;
        }

        // Redirecionar para o leitor inicial (página de boas-vindas)
        navigate('/ihm/leitor', { replace: true });
        return;
      }

      // Se quantidade > 0, registrar saída normalmente
      await producaoAPI.registrarSaida({
        posto: posto,
        funcionario_matricula: funcionario_matricula,
        quantidade: qtd
      });

      // Redirecionar para o leitor inicial (página de boas-vindas)
      navigate('/ihm/leitor', { replace: true });
    } catch (error: any) {
      console.error('Erro ao finalizar produção:', error);
      setErro(error.message || 'Erro ao finalizar produção');
      setCarregando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quantidade.trim()) {
      handleConcluir();
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-start pt-6 p-6">
      {erro && (
        <div className="mb-6 px-6 py-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-xl">
          {erro}
        </div>
      )}

      <div className="w-full max-w-4xl flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center justify-center">
          <label className="block text-gray-700 text-xl font-bold text-center">
            QTD DE PEÇAS PRODUZIDAS
          </label>
          <p className="text-base text-gray-600 text-center mt-1">
            (Digite 0 para cancelar a operação)
          </p>
        </div>

        <div className="flex items-center justify-center gap-6">
          <input
            type="number"
            value={quantidade}
            onChange={(e) => {
              setQuantidade(e.target.value);
              setErro(null);
            }}
            onKeyDown={handleKeyDown}
            className="px-6 py-5 text-3xl border-4 border-gray-400 rounded-lg focus:outline-none focus:border-blue-500 text-center"
            style={{ minHeight: '80px', minWidth: '200px' }}
            autoFocus
            disabled={carregando}
            min="0"
          />

          <button
            onClick={handleConcluir}
            disabled={carregando || !quantidade.trim()}
            className="px-12 py-6 text-white text-3xl font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700"
            style={{ 
              minHeight: '80px',
              minWidth: '250px'
            }}
          >
            {carregando ? 'Concluindo...' : 'Concluir'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalizarProducao;

