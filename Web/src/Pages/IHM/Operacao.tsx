import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ihmAPI, producaoAPI, funcionariosAPI, operacoesAPI } from '../../api/api';

interface Modelo {
  id: string;
  codigo: string;
  descricao: string;
  subprodutos?: Subproduto[];
}

interface Subproduto {
  id: string;
  codigo: string;
  descricao: string;
}

const Operacao = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const operador = (location.state as { operador?: string })?.operador || '';

  const [operacao, setOperacao] = useState('');
  const [produto, setProduto] = useState('');
  const [modelo, setModelo] = useState('');
  const [peca, setPeca] = useState('');
  const [codigo, setCodigo] = useState('');
  const [quantidade, setQuantidade] = useState<number | ''>('');
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [subprodutos, setSubprodutos] = useState<Subproduto[]>([]);
  const [operacoes, setOperacoes] = useState<Array<{codigo: string; nome: string; posto?: string}>>([]);
  const [operacoesCompletas, setOperacoesCompletas] = useState<Array<any>>([]);
  const [produtos, setProdutos] = useState<Array<{id: string; codigo: string; nome: string}>>([]);
  const [carregando, setCarregando] = useState(false);
  const [registroAberto, setRegistroAberto] = useState<any>(null);
  const [funcionarioMatricula, setFuncionarioMatricula] = useState<string>('');
  const [postoAtual, setPostoAtual] = useState<string>('');
  const [erros, setErros] = useState({
    operacao: false,
    produto: false,
    modelo: false,
    peca: false,
    codigo: false,
    quantidade: false,
  });

  const arrowIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E";
  const selectStyle = {
    backgroundImage: `url("${arrowIcon}")`,
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'right 1.5rem center',
    paddingRight: '3.5rem',
    minHeight: '70px',
  };

  useEffect(() => {
    if (!operador) {
      navigate('/ihm/leitor', { replace: true });
    }
  }, [operador, navigate]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        
        // Carregar operações cadastradas (formato IHM)
        try {
          const dadosOperacoes = await ihmAPI.listarOperacoes();
          setOperacoes(dadosOperacoes || []);
        } catch (error) {
          console.error('Erro ao carregar operações:', error);
          setOperacoes([]);
        }
        
        // Carregar operações completas (com posto)
        try {
          const dadosOperacoesCompletas = await operacoesAPI.listarTodos();
          setOperacoesCompletas(dadosOperacoesCompletas || []);
        } catch (error) {
          console.error('Erro ao carregar operações completas:', error);
          setOperacoesCompletas([]);
        }
        
        // Carregar produtos
        try {
          const dadosProdutos = await ihmAPI.listarProdutos();
          setProdutos(dadosProdutos || []);
        } catch (error) {
          console.error('Erro ao carregar produtos:', error);
          setProdutos([]);
        }
        
        // Carregar modelos
        try {
          const dados = await ihmAPI.listarModelos();
          const modelosMapeados = (dados || []).map((m: any) => ({
            id: m.id?.toString() || m.codigo,
            codigo: m.codigo,
            descricao: m.descricao || m.codigo,
            subprodutos: (m.subprodutos || []).map((s: any) => ({
              id: s.id?.toString() || s.codigo,
              codigo: s.codigo,
              descricao: s.descricao || s.codigo,
            })),
          }));
          setModelos(modelosMapeados);
        } catch (error) {
          console.error('Erro ao carregar modelos:', error);
          setModelos([]);
        }
        
        // Buscar matrícula do funcionário pelo nome
        if (operador) {
          try {
            const funcionarios = await funcionariosAPI.listarTodos();
            const funcionarioEncontrado = funcionarios.find((f: any) => f.nome === operador);
            if (funcionarioEncontrado) {
              setFuncionarioMatricula(funcionarioEncontrado.matricula);
            }
          } catch (error) {
            console.error('Erro ao buscar funcionário:', error);
          }
        }
      } finally {
        setCarregando(false);
      }
    };
    carregarDados();
  }, [operador]);

  useEffect(() => {
    if (modelo) {
      const modeloSelecionado = modelos.find(m => m.codigo === modelo);
      setSubprodutos(modeloSelecionado?.subprodutos || []);
    } else {
      setSubprodutos([]);
    }
  }, [modelo, modelos]);

  useEffect(() => {
    if (peca) {
      const pecaSelecionada = subprodutos.find(p => p.codigo === peca);
      setCodigo(pecaSelecionada?.codigo || '');
    } else {
      setCodigo('');
    }
  }, [peca, subprodutos]);

  // Verificar registro aberto quando operação e matrícula estiverem disponíveis
  useEffect(() => {
    const verificarRegistroAberto = async () => {
      if (operacao && funcionarioMatricula && postoAtual) {
        try {
          const response = await producaoAPI.buscarRegistroAberto(postoAtual, funcionarioMatricula);
          if (response.registro) {
            setRegistroAberto(response.registro);
          } else {
            setRegistroAberto(null);
          }
        } catch (error) {
          // Se não encontrar registro, não é erro
          setRegistroAberto(null);
        }
      } else {
        setRegistroAberto(null);
      }
    };
    verificarRegistroAberto();
  }, [operacao, funcionarioMatricula, postoAtual]);

  const limparFormulario = () => {
    setOperacao('');
    setProduto('');
    setModelo('');
    setPeca('');
    setCodigo('');
    setQuantidade('');
    setErros({
      operacao: false,
      produto: false,
      modelo: false,
      peca: false,
      codigo: false,
      quantidade: false,
    });
  };

  const validarFormulario = (): boolean => {
    const novosErros = {
      operacao: !operacao,
      produto: !produto,
      modelo: !modelo,
      peca: !peca,
      codigo: !codigo,
      quantidade: !quantidade || quantidade <= 0,
    };

    setErros(novosErros);
    return !Object.values(novosErros).some(erro => erro);
  };

  const handleIniciarTrabalho = async () => {
    if (!operacao || !modelo) {
      alert('Selecione a operação e o modelo antes de iniciar o trabalho.');
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
      
      const produtoCodigo = produto || modelo;
      await producaoAPI.registrarEntrada({
        posto: postoAtual,
        funcionario_matricula: funcionarioMatricula,
        modelo_codigo: produtoCodigo
      });

      // Atualizar registro aberto
      const response = await producaoAPI.buscarRegistroAberto(postoAtual, funcionarioMatricula);
      if (response.registro) {
        setRegistroAberto(response.registro);
      }
      
      alert('Trabalho iniciado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao iniciar trabalho:', error);
      const mensagem = error.message || 'Erro ao iniciar trabalho. Tente novamente.';
      alert(mensagem);
    } finally {
      setCarregando(false);
    }
  };

  const handleConcluirTrabalho = async () => {
    if (!registroAberto) {
      alert('Não há registro aberto para concluir.');
      return;
    }

    if (!postoAtual || !funcionarioMatricula) {
      alert('Dados insuficientes para concluir o trabalho.');
      return;
    }

    try {
      setCarregando(true);
      
      await producaoAPI.registrarSaida({
        posto: postoAtual,
        funcionario_matricula: funcionarioMatricula
      });

      setRegistroAberto(null);
      limparFormulario();
      alert('Trabalho concluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao concluir trabalho:', error);
      const mensagem = error.message || 'Erro ao concluir trabalho. Tente novamente.';
      alert(mensagem);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col p-6">
      <div className="flex justify-between items-start mb-8 gap-6">
        <div className="flex-1">
          <label className="block text-gray-700 text-2xl font-bold mb-3">
            OPERAÇÃO
          </label>
          <select
            value={operacao}
            onChange={(e) => {
              const codigoOperacao = e.target.value;
              setOperacao(codigoOperacao);
              if (erros.operacao) setErros({ ...erros, operacao: false });
              
              // Buscar posto da operação selecionada
              if (codigoOperacao) {
                // Primeiro, tentar buscar da lista de operações IHM (que agora inclui posto)
                const operacaoIHM = operacoes.find((op) => op.codigo === codigoOperacao);
                if (operacaoIHM && operacaoIHM.posto) {
                  setPostoAtual(operacaoIHM.posto);
                  return;
                }
                
                // Se não encontrou na lista IHM, tentar na lista completa
                let operacaoEncontrada = operacoesCompletas.find((op: any) => op.operacao === codigoOperacao);
                
                // Se não encontrou, tentar pelo campo 'codigo' (caso a estrutura seja diferente)
                if (!operacaoEncontrada) {
                  operacaoEncontrada = operacoesCompletas.find((op: any) => op.codigo === codigoOperacao);
                }
                
                if (operacaoEncontrada && operacaoEncontrada.posto) {
                  setPostoAtual(operacaoEncontrada.posto);
                } else {
                  setPostoAtual('');
                }
              } else {
                setPostoAtual('');
              }
            }}
            className={`w-full px-5 py-4 text-xl border-4 rounded-lg focus:outline-none bg-white appearance-none cursor-pointer ${erros.operacao ? 'border-red-500' : 'border-gray-400 focus:border-blue-500'}`}
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

        <div className="flex items-center gap-6">
          <div>
            <label className="block text-gray-700 text-2xl font-bold">
              Quantidade
            </label>
            <label className="block text-gray-700 text-2xl font-bold">
              produzidas
            </label>
          </div>
          <input
            type="number"
            value={quantidade}
            onChange={(e) => {
              const val = e.target.value;
              setQuantidade(val === '' ? '' : parseInt(val, 10));
              if (erros.quantidade) setErros({ ...erros, quantidade: false });
            }}
            min="1"
            className={`w-36 px-5 py-4 text-xl border-4 rounded-lg focus:outline-none bg-white text-center ${erros.quantidade ? 'border-red-500' : 'border-gray-400 focus:border-blue-500'}`}
            placeholder="INT"
            style={{ minHeight: '60px' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div>
          <label className="text-gray-700 text-2xl font-bold mb-4 block">
            PRODUTO
          </label>
          <select
            value={produto}
            onChange={(e) => {
              setProduto(e.target.value);
              if (erros.produto) setErros({ ...erros, produto: false });
            }}
            className={`w-full px-6 py-5 text-2xl border-4 rounded-lg focus:outline-none bg-white appearance-none cursor-pointer ${erros.produto ? 'border-red-500' : 'border-gray-400 focus:border-blue-500'}`}
            style={selectStyle}
          >
            <option value="">Selecione</option>
            {produtos.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nome || p.codigo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-gray-700 text-2xl font-bold mb-4 block">
            MODELO
          </label>
          <select
            value={modelo}
            onChange={(e) => {
              setModelo(e.target.value);
              if (erros.modelo) setErros({ ...erros, modelo: false });
            }}
            className={`w-full px-6 py-5 text-2xl border-4 rounded-lg focus:outline-none bg-white appearance-none cursor-pointer ${erros.modelo ? 'border-red-500' : 'border-gray-400 focus:border-blue-500'}`}
            style={selectStyle}
          >
            <option value="">Selecione</option>
            {modelos.map((m) => (
              <option key={m.codigo} value={m.codigo}>
                {m.descricao || m.codigo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-gray-700 text-2xl font-bold mb-4 block">
            PEÇA
          </label>
          <select
            value={peca}
            onChange={(e) => {
              setPeca(e.target.value);
              if (erros.peca) setErros({ ...erros, peca: false });
            }}
            disabled={!modelo}
            className={`w-full px-6 py-5 text-2xl border-4 rounded-lg focus:outline-none bg-white appearance-none cursor-pointer disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-500 ${erros.peca ? 'border-red-500' : 'border-gray-400 focus:border-blue-500'}`}
            style={selectStyle}
          >
            <option value="">Selecione</option>
            {subprodutos.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.descricao || p.codigo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-gray-700 text-2xl font-bold mb-4 block">
            CÓDIGO
          </label>
          <select
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value);
              if (erros.codigo) setErros({ ...erros, codigo: false });
            }}
            disabled={!peca}
            className={`w-full px-6 py-5 text-2xl border-4 rounded-lg focus:outline-none bg-white appearance-none cursor-pointer disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-500 ${erros.codigo ? 'border-red-500' : 'border-gray-400 focus:border-blue-500'}`}
            style={selectStyle}
          >
            <option value="">Selecione</option>
            {subprodutos.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.codigo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex items-end gap-6 mb-6">
          <div className="flex-1">
            <label className="text-gray-700 text-xl font-bold mb-3 block">
              OPERADOR:
            </label>
            <input
              type="text"
              value={operador}
              readOnly
              className="w-full px-4 py-3 text-lg border-2 border-gray-400 rounded-lg bg-gray-100 cursor-not-allowed"
              style={{ minHeight: '50px' }}
            />
          </div>

          <button
            onClick={registroAberto ? handleConcluirTrabalho : handleIniciarTrabalho}
            disabled={carregando || !operacao || !modelo}
            className="px-12 py-6 text-white text-3xl font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: registroAberto ? '#28a745' : 'var(--bg-laranja)',
              minHeight: '70px',
              minWidth: '300px'
            }}
            onMouseEnter={(e) => {
              if (!carregando) {
                e.currentTarget.style.backgroundColor = registroAberto ? '#218838' : '#C55A15';
              }
            }}
            onMouseLeave={(e) => {
              if (!carregando) {
                e.currentTarget.style.backgroundColor = registroAberto ? '#28a745' : 'var(--bg-laranja)';
              }
            }}
          >
            {registroAberto ? 'Concluir trabalho' : 'Iniciar trabalho'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Operacao;
