import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { producaoAPI } from '../../api/api';
import { useVirtualKeyboard } from '../../contexts/VirtualKeyboardContext';

interface PecaFluxo {
  nome: string;
  codigo: string;
}

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
  const operador = navegacao.operador || sessaoSalva?.operador || '';

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
  const [pecasFluxo, setPecasFluxo] = useState<PecaFluxo[]>([]);
  const [indicePecaAtual, setIndicePecaAtual] = useState<number>(0);
  const [deveFocarQuantidade, setDeveFocarQuantidade] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showKeyboard, setKeyboardLayout, setKeyboardSize } = useVirtualKeyboard();

  const pecaAtual = pecasFluxo[indicePecaAtual] || null;
  const isUltimaPeca = pecasFluxo.length <= 1 || indicePecaAtual === pecasFluxo.length - 1;

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

  useEffect(() => {
    try {
      const sessao = localStorage.getItem('ihm_sessao');
      if (sessao) {
        const dados = JSON.parse(sessao);
        dados.indicePecaAtualFinalizacao = indicePecaAtual;
        localStorage.setItem('ihm_sessao', JSON.stringify(dados));
      }
    } catch {
      // ignorar erros
    }
  }, [indicePecaAtual]);

  // Limpar sessão e voltar à tela inicial
  const voltarAoLeitor = () => {
    // Limpar apenas os dados de finalização, manter o resto da sessão se necessário
    try {
      const sessao = localStorage.getItem('ihm_sessao');
      if (sessao) {
        const dados = JSON.parse(sessao);
        delete dados.quantidadeFinalizacao;
        delete dados.registroId;
        delete dados.indicePecaAtualFinalizacao;
        localStorage.setItem('ihm_sessao', JSON.stringify(dados));
      }
    } catch { /* ignorar erros */ }
    
    // Remover completamente a sessão apenas quando finalizar com sucesso
    localStorage.removeItem('ihm_sessao');
    navigate('/ihm/leitor', { replace: true });
  };

  const voltarParaOperacao = () => {
    try {
      const sessao = localStorage.getItem('ihm_sessao');
      if (sessao) {
        const dados = JSON.parse(sessao);
        delete dados.quantidadeFinalizacao;
        delete dados.indicePecaAtualFinalizacao;
        localStorage.setItem('ihm_sessao', JSON.stringify(dados));
      }
    } catch {
      // ignorar erros
    }

    navigate('/ihm/operacao', {
      state: {
        operador: operador || undefined
      }
    });
  };
  
  useEffect(() => {
    inputRef.current?.focus();
  }, [location.key]);

  const focarCampoQuantidade = () => {
    const executarFoco = () => {
      inputRef.current?.focus();
    };
    requestAnimationFrame(() => requestAnimationFrame(executarFoco));
  };

  useEffect(() => {
    if (deveFocarQuantidade && !carregando) {
      focarCampoQuantidade();
      setDeveFocarQuantidade(false);
    }
  }, [deveFocarQuantidade, carregando, indicePecaAtual]);

  useEffect(() => {
    try {
      const sessao = localStorage.getItem('ihm_sessao');
      if (!sessao) return;

      const dados = JSON.parse(sessao);
      const pecasSalvas: PecaFluxo[] = Array.isArray(dados.pecasDisponiveis)
        ? dados.pecasDisponiveis
            .filter((p: any) => p && typeof p.nome === 'string' && p.nome.trim().length > 0)
            .map((p: any) => ({ nome: p.nome, codigo: p.codigo || '' }))
        : [];

      const listaPecas: PecaFluxo[] = pecasSalvas.length > 0
        ? pecasSalvas
        : (dados.peca ? [{ nome: dados.peca, codigo: dados.codigo || '' }] : []);
      setPecasFluxo(listaPecas);

      const indiceSalvo = Number.isInteger(dados.indicePecaAtualFinalizacao)
        ? Number(dados.indicePecaAtualFinalizacao)
        : 0;
      const indiceNormalizado = Math.max(0, Math.min(indiceSalvo, Math.max(listaPecas.length - 1, 0)));
      setIndicePecaAtual(indiceNormalizado);

      setQuantidade(dados.quantidadeFinalizacao || '');
    } catch {
      // ignorar sessão inválida
    }
  }, []);

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

  const handleEnviarOuConcluir = async () => {
    // Validar quantidade
    const qtd = parseInt(quantidade);
    if (!quantidade.trim() || isNaN(qtd) || qtd < 0) {
      setErro('Informe uma quantidade válida');
      return;
    }

    try {
      setCarregando(true);
      setErro(null);

      if (!registroId) {
        setErro('Não foi possível identificar o registro aberto para esta peça');
        setCarregando(false);
        return;
      }

      await producaoAPI.registrarSaida({
        registro_id: registroId,
        quantidade: qtd
      });

      if (!isUltimaPeca) {
        const proximoIndice = indicePecaAtual + 1;
        const proximaPeca = pecasFluxo[proximoIndice];
        if (!proximaPeca) {
          setErro('Não foi possível identificar a próxima peça');
          setCarregando(false);
          return;
        }

        const sessao = localStorage.getItem('ihm_sessao');
        const dadosSessao = sessao ? JSON.parse(sessao) : {};
        const operacaoSessao = dadosSessao.operacao;
        const modeloSessao = dadosSessao.modelo;

        const novaEntrada = await producaoAPI.registrarEntrada({
          posto: posto,
          funcionario_matricula: funcionario_matricula,
          modelo_codigo: modeloSessao || undefined,
          operacao: operacaoSessao || undefined,
          peca: proximaPeca.nome || undefined,
          codigo: proximaPeca.codigo || undefined
        });

        if (novaEntrada?.registro_id) {
          setRegistroId(novaEntrada.registro_id);
          try {
            const sessaoAtual = localStorage.getItem('ihm_sessao');
            if (sessaoAtual) {
              const dadosAtual = JSON.parse(sessaoAtual);
              dadosAtual.registroId = novaEntrada.registro_id;
              localStorage.setItem('ihm_sessao', JSON.stringify(dadosAtual));
            }
          } catch {
            // ignorar erros
          }
        }

        setIndicePecaAtual(proximoIndice);
        setQuantidade('');
        setDeveFocarQuantidade(true);
        setCarregando(false);
        return;
      }

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
      handleEnviarOuConcluir();
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-start pt-16 p-6 relative">
      <button
        onClick={voltarParaOperacao}
        disabled={carregando}
        className="absolute top-6 right-6 px-10 py-6 text-white text-4xl font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gray-600 hover:bg-gray-700 z-10"
        style={{
          minHeight: '88px',
          minWidth: '210px'
        }}
      >
        Voltar
      </button>

      {erro && (
        <div className="mb-8 px-8 py-5 bg-red-100 border border-red-400 text-red-700 rounded-lg text-2xl">
          {erro}
        </div>
      )}

      <div className="w-full max-w-4xl flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center justify-center">
          <label className="block text-gray-700 text-4xl font-bold text-center">
            INFORME A QUANTIDADE DE CADA PEÇA PRODUZIDA
          </label>
          {pecasFluxo.length > 0 && (
            <p className="text-4xl text-blue-700 text-center mt-3 font-semibold">
              Peça {Math.min(indicePecaAtual + 1, pecasFluxo.length)} de {pecasFluxo.length}
            </p>
          )}
         
        </div>

        <div className="flex items-center justify-center gap-8">
          <input
            type="text"
            value={pecaAtual?.nome || ''}
            readOnly
            placeholder="Peça"
            className="px-8 py-6 text-4xl border-4 border-gray-400 rounded-lg focus:outline-none text-center bg-gray-100 cursor-not-allowed"
            style={{ minHeight: '130px', minWidth: '320px' }}
          />

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
            onClick={handleEnviarOuConcluir}
            disabled={carregando || !quantidade.trim()}
            className="px-12 py-6 text-white text-5xl font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700"
            style={{ 
              minHeight: '130px',
              minWidth: '280px'
            }}
          >
            {carregando ? (isUltimaPeca ? 'Concluindo...' : 'Salvando...') : (isUltimaPeca ? 'Concluir' : 'Salvar')}
          </button>

        </div>
      </div>
    </div>
  );
};

export default FinalizarProducao;

