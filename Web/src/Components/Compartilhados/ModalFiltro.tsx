import { useState, useEffect } from 'react';

interface OpcaoFiltro {
  id: string;
  label: string;
}

interface ModalFiltroProps {
  titulo: string;
  opcoes: OpcaoFiltro[];
  valoresSelecionados: string[];
  onConfirmar: (valores: string[]) => void;
  onCancelar: () => void;
  onFechar: () => void;
}

const ModalFiltro = ({
  titulo,
  opcoes,
  valoresSelecionados,
  onConfirmar,
  onCancelar,
  onFechar
}: ModalFiltroProps) => {
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState<'az' | 'za'>('az');
  const [selecionados, setSelecionados] = useState<string[]>(valoresSelecionados);

  useEffect(() => {
    setSelecionados(valoresSelecionados);
  }, [valoresSelecionados]);

  const opcoesFiltradas = opcoes
    .filter(opcao => 
      opcao.label.toLowerCase().includes(busca.toLowerCase())
    )
    .sort((a, b) => {
      if (ordenacao === 'az') {
        return a.label.localeCompare(b.label);
      } else {
        return b.label.localeCompare(a.label);
      }
    });

  const toggleSelecao = (id: string) => {
    setSelecionados(prev => 
      prev.includes(id) 
        ? prev.filter(v => v !== id)
        : [...prev, id]
    );
  };

  const selecionarTudo = () => {
    if (selecionados.length === opcoesFiltradas.length) {
      setSelecionados([]);
    } else {
      setSelecionados(opcoesFiltradas.map(o => o.id));
    }
  };

  const handleConfirmar = () => {
    onConfirmar(selecionados);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(156, 163, 175, 0.2)' }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800">Filtrar por {titulo}</h3>
          <button
            onClick={onFechar}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        {/* Ordenação */}
        <div className="px-4 py-2 border-b border-gray-200 flex gap-2">
          <button
            onClick={() => setOrdenacao('az')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              ordenacao === 'az'
                ? 'text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
            style={ordenacao === 'az' ? { backgroundColor: 'var(--bg-laranja)' } : {}}
          >
            ↓ A-Z
          </button>
          <button
            onClick={() => setOrdenacao('za')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              ordenacao === 'za'
                ? 'text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
            style={ordenacao === 'za' ? { backgroundColor: 'var(--bg-laranja)' } : {}}
          >
            ↓ Z-A
          </button>
        </div>

        {/* Busca */}
        <div className="px-4 py-2 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Pesquisar"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full px-3 py-1.5 pr-8 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: 'var(--bg-laranja)' }}
            />
            <i className="bi bi-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>

        {/* Lista de Opções */}
        <div className="px-4 py-3 max-h-48 overflow-y-auto">
          {opcoesFiltradas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum valor disponível</p>
          ) : (
            <div className="space-y-2">
              {opcoesFiltradas.map((opcao) => (
                <label
                  key={opcao.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selecionados.includes(opcao.id)}
                    onChange={() => toggleSelecao(opcao.id)}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    style={{ accentColor: 'var(--bg-laranja)' }}
                  />
                  <span className="text-sm text-gray-700">{opcao.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={selecionarTudo}
            className="text-xs font-medium transition-colors"
            style={{ color: 'var(--bg-laranja)' }}
          >
            (Selecionar Tudo)
          </button>
          <div className="flex gap-2">
            <button
              onClick={onCancelar}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-xs"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              className="px-3 py-1.5 text-white rounded-md hover:opacity-90 transition-opacity text-xs"
              style={{ backgroundColor: 'var(--bg-laranja)' }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalFiltro;

