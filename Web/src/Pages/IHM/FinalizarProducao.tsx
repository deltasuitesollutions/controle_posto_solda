import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { producaoAPI, cancelamentoAPI } from '../../api/api';
import { useVirtualKeyboard } from '../../contexts/VirtualKeyboardContext';

const FinalizarProducao = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Recuperar dados: navegação normal ou sessão salva (após reinicialização)
  const navegacao = (location.state as { 
    posto?: string; 
    funcionario_matricula?: string; 
    operador?: string;
  }) || {};
  const sessaoSalva = (() => {
    try {
      const s = localStorage.getItem('ihm_sessao');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  })();
  const posto = navegacao.posto || sessaoSalva?.posto || '';
  const funcionario_matricula = navegacao.funcionario_matricula || sessaoSalva?.funcionarioMatricula || '';

  // Restaurar quantidade do localStorage se existir
  const quantidadeInicial = (() => {
    try {
      const sessao = localStorage.getItem('ihm_sessao');
      if (sessao) {
        const dados = JSON.parse(sessao);
        return dados.quantidadeFinalizacao || '';
      }
    } catch { /* ignorar erros */ }
    return '';
  })();

  const [quantidade, setQuantidade] = useState<string>(quantidadeInicial);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [registroId, setRegistroId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showKeyboard, setKeyboardLayout, setKeyboardSize } = useVirtualKeyboard();

  // Salvar quantidade no localStorage sempre que mudar
  useEffect(() => {
    try {
      const sessao = localStorage.getItem('ihm_sessao');
      if (sessao) {
        const dados = JSON.parse(sessao);
        dados.quantidadeFinalizacao = quantidade;
        localStorage.setItem('ihm_sessao', JSON.stringify(dados));
      }
    } catch { /* ignorar erros */ }
  }, [quantidade]);

  // Limpar sessão e voltar à tela inicial
  const voltarAoLeitor = () => {
    // Limpar apenas os dados de finalização, manter o resto da sessão se necessário
    try {
      const sessao = localStorage.getItem('ihm_sessao');
      if (sessao) {
        const dados = JSON.parse(sessao);
        delete dados.quantidadeFinalizacao;
        delete dados.registroId;
        localStorage.setItem('ihm_sessao', JSON.stringify(dados));
      }
    } catch { /* ignorar erros */ }
    
    // Remover completamente a sessão apenas quando finalizar com sucesso
    localStorage.removeItem('ihm_sessao');
    navigate('/ihm/leitor', { replace: true });
  };
  
  useEffect(() => {
    inputRef.current?.focus();
  }, [location.key]);

  useEffect(() => {
    if (!posto || !funcionario_matricula) {
      voltarAoLeitor();
    }
  }, [posto, funcionario_matricula, navigate]);

  // Buscar registro aberto ao carregar a página
  useEffect(() => {
    if (!posto || !funcionario_matricula) {
      return;
    }

    const buscarRegistro = async () => {
      try {
        // Tentar restaurar registroId do localStorage primeiro
        try {
          const sessao = localStorage.getItem('ihm_sessao');
          if (sessao) {
            const dados = JSON.parse(sessao);
            if (dados.registroId) {
              setRegistroId(dados.registroId);
            }
          }
        } catch { /* ignorar erros */ }

        const registroResponse = await producaoAPI.buscarRegistroAberto(posto, funcionario_matricula);
        if (registroResponse.registro && registroResponse.registro.id) {
          const id = registroResponse.registro.id;
          setRegistroId(id);
          
          // Salvar registroId no localStorage
          try {
            const sessao = localStorage.getItem('ihm_sessao');
            if (sessao) {
              const dados = JSON.parse(sessao);
              dados.registroId = id;
              localStorage.setItem('ihm_sessao', JSON.stringify(dados));
            }
          } catch { /* ignorar erros */ }
        } else {
          // Registro não encontrado, redirecionar para o leitor
          setErro('Nenhum registro em aberto encontrado');
          setTimeout(() => {
            voltarAoLeitor();
          }, 2000);
        }
      } catch (error) {
        // Se não encontrar registro, redirecionar
        setErro('Nenhum registro em aberto encontrado');
        setTimeout(() => {
          voltarAoLeitor();
        }, 2000);
      }
    };

    buscarRegistro();
  }, [posto, funcionario_matricula, navigate]);

  const handleConcluir = async () => {
    // Validar quantidade
    const qtd = parseInt(quantidade);
    if (!quantidade.trim() || isNaN(qtd) || qtd < 0) {
      setErro('Informe uma quantidade válida');
      return;
    }

    try {
      setCarregando(true);
      setErro(null);

      // Se quantidade for zero, operação cancelada.
      if (qtd === 0) {
        if (!registroId) {
          setErro('Não foi possível identificar o registro para cancelamento');
          setCarregando(false);
          return;
        }

        try {
          await cancelamentoAPI.cancelar({
            registro_id: registroId,
            motivo: ''
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
        voltarAoLeitor();
        return;
      }

      // Se quantidade > 0, registrar saída normalmente
      await producaoAPI.registrarSaida({
        posto: posto,
        funcionario_matricula: funcionario_matricula,
        quantidade: qtd
      });

      // Redirecionar para o leitor inicial (página de boas-vindas)
      voltarAoLeitor();
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
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-start pt-16 p-6">
      {erro && (
        <div className="mb-8 px-8 py-5 bg-red-100 border border-red-400 text-red-700 rounded-lg text-2xl">
          {erro}
        </div>
      )}

      <div className="w-full max-w-4xl flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center justify-center">
          <label className="block text-gray-700 text-6xl font-bold text-center">
            QTD DE PEÇAS PRODUZIDAS
          </label>
          <p className="text-4xl text-gray-600 text-center mt-3">
            (Digite 0 para cancelar a operação)
          </p>
        </div>

        <div className="flex items-center justify-center gap-8">
          <input
            ref={inputRef}
            type="number"
            value={quantidade}
            onChange={(e) => {
              setQuantidade(e.target.value);
              setErro(null);
            }}
            onFocus={() => {
              setKeyboardLayout('numeric');
              setKeyboardSize('large');
              showKeyboard(inputRef, quantidade, (val: string) => {
                setQuantidade(val);
                setErro(null);
              });
            }}
            onKeyDown={handleKeyDown}
            className="px-8 py-6 text-4xl border-4 border-gray-400 rounded-lg focus:outline-none focus:border-blue-500 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{ minHeight: '150px', minWidth: '400px' }}
            disabled={carregando}
            min="0"
          />

          <button
            onClick={handleConcluir}
            disabled={carregando || !quantidade.trim()}
            className="px-14 py-7 text-white text-6xl font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700"
            style={{ 
              minHeight: '150px',
              minWidth: '320px'
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

