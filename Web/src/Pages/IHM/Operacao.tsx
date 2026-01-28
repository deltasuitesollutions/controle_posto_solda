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
  
  // Índices para buscas rápidas (O(1) ao invés de O(n))
  const operacoesMapRef = useRef<Map<string, any>>(new Map());
  const modelosMapRef = useRef<Map<string, Modelo>>(new Map());


  useEffect(() => {
    if (!operador) {
      navigate('/ihm/leitor', { replace: true });
    }
  }, [operador, navigate]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        
        // Carregar todos os dados em paralelo para maior velocidade
        const [
          dadosOperacoes,
          dadosOperacoesCompletas,
          dadosModelos,
          dadosFuncionarios
        ] = await Promise.all([
          ihmAPI.listarOperacoes().catch(() => []),
          operacoesAPI.listarTodos().catch(() => []),
          ihmAPI.listarModelos().catch(() => []),
          operador ? funcionariosAPI.listarTodos().catch(() => []) : Promise.resolve([])
        ]);
        
        // Processar operações IHM
        setOperacoes(dadosOperacoes || []);
        
        // Processar operações completas e criar índice
        const operacoesCompletasProcessadas = dadosOperacoesCompletas || [];
        setOperacoesCompletas(operacoesCompletasProcessadas);
        
        // Criar índice de operações para busca rápida
        const operacoesMap = new Map<string, any>();
        const normalizar = (str: string | undefined) => (str || '').trim().toLowerCase();
        
        operacoesCompletasProcessadas.forEach((op: any) => {
          const chaveOperacao = normalizar(op.operacao);
          const chavePosto = normalizar(op.posto);
          const chaveCombinada = `${chaveOperacao}_${chavePosto}`;
          
          // Armazenar por operação + posto (mais específico)
          if (!operacoesMap.has(chaveCombinada)) {
            operacoesMap.set(chaveCombinada, op);
          }
          
          // Também armazenar apenas por operação (fallback)
          if (!operacoesMap.has(chaveOperacao)) {
            operacoesMap.set(chaveOperacao, op);
          }
        });
        operacoesMapRef.current = operacoesMap;
        
        // Processar modelos e criar índice
        const modelosMapeados = (dadosModelos || []).map((m: any) => ({
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
        
        // Criar índice de modelos para busca rápida
        const modelosMap = new Map<string, Modelo>();
        modelosMapeados.forEach((m: Modelo) => {
          const chaveCodigo = normalizar(m.codigo);
          const chaveDescricao = normalizar(m.descricao);
          modelosMap.set(chaveCodigo, m);
          if (chaveDescricao !== chaveCodigo) {
            modelosMap.set(chaveDescricao, m);
          }
        });
        modelosMapRef.current = modelosMap;
        
        // Buscar matrícula do funcionário pelo nome
        if (operador && dadosFuncionarios.length > 0) {
          const funcionarioEncontrado = dadosFuncionarios.find((f: any) => f.nome === operador);
          if (funcionarioEncontrado) {
            setFuncionarioMatricula(funcionarioEncontrado.matricula);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setCarregando(false);
      }
    };
    carregarDados();
  }, [operador]);

  // Função otimizada para preencher campos quando operação é selecionada
  const preencherCamposOperacao = (codigoOperacao: string) => {
    if (!codigoOperacao) {
      setProduto('');
      setModelo('');
      setModeloDescricao('');
      setPeca('');
      setCodigo('');
      setPostoAtual('');
      return;
    }
    
    const normalizar = (str: string | undefined) => (str || '').trim().toLowerCase();
    const chaveOperacao = normalizar(codigoOperacao);
    
    // Buscar operação IHM para obter o posto e nome
    const operacaoIHM = operacoes.find((op) => op.codigo === codigoOperacao);
    const chavePosto = operacaoIHM?.posto ? normalizar(operacaoIHM.posto) : '';
    const chaveCombinada = `${chaveOperacao}_${chavePosto}`;
    
    // Buscar operação completa usando índice (O(1))
    // Primeiro tenta pelo código + posto, depois pelo código, depois pelo nome da operação
    const nomeOperacao = operacaoIHM?.nome ? normalizar(operacaoIHM.nome) : '';
    const chaveCombinadaNome = nomeOperacao ? `${nomeOperacao}_${chavePosto}` : '';
    
    let operacaoEncontrada = operacoesMapRef.current.get(chaveCombinada) || 
                              operacoesMapRef.current.get(chaveOperacao) ||
                              (chaveCombinadaNome ? operacoesMapRef.current.get(chaveCombinadaNome) : null) ||
                              (nomeOperacao ? operacoesMapRef.current.get(nomeOperacao) : null);
    
    if (operacaoEncontrada) {
      // Preencher produto
      setProduto(operacaoEncontrada.produto || '');
      
      // Buscar modelo usando índice (O(1))
      const descricaoModelo = operacaoEncontrada.modelo || '';
      const chaveModelo = normalizar(descricaoModelo);
      const modeloEncontrado = modelosMapRef.current.get(chaveModelo);
      
      if (modeloEncontrado) {
        setModelo(modeloEncontrado.codigo);
        setModeloDescricao(modeloEncontrado.descricao || modeloEncontrado.codigo);
      } else {
        setModelo(descricaoModelo);
        setModeloDescricao(descricaoModelo);
      }
      
      // Preencher peça com o nome da peça (primeira peça se houver)
      const nomePeca = operacaoEncontrada.pecas_nomes?.[0] || '';
      const codigoPeca = operacaoEncontrada.pecas?.[0] || '';
      setPeca(nomePeca);  // Campo PEÇA mostra o nome da peça
      
      // Preencher código: usar o primeiro código da lista de códigos, ou o código da peça como fallback
      // NUNCA usar o nome da operação (operacaoEncontrada.operacao)
      // Verificar se o código não é o nome da operação (caso tenha sido salvo incorretamente)
      const nomeOperacao = operacaoEncontrada.operacao || '';
      const primeiroCodigo = operacaoEncontrada.codigos?.[0] || '';
      
      // Se o código da lista for igual ao nome da operação, usar o código da peça ao invés
      const codigoParaUsar = (primeiroCodigo && primeiroCodigo !== nomeOperacao) 
        ? primeiroCodigo 
        : (codigoPeca || '');
      
      setCodigo(codigoParaUsar);
      
      // Definir posto
      setPostoAtual(operacaoEncontrada.posto || operacaoIHM?.posto || '');
    } else {
      // Se não encontrou operação completa, usar apenas dados do IHM
      setPostoAtual(operacaoIHM?.posto || '');
      setProduto('');
      setModelo('');
      setModeloDescricao('');
      setPeca('');
      setCodigo('');
    }
  };

  // Preencher campos quando os dados forem carregados e já houver uma operação selecionada
  useEffect(() => {
    if (operacao && operacoes.length > 0 && operacoesCompletas.length > 0 && modelos.length > 0) {
      preencherCamposOperacao(operacao);
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
          <label className="block text-gray-700 text-2xl font-bold mb-3">
            OPERAÇÃO
          </label>
          <select
            value={operacao}
            onChange={(e) => {
              const codigoOperacao = e.target.value;
              setOperacao(codigoOperacao);
              if (erros.operacao) setErros({ ...erros, operacao: false });
              
              // Preencher campos imediatamente usando função otimizada
              // Se os dados ainda não foram carregados, o useEffect vai preencher depois
              if (operacoes.length > 0 && operacoesCompletas.length > 0 && modelos.length > 0) {
                preencherCamposOperacao(codigoOperacao);
              }
            }}
            className={`w-full px-5 py-4 text-base border-4 rounded-lg focus:outline-none bg-white appearance-none cursor-pointer ${erros.operacao ? 'border-red-500' : 'border-gray-400 focus:border-blue-500'}`}
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
          <label className="text-gray-700 text-xl font-bold mb-3 block">
            PRODUTO
          </label>
          <input
            type="text"
            value={produto}
            readOnly
            className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed ${erros.produto ? 'border-red-500' : 'border-gray-400'}`}
            style={{ minHeight: '55px' }}
          />
        </div>

        <div>
          <label className="text-gray-700 text-xl font-bold mb-3 block">
            MODELO
          </label>
          <input
            type="text"
            value={modeloDescricao}
            readOnly
            className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed ${erros.modelo ? 'border-red-500' : 'border-gray-400'}`}
            style={{ minHeight: '55px' }}
          />
        </div>

        <div>
          <label className="text-gray-700 text-xl font-bold mb-3 block">
            PEÇA
          </label>
          <input
            type="text"
            value={peca}
            readOnly
            className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed ${erros.peca ? 'border-red-500' : 'border-gray-400'}`}
            style={{ minHeight: '55px' }}
          />
        </div>

        <div>
          <label className="text-gray-700 text-xl font-bold mb-3 block">
            CÓDIGO
          </label>
          <input
            type="text"
            value={codigo}
            readOnly
            className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed ${erros.codigo ? 'border-red-500' : 'border-gray-400'}`}
            style={{ minHeight: '55px' }}
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
              className="w-full px-4 py-3 text-base border-2 border-gray-400 rounded-lg bg-gray-100 cursor-not-allowed"
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
