import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ihmAPI, producaoAPI } from '../../api/api';

interface OperacaoContexto {
  id: number;
  codigo: string;
  nome: string;
  produto: string;
  modelo: {
    id: number;
    codigo: string;
    descricao: string;
  };
  posto: string;
  pecas: Array<{ nome: string; codigo: string }>;
  codigos: string[];
}

const Operacao = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Recuperar operador: navegação normal ou sessão salva (após reinicialização)
  const operador = (() => {
    const doState = (location.state as { operador?: string })?.operador;
    if (doState) return doState;
    try {
      const sessao = localStorage.getItem('ihm_sessao');
      if (sessao) return JSON.parse(sessao).operador || '';
    } catch { /* sessão inválida */ }
    return '';
  })();

  const [operacao, setOperacao] = useState('');
  const [produto, setProduto] = useState('');
  const [modelo, setModelo] = useState('');
  const [modeloDescricao, setModeloDescricao] = useState('');
  const [peca, setPeca] = useState('');
  const [codigo, setCodigo] = useState('');
  const [operacoes, setOperacoes] = useState<OperacaoContexto[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [registroAberto, setRegistroAberto] = useState<any>(null);
  const [funcionarioMatricula, setFuncionarioMatricula] = useState<string>('');
  const [postoAtual, setPostoAtual] = useState<string>('');
  const [pecasDisponiveis, setPecasDisponiveis] = useState<Array<{nome: string; codigo: string}>>([]);
  const [erroOperacao, setErroOperacao] = useState(false);
  const [erroPeca, setErroPeca] = useState(false);
  const operacoesMapRef = useRef<Map<string, OperacaoContexto>>(new Map());

  useEffect(() => {
    if (!operador) {
      navigate('/ihm/leitor', { replace: true });
    }
  }, [operador, navigate]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        
        const dados = await ihmAPI.buscarContextoOperacao(operador);
        
        if (dados.funcionario) {
          setFuncionarioMatricula(dados.funcionario.matricula);
        }
        
        const ops = dados.operacoes || [];
        setOperacoes(ops);
        
        const mapa = new Map<string, OperacaoContexto>();
        ops.forEach((op: OperacaoContexto) => {
          mapa.set(op.codigo, op);
        });
        operacoesMapRef.current = mapa;
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setCarregando(false);
      }
    };
    carregarDados();
  }, [operador]);

  // Restaurar operação da sessão salva (após reinicialização)
  useEffect(() => {
    if (operacoes.length > 0 && !operacao) {
      try {
        const sessao = localStorage.getItem('ihm_sessao');
        if (sessao) {
          const dados = JSON.parse(sessao);
          if (dados.operacao) {
            setOperacao(dados.operacao);
          }
        }
      } catch { /* sessão inválida, ignorar */ }
    }
  }, [operacoes]);

  const preencherCamposOperacao = (codigoOperacao: string, restaurarDadosSalvos: boolean = false) => {
    if (!codigoOperacao) {
      setProduto('');
      setModelo('');
      setModeloDescricao('');
      setPeca('');
      setCodigo('');
      setPostoAtual('');
      setPecasDisponiveis([]);
      return;
    }
    
    const op = operacoesMapRef.current.get(codigoOperacao);
    if (!op) return;
    
    // Se estiver restaurando dados salvos, usar os valores do localStorage
    if (restaurarDadosSalvos) {
      try {
        const sessao = localStorage.getItem('ihm_sessao');
        if (sessao) {
          const dados = JSON.parse(sessao);
          if (dados.operacao === codigoOperacao) {
            // Restaurar valores salvos
            setProduto(dados.produto || op.produto);
            setModelo(dados.modelo || op.modelo.codigo);
            setModeloDescricao(dados.modeloDescricao || op.modelo.descricao);
            setPostoAtual(dados.posto || op.posto);
            setPecasDisponiveis(op.pecas);
            
            // Restaurar peça e código salvos quando existirem.
            if (dados.peca) {
              setPeca(dados.peca);
            } else if (op.pecas.length > 0) {
              setPeca(op.pecas[0].nome);
            } else {
              setPeca('');
            }
            
            if (dados.codigo) {
              setCodigo(dados.codigo);
            } else if (op.pecas.length > 0) {
              setCodigo(op.pecas[0].codigo || op.codigos[0] || '');
            } else {
              setCodigo(op.codigos[0] || '');
            }
            return;
          }
        }
      } catch { /* ignorar erros */ }
    }
    
    // Preencher normalmente se não estiver restaurando
    setProduto(op.produto);
    setModelo(op.modelo.codigo);
    setModeloDescricao(op.modelo.descricao);
    setPostoAtual(op.posto);
    setPecasDisponiveis(op.pecas);
    
    if (op.pecas.length > 0) {
      setPeca(op.pecas[0].nome);
      setCodigo(op.pecas[0].codigo || op.codigos[0] || '');
    } else {
      setPeca('');
      setCodigo(op.codigos[0] || '');
    }
  };

  useEffect(() => {
    if (operacao && operacoes.length > 0) {
      // Verificar se temos dados salvos para esta operação
      try {
        const sessao = localStorage.getItem('ihm_sessao');
        if (sessao) {
          const dados = JSON.parse(sessao);
          if (dados.operacao === operacao) {
            // Restaurar dados salvos
            preencherCamposOperacao(operacao, true);
            return;
          }
        }
      } catch { /* ignorar erros */ }
      
      // Se não tiver dados salvos, preencher normalmente
      preencherCamposOperacao(operacao, false);
    }
  }, [operacao, operacoes]);

  // Verificar registro aberto quando operação e matrícula estiverem disponíveis
  useEffect(() => {
    const verificarRegistroAberto = async () => {
      // Se não tiver postoAtual ainda, tentar pegar do localStorage
      let postoParaVerificar = postoAtual;
      let matriculaParaVerificar = funcionarioMatricula;
      
      if (!postoParaVerificar || !matriculaParaVerificar) {
        try {
          const sessao = localStorage.getItem('ihm_sessao');
          if (sessao) {
            const dados = JSON.parse(sessao);
            if (!postoParaVerificar && dados.posto) {
              postoParaVerificar = dados.posto;
            }
            if (!matriculaParaVerificar && dados.funcionarioMatricula) {
              matriculaParaVerificar = dados.funcionarioMatricula;
            }
          }
        } catch { /* ignorar erros */ }
      }
      
      if (operacao && matriculaParaVerificar && postoParaVerificar) {
        try {
          const response = await producaoAPI.buscarRegistroAberto(postoParaVerificar, matriculaParaVerificar);
          if (response.registro) {
            setRegistroAberto(response.registro);
          } else {
            setRegistroAberto(null);
          }
        } catch (error) {
          setRegistroAberto(null);
        }
      } else {
        setRegistroAberto(null);
      }
    };
    verificarRegistroAberto();
  }, [operacao, funcionarioMatricula, postoAtual, navigate, operador]);

  const validarFormulario = (): boolean => {
    const faltaOperacao = !operacao;
    const faltaPeca = false;
    
    setErroOperacao(faltaOperacao);
    setErroPeca(faltaPeca);
    
    return !faltaOperacao && !faltaPeca;
  };

  // Esse trecho valida se todos os campos obrigatórios estão preenchidos.
  const handleIniciarTrabalho = async () => {
    if (!validarFormulario()) {
      alert('Preencha todos os campos obrigatórios antes de iniciar o trabalho.');
      return;
    }

    if (!postoAtual) {
      alert('Operação selecionada não possui posto associado.');
      return;
    }

    if (!funcionarioMatricula) {
      alert('Não foi possível identificar a matrícula do operador.');
      return;
    }

    try {
      setCarregando(true);
      
      const response = await producaoAPI.registrarEntrada({
        posto: postoAtual,
        funcionario_matricula: funcionarioMatricula,
        modelo_codigo: modelo,
        operacao: operacao || undefined,
        peca: peca || undefined,
        codigo: codigo || undefined
      });

      // Usar a resposta diretamente para atualizar o estado
      setRegistroAberto({
        registro_id: response.registro_id,
        hora_inicio: response.hora_inicio,
        data: response.data,
        funcionario_matricula: response.funcionario_matricula,
        produto: response.produto
      });

      // Salvar sessão completa para restauração após reinicialização
      localStorage.setItem('ihm_sessao', JSON.stringify({
        operador,
        funcionarioMatricula,
        posto: postoAtual,
        operacao,
        modelo,
        modeloDescricao,
        peca,
        codigo,
        produto,
        pecasDisponiveis
      }));
      
      setCarregando(false);
    } catch (error: any) {
      console.error('Erro ao iniciar trabalho:', error);
      const mensagem = error.message || 'Erro ao iniciar trabalho. Tente novamente.';
      alert(mensagem);
      setRegistroAberto(null);
      setCarregando(false);
    }
  };


  const handleFinalizarProcesso = () => {
    if (!postoAtual || !funcionarioMatricula) {
      alert('Dados insuficientes para finalizar o processo.');
      return;
    }

    navigate('/ihm/finalizar-producao', {
      state: {
        posto: postoAtual,
        funcionario_matricula: funcionarioMatricula,
        operador: operador
      }
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col p-6">
      <div className="flex justify-between items-start mb-8 gap-6">
        <div className="flex-1">
          <label className="block text-gray-700 text-5xl font-bold mb-3">
            OPERAÇÃO
          </label>
          <select
            value={operacao}
            onChange={(e) => {
              const codigoOperacao = e.target.value;
              setOperacao(codigoOperacao);
              if (erroOperacao) setErroOperacao(false);
              
              if (operacoes.length > 0) {
                preencherCamposOperacao(codigoOperacao);
              }
            }}
            className={`w-full px-5 py-4 text-5xl border-4 rounded-lg focus:outline-none bg-white appearance-none cursor-pointer ${erroOperacao ? 'border-red-500' : 'border-gray-400 focus:border-blue-500'}`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1.25rem center',
              paddingRight: '3rem',
              minHeight: '60px',
            }}
          >
            <option value="">Selecione</option>
            {operacoes.map((op) => (
              <option key={op.codigo} value={op.codigo}>
                {op.nome || op.codigo}
              </option>
            ))}
          </select>
        </div>

      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div>
          <label className="text-gray-700 text-5xl font-bold mb-3 block">
            PRODUTO
          </label>
          <input
            type="text"
            value={produto}
            readOnly
            className="w-full px-4 py-3 text-4xl border-2 border-gray-400 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed"
            style={{ minHeight: '55px' }}
          />
        </div>

        <div>
          <label className="text-gray-700 text-5xl font-bold mb-3 block">
            MODELO
          </label>
          <input
            type="text"
            value={modeloDescricao}
            readOnly
            className="w-full px-4 py-3 text-4xl border-2 border-gray-400 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed"
            style={{ minHeight: '55px' }}
          />
        </div>

        <div>
          <label className="text-gray-700 text-5xl font-bold mb-3 block">
            PEÇA
          </label>
          {pecasDisponiveis.length > 1 ? (
            <select
              value={peca}
              onChange={(e) => {
                const novaPeca = e.target.value;
                setPeca(novaPeca);
                if (erroPeca) setErroPeca(false);
                const pecaSelecionada = pecasDisponiveis.find(p => p.nome === novaPeca);
                if (pecaSelecionada) {
                  setCodigo(pecaSelecionada.codigo || '');
                }
              }}
              className={`w-full px-4 py-3 text-4xl border-2 rounded-lg focus:outline-none bg-white appearance-none cursor-pointer ${erroPeca ? 'border-red-500' : 'border-gray-400 focus:border-blue-500'}`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                paddingRight: '2.5rem',
                minHeight: '55px',
              }}
            >
              {pecasDisponiveis.map((p, idx) => (
                <option key={idx} value={p.nome}>{p.nome}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={peca}
              readOnly
              className="w-full px-4 py-3 text-4xl border-2 border-gray-400 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed"
              style={{ minHeight: '55px' }}
            />
          )}
        </div>

        <div>
          <label className="text-gray-700 text-5xl font-bold mb-3 block">
            CÓDIGO
          </label>
          <input
            type="text"
            value={codigo}
            readOnly
            className="w-full px-4 py-3 text-3xl border-2 border-gray-400 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed"
            style={{ minHeight: '55px' }}
          />
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex items-end gap-6 mb-6">
          <div className="flex-1">
            <label className="text-gray-700 text-5xl font-bold mb-3 block">
              OPERADOR:
            </label>
            <input
              type="text"
              value={operador}
              readOnly
              className="w-full px-4 py-3 text-4xl border-2 border-gray-400 rounded-lg bg-gray-100 cursor-not-allowed"
              style={{ minHeight: '50px' }}
            />
          </div>

          <button
            onClick={registroAberto ? handleFinalizarProcesso : handleIniciarTrabalho}
            disabled={carregando || (!registroAberto && !operacao)}
            className="px-12 py-6 text-white text-7xl font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: registroAberto ? '#28a745' : 'var(--bg-laranja)',
              minHeight: '70px',
              minWidth: '300px'
            }}
            onMouseEnter={(e) => {
              if (!carregando) {
                if (registroAberto) {
                  e.currentTarget.style.backgroundColor = '#218838';
                } else {
                  e.currentTarget.style.backgroundColor = '#C55A15';
                }
              }
            }}
            onMouseLeave={(e) => {
              if (!carregando) {
                if (registroAberto) {
                  e.currentTarget.style.backgroundColor = '#28a745';
                } else {
                  e.currentTarget.style.backgroundColor = 'var(--bg-laranja)';
                }
              }
            }}
          >
            {registroAberto ? 'Finalizar processo' : 'Iniciar trabalho'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Operacao;
