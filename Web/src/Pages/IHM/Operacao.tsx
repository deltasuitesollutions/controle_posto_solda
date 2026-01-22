import { useState, useEffect, useRef } from 'react';
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
  const [modelo, setModelo] = useState(''); // Código do modelo para envio
  const [modeloDescricao, setModeloDescricao] = useState(''); // Descrição do modelo para exibição
  const [peca, setPeca] = useState('');
  const [codigo, setCodigo] = useState('');
  const [modelos, setModelos] = useState<Modelo[]>([]);
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
  });
  const tinhaRegistroRef = useRef(false);

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

  // Preencher campos quando os dados forem carregados e já houver uma operação selecionada
  useEffect(() => {
    if (operacao && operacoes.length > 0 && operacoesCompletas.length > 0 && modelos.length > 0) {
      // Buscar dados completos da operação
      const operacaoIHM = operacoes.find((op) => op.codigo === operacao);
      
      let operacaoEncontrada: any = null;
      
      // Normalizar strings para comparação (remover espaços e converter para minúsculas)
      const normalizar = (str: string | undefined) => (str || '').trim().toLowerCase();
      
      if (operacaoIHM && operacaoIHM.posto) {
        // Se temos o posto, buscar pela combinação de operação e posto (mais preciso)
        operacaoEncontrada = operacoesCompletas.find((op: any) => {
          // Comparar operação (pode ser código ou nome)
          const matchOperacao = normalizar(op.operacao) === normalizar(operacao);
          // Comparar posto
          const matchPosto = normalizar(op.posto) === normalizar(operacaoIHM.posto);
          return matchOperacao && matchPosto;
        });
      }
      
      // Se ainda não encontrou, tentar apenas pelo campo operacao (sem posto)
      if (!operacaoEncontrada) {
        operacaoEncontrada = operacoesCompletas.find((op: any) => {
          return normalizar(op.operacao) === normalizar(operacao);
        });
      }
      
      // Se ainda não encontrou e temos posto, tentar buscar apenas pelo posto
      if (!operacaoEncontrada && operacaoIHM && operacaoIHM.posto) {
        // Última tentativa: buscar pelo posto (pode haver apenas uma operação por posto)
        const operacoesComPosto = operacoesCompletas.filter((op: any) => 
          normalizar(op.posto) === normalizar(operacaoIHM.posto)
        );
        if (operacoesComPosto.length === 1) {
          operacaoEncontrada = operacoesComPosto[0];
        } else if (operacoesComPosto.length > 1) {
          // Se houver múltiplas operações no mesmo posto, tentar encontrar pela operação
          operacaoEncontrada = operacoesComPosto.find((op: any) => 
            normalizar(op.operacao) === normalizar(operacao)
          ) || operacoesComPosto[0]; // Se não encontrar, usar a primeira
        }
      }
      
      if (operacaoEncontrada) {
        // Preencher produto
        const produtoEncontrado = operacaoEncontrada.produto || '';
        setProduto(produtoEncontrado);
        
        // Buscar código do modelo pela descrição ou nome
        const descricaoModelo = operacaoEncontrada.modelo || '';
        
        // Tentar encontrar modelo por descrição ou código
        const modeloEncontrado = modelos.find(m => 
          normalizar(m.descricao) === normalizar(descricaoModelo) || 
          normalizar(m.codigo) === normalizar(descricaoModelo)
        );
        
        if (modeloEncontrado) {
          setModelo(modeloEncontrado.codigo); // Código para envio
          setModeloDescricao(modeloEncontrado.descricao || modeloEncontrado.codigo); // Descrição para exibição
        } else {
          // Se não encontrou, usar a descrição diretamente
          setModelo(descricaoModelo);
          setModeloDescricao(descricaoModelo);
        }
        
        // Preencher peça (pegar a primeira peça se houver)
        if (operacaoEncontrada.pecas && operacaoEncontrada.pecas.length > 0) {
          const primeiraPeca = operacaoEncontrada.pecas[0];
          setPeca(primeiraPeca);
        } else {
          setPeca('');
        }
        
        // Preencher código (pegar o primeiro código se houver)
        if (operacaoEncontrada.codigos && operacaoEncontrada.codigos.length > 0) {
          const primeiroCodigo = operacaoEncontrada.codigos[0];
          setCodigo(primeiroCodigo);
        } else {
          setCodigo('');
        }
        
        // Definir posto
        if (operacaoEncontrada.posto) {
          setPostoAtual(operacaoEncontrada.posto);
        } else if (operacaoIHM && operacaoIHM.posto) {
          setPostoAtual(operacaoIHM.posto);
        } else {
          setPostoAtual('');
        }
      } else {
        // Se não encontrou na lista completa, tentar apenas buscar posto da lista IHM
        if (operacaoIHM && operacaoIHM.posto) {
          setPostoAtual(operacaoIHM.posto);
        } else {
          setPostoAtual('');
        }
        // Limpar campos se não encontrou operação completa
        setProduto('');
        setModelo('');
        setModeloDescricao('');
        setPeca('');
        setCodigo('');
      }
    }
  }, [operacao, operacoes, operacoesCompletas, modelos]);

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

  const limparFormulario = () => {
    setOperacao('');
    setProduto('');
    setModelo('');
    setModeloDescricao('');
    setPeca('');
    setCodigo('');
    setErros({
      operacao: false,
      produto: false,
      modelo: false,
      peca: false,
      codigo: false,
    });
  };

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
      // Limpar estado em caso de erro
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
          <label className="block text-gray-700 text-2xl font-bold mb-3">
            OPERAÇÃO
          </label>
          <select
            value={operacao}
            onChange={(e) => {
              const codigoOperacao = e.target.value;
              setOperacao(codigoOperacao);
              if (erros.operacao) setErros({ ...erros, operacao: false });
              
              // Limpar campos quando não há operação selecionada
              if (!codigoOperacao) {
                setProduto('');
                setModelo('');
                setModeloDescricao('');
                setPeca('');
                setCodigo('');
                setPostoAtual('');
                return;
              }
              
              // Se os dados ainda não foram carregados, apenas atualizar o estado da operação
              // O useEffect vai preencher os campos quando os dados estiverem prontos
              if (operacoes.length === 0 || operacoesCompletas.length === 0 || modelos.length === 0) {
                return;
              }
              
              // Se os dados estão carregados, preencher os campos imediatamente
              // Buscar dados completos da operação
              const operacaoIHM = operacoes.find((op) => op.codigo === codigoOperacao);
              
              let operacaoEncontrada: any = null;
              
              // Normalizar strings para comparação (remover espaços e converter para minúsculas)
              const normalizar = (str: string | undefined) => (str || '').trim().toLowerCase();
              
              if (operacaoIHM && operacaoIHM.posto) {
                // Se temos o posto, buscar pela combinação de operação e posto (mais preciso)
                operacaoEncontrada = operacoesCompletas.find((op: any) => {
                  // Comparar operação (pode ser código ou nome)
                  const matchOperacao = normalizar(op.operacao) === normalizar(codigoOperacao);
                  // Comparar posto
                  const matchPosto = normalizar(op.posto) === normalizar(operacaoIHM.posto);
                  return matchOperacao && matchPosto;
                });
              }
              
              // Se ainda não encontrou, tentar apenas pelo campo operacao (sem posto)
              if (!operacaoEncontrada) {
                operacaoEncontrada = operacoesCompletas.find((op: any) => {
                  return normalizar(op.operacao) === normalizar(codigoOperacao);
                });
              }
              
              // Se ainda não encontrou e temos posto, tentar buscar apenas pelo posto
              if (!operacaoEncontrada && operacaoIHM && operacaoIHM.posto) {
                // Última tentativa: buscar pelo posto (pode haver apenas uma operação por posto)
                const operacoesComPosto = operacoesCompletas.filter((op: any) => 
                  normalizar(op.posto) === normalizar(operacaoIHM.posto)
                );
                if (operacoesComPosto.length === 1) {
                  operacaoEncontrada = operacoesComPosto[0];
                } else if (operacoesComPosto.length > 1) {
                  // Se houver múltiplas operações no mesmo posto, tentar encontrar pela operação
                  operacaoEncontrada = operacoesComPosto.find((op: any) => 
                    normalizar(op.operacao) === normalizar(codigoOperacao)
                  ) || operacoesComPosto[0]; // Se não encontrar, usar a primeira
                }
              }
              
              if (operacaoEncontrada) {
                // Preencher produto
                const produtoEncontrado = operacaoEncontrada.produto || '';
                setProduto(produtoEncontrado);
                
                // Buscar código do modelo pela descrição ou nome
                const descricaoModelo = operacaoEncontrada.modelo || '';
                
                // Tentar encontrar modelo por descrição ou código
                const modeloEncontrado = modelos.find(m => 
                  normalizar(m.descricao) === normalizar(descricaoModelo) || 
                  normalizar(m.codigo) === normalizar(descricaoModelo)
                );
                
                if (modeloEncontrado) {
                  setModelo(modeloEncontrado.codigo); // Código para envio
                  setModeloDescricao(modeloEncontrado.descricao || modeloEncontrado.codigo); // Descrição para exibição
                } else {
                  // Se não encontrou, usar a descrição diretamente
                  setModelo(descricaoModelo);
                  setModeloDescricao(descricaoModelo);
                }
                
                // Preencher peça (pegar a primeira peça se houver)
                if (operacaoEncontrada.pecas && operacaoEncontrada.pecas.length > 0) {
                  const primeiraPeca = operacaoEncontrada.pecas[0];
                  setPeca(primeiraPeca);
                } else {
                  setPeca('');
                }
                
                // Preencher código (pegar o primeiro código se houver)
                if (operacaoEncontrada.codigos && operacaoEncontrada.codigos.length > 0) {
                  const primeiroCodigo = operacaoEncontrada.codigos[0];
                  setCodigo(primeiroCodigo);
                } else {
                  setCodigo('');
                }
                
                // Definir posto
                if (operacaoEncontrada.posto) {
                  setPostoAtual(operacaoEncontrada.posto);
                } else if (operacaoIHM && operacaoIHM.posto) {
                  setPostoAtual(operacaoIHM.posto);
                } else {
                  setPostoAtual('');
                }
              } else {
                // Se não encontrou na lista completa, tentar apenas buscar posto da lista IHM
                if (operacaoIHM && operacaoIHM.posto) {
                  setPostoAtual(operacaoIHM.posto);
                } else {
                  setPostoAtual('');
                }
                // Limpar campos se não encontrou operação completa
                setProduto('');
                setModelo('');
                setModeloDescricao('');
                setPeca('');
                setCodigo('');
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

      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div>
          <label className="text-gray-700 text-2xl font-bold mb-4 block">
            PRODUTO
          </label>
          <input
            type="text"
            value={produto}
            readOnly
            className={`w-full px-6 py-5 text-2xl border-4 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed ${erros.produto ? 'border-red-500' : 'border-gray-400'}`}
            style={{ minHeight: '70px' }}
          />
        </div>

        <div>
          <label className="text-gray-700 text-2xl font-bold mb-4 block">
            MODELO
          </label>
          <input
            type="text"
            value={modeloDescricao}
            readOnly
            className={`w-full px-6 py-5 text-2xl border-4 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed ${erros.modelo ? 'border-red-500' : 'border-gray-400'}`}
            style={{ minHeight: '70px' }}
          />
        </div>

        <div>
          <label className="text-gray-700 text-2xl font-bold mb-4 block">
            PEÇA
          </label>
          <input
            type="text"
            value={peca}
            readOnly
            className={`w-full px-6 py-5 text-2xl border-4 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed ${erros.peca ? 'border-red-500' : 'border-gray-400'}`}
            style={{ minHeight: '70px' }}
          />
        </div>

        <div>
          <label className="text-gray-700 text-2xl font-bold mb-4 block">
            CÓDIGO
          </label>
          <input
            type="text"
            value={codigo}
            readOnly
            className={`w-full px-6 py-5 text-2xl border-4 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed ${erros.codigo ? 'border-red-500' : 'border-gray-400'}`}
            style={{ minHeight: '70px' }}
          />
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
            onClick={registroAberto ? handleFinalizarProcesso : handleIniciarTrabalho}
            disabled={carregando || (!registroAberto && (!operacao || !produto || !modelo || !peca || !codigo))}
            className="px-12 py-6 text-white text-3xl font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
