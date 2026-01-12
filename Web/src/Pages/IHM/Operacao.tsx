import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// import { modelosAPI } from '../../api/api'; // TODO: Descomentar quando backend estiver disponível

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
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState({
    operacao: false,
    produto: false,
    modelo: false,
    peca: false,
    codigo: false,
    quantidade: false,
  });

  const postos = ['P1', 'P2', 'P3', 'P4'];

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
    const carregarModelos = async () => {
      try {
        setCarregando(true);
        // TODO: Descomentar quando backend estiver disponível
        // const dados = await modelosAPI.listarTodos();
        // const modelosMapeados = (dados || []).map((m: any) => ({
        //   id: m.id?.toString() || m.codigo,
        //   codigo: m.codigo,
        //   descricao: m.descricao || m.codigo,
        //   subprodutos: (m.subprodutos || []).map((s: any) => ({
        //     id: s.id?.toString() || s.codigo,
        //     codigo: s.codigo,
        //     descricao: s.descricao || s.codigo,
        //   })),
        // }));
        // setModelos(modelosMapeados);
        
        // Dados mock temporários
        setModelos([]);
      } catch (error) {
        console.error('Erro ao carregar modelos:', error);
        setModelos([]);
      } finally {
        setCarregando(false);
      }
    };
    carregarModelos();
  }, []);

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

  const handleConcluirProducao = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      setCarregando(true);
      
      // TODO: Implementar chamada à API quando backend estiver disponível
      // await producaoAPI.registrarEntrada({
      //   posto: operacao,
      //   produto: produto,
      //   modelo_codigo: modelo,
      // });

      console.log('Dados da produção:', {
        operacao,
        produto,
        modelo,
        peca,
        codigo,
        quantidade,
        operador
      });

      limparFormulario();
      alert('Produção concluída com sucesso!');
    } catch (error) {
      console.error('Erro ao concluir produção:', error);
      alert('Erro ao concluir produção. Tente novamente.');
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
              setOperacao(e.target.value);
              if (erros.operacao) setErros({ ...erros, operacao: false });
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
            {postos.map((posto) => (
              <option key={posto} value={posto}>
                {posto}
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
            {modelos.map((m) => (
              <option key={m.codigo} value={m.codigo}>
                {m.descricao || m.codigo}
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
            onClick={handleConcluirProducao}
            disabled={carregando}
            className="px-12 py-6 text-white text-3xl font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: 'var(--bg-laranja)',
              minHeight: '70px',
              minWidth: '300px'
            }}
            onMouseEnter={(e) => {
              if (!carregando) {
                e.currentTarget.style.backgroundColor = '#C55A15';
              }
            }}
            onMouseLeave={(e) => {
              if (!carregando) {
                e.currentTarget.style.backgroundColor = 'var(--bg-laranja)';
              }
            }}
          >
            Concluir produção
          </button>
        </div>
      </div>
    </div>
  );
};

export default Operacao;
