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
  const operador = (location.state as { operador?: string })?.operador || '';

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
  const [erros, setErros] = useState({
    operacao: false,
    produto: false,
    modelo: false,
    peca: false,
    codigo: false,
  });
  const tinhaRegistroRef = useRef(false);
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

  const preencherCamposOperacao = (codigoOperacao: string) => {
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
      preencherCamposOperacao(operacao);
    }
  }, [operacao, operacoes]);

  // Verificar registro aberto quando operação e matrícula estiverem disponíveis
  useEffect(() => {
    const verificarRegistroAberto = async () => {
      if (operacao && funcionarioMatricula && postoAtual) {
        try {
          const response = await producaoAPI.buscarRegistroAberto(postoAtual, funcionarioMatricula);
          if (response.registro) {
            tinhaRegistroRef.current = true;
            setRegistroAberto(response.registro);
            // Se há registro aberto, apenas atualizar o estado (não redirecionar)
            // O botão mudará para "Finalizar processo"
          } else {
            // Se havia registro aberto antes e agora não há mais (foi cancelado), redirecionar para o leitor
            if (tinhaRegistroRef.current) {
              tinhaRegistroRef.current = false;
              navigate('/ihm/leitor', { replace: true });
              return;
            }
            tinhaRegistroRef.current = false;
            setRegistroAberto(null);
          }
        } catch (error) {
          // Se não encontrar registro e havia um registro aberto antes (foi cancelado), redirecionar
          if (tinhaRegistroRef.current) {
            tinhaRegistroRef.current = false;
            navigate('/ihm/leitor', { replace: true });
            return;
          }
          // Se não encontrar registro, não é erro - limpar estado
          tinhaRegistroRef.current = false;
          setRegistroAberto(null);
        }
      } else {
        tinhaRegistroRef.current = false;
        setRegistroAberto(null);
      }
    };
    verificarRegistroAberto();
    
    // Verificar periodicamente para manter sincronizado (a cada 5 segundos)
    const interval = setInterval(verificarRegistroAberto, 5000);
    return () => clearInterval(interval);
  }, [operacao, funcionarioMatricula, postoAtual, navigate, operador]);

  const validarFormulario = (): boolean => {
    const novosErros = {
      operacao: !operacao,
      produto: !produto,
      modelo: !modelo,
      peca: !peca,
      codigo: !codigo,
    };

    setErros(novosErros);
    return !Object.values(novosErros).some(erro => erro);
  };

  const handleIniciarTrabalho = async () => {
    // Validar que todos os campos obrigatórios estão preenchidos
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
      
      // Verificar se há registro aberto antes de tentar criar novo
      // Se houver, atualizar o estado para garantir que está sincronizado
      if (registroAberto) {
        try {
          const response = await producaoAPI.buscarRegistroAberto(postoAtual, funcionarioMatricula);
          if (response.registro) {
            // Ainda há registro aberto, não pode criar novo
            alert('Já existe um registro em aberto. Conclua o trabalho atual antes de iniciar um novo.');
            setCarregando(false);
            return;
          } else {
            // Registro foi fechado, limpar estado
            setRegistroAberto(null);
          }
        } catch (error) {
          // Se não encontrar registro, está ok, pode criar novo
          setRegistroAberto(null);
        }
      }
      
      // Sempre usar o modelo selecionado, que é o que existe no banco
      if (!modelo) {
        alert('Selecione um modelo antes de iniciar o trabalho.');
        setCarregando(false);
        return;
      }
      
      await producaoAPI.registrarEntrada({
        posto: postoAtual,
        funcionario_matricula: funcionarioMatricula,
        modelo_codigo: modelo,
        operacao: operacao || undefined,
        peca: peca || undefined,
        codigo: codigo || undefined
      });

      // Atualizar registro aberto
      const response = await producaoAPI.buscarRegistroAberto(postoAtual, funcionarioMatricula);
      if (response.registro) {
        setRegistroAberto(response.registro);
      }
      
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
          <label className="block text-gray-700 text-4xl font-bold mb-3">
            OPERAÇÃO
          </label>
          <select
            value={operacao}
            onChange={(e) => {
              const codigoOperacao = e.target.value;
              setOperacao(codigoOperacao);
              if (erros.operacao) setErros({ ...erros, operacao: false });
              
              if (operacoes.length > 0) {
                preencherCamposOperacao(codigoOperacao);
              }
            }}
            className={`w-full px-5 py-4 text-5xl border-4 rounded-lg focus:outline-none bg-white appearance-none cursor-pointer ${erros.operacao ? 'border-red-500' : 'border-gray-400 focus:border-blue-500'}`}
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
          <label className="text-gray-700 text-4xl font-bold mb-3 block">
            PRODUTO
          </label>
          <input
            type="text"
            value={produto}
            readOnly
            className={`w-full px-4 py-3 text-4xl border-2 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed ${erros.produto ? 'border-red-500' : 'border-gray-400'}`}
            style={{ minHeight: '55px' }}
          />
        </div>

        <div>
          <label className="text-gray-700 text-4xl font-bold mb-3 block">
            MODELO
          </label>
          <input
            type="text"
            value={modeloDescricao}
            readOnly
            className={`w-full px-4 py-3 text-4xl border-2 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed ${erros.modelo ? 'border-red-500' : 'border-gray-400'}`}
            style={{ minHeight: '55px' }}
          />
        </div>

        <div>
          <label className="text-gray-700 text-4xl font-bold mb-3 block">
            PEÇA
          </label>
          {pecasDisponiveis.length > 1 ? (
            <select
              value={peca}
              onChange={(e) => {
                const novaPeca = e.target.value;
                setPeca(novaPeca);
                if (erros.peca) setErros({ ...erros, peca: false });
                // Atualizar código correspondente à peça selecionada
                const pecaSelecionada = pecasDisponiveis.find(p => p.nome === novaPeca);
                if (pecaSelecionada) {
                  const novoCodigo = pecaSelecionada.codigo || '';
                  setCodigo(novoCodigo);
                  if (novoCodigo && erros.codigo) setErros({ ...erros, codigo: false });
                }
              }}
              className={`w-full px-4 py-3 text-4xl border-2 rounded-lg focus:outline-none bg-white appearance-none cursor-pointer ${erros.peca ? 'border-red-500' : 'border-gray-400 focus:border-blue-500'}`}
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
              className={`w-full px-4 py-3 text-4xl border-2 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed ${erros.peca ? 'border-red-500' : 'border-gray-400'}`}
              style={{ minHeight: '55px' }}
            />
          )}
        </div>

        <div>
          <label className="text-gray-700 text-4xl font-bold mb-3 block">
            CÓDIGO
          </label>
          <input
            type="text"
            value={codigo}
            readOnly
            className={`w-full px-4 py-3 text-4xl border-2 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed ${erros.codigo ? 'border-red-500' : 'border-gray-400'}`}
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
            disabled={carregando || (!registroAberto && (!operacao || !produto || !modelo || !peca || !codigo))}
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
