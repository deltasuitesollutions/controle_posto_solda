import React from 'react';

interface PaginaProps {
  totalItens: number;
  itensPorPagina: number;
  paginaAtual: number;
  onPageChange: (pagina: number) => void;
}

const gerarPaginas = (totalPaginas: number, paginaAtual: number): (number | string)[] => {
  const paginas: (number | string)[] = [];
  const maxBotoes = 7;

  if (totalPaginas <= maxBotoes) {
    // Se há poucas páginas, mostra todas
    for (let i = 1; i <= totalPaginas; i++) {
      paginas.push(i);
    }
  } else {
    // Sempre mostra a primeira página
    paginas.push(1);

    if (paginaAtual <= 3) {
      // Páginas iniciais
      for (let i = 2; i <= 4; i++) {
        paginas.push(i);
      }
      paginas.push('...');
      paginas.push(totalPaginas);
    } else if (paginaAtual >= totalPaginas - 2) {
      // Páginas finais
      paginas.push('...');
      for (let i = totalPaginas - 3; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      // Páginas do meio
      paginas.push('...');
      for (let i = paginaAtual - 1; i <= paginaAtual + 1; i++) {
        paginas.push(i);
      }
      paginas.push('...');
      paginas.push(totalPaginas);
    }
  }

  return paginas;
};

export const Paginacao: React.FC<PaginaProps> = ({
  totalItens,
  itensPorPagina,
  paginaAtual,
  onPageChange,
}) => {
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);

  // Não renderiza nada se houver apenas uma página
  if (totalPaginas <= 1) return null;

  const paginas = gerarPaginas(totalPaginas, paginaAtual);

  return (
    <nav className="flex items-center justify-center gap-2 mt-6">
      {/* Botão Anterior */}
      <button
        onClick={() => onPageChange(paginaAtual - 1)}
        disabled={paginaAtual === 1}
        className="px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Anterior
      </button>

      {/* Números das Páginas */}
      <div className="flex gap-1">
        {paginas.map((pagina, index) => (
          <button
            key={index}
            onClick={() => typeof pagina === 'number' && onPageChange(pagina)}
            disabled={pagina === '...'}
            className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors
              ${pagina === '...' ? 'border-transparent cursor-default' : ''}
              ${pagina !== '...' && pagina !== paginaAtual ? 'bg-white text-gray-700 hover:bg-gray-50' : ''}
            `}
            style={pagina === paginaAtual ? { 
              backgroundColor: 'var(--bg-azul)', 
              color: 'white', 
              borderColor: 'var(--bg-azul)' 
            } : undefined}
          >
            {pagina}
          </button>
        ))}
      </div>

      {/* Botão Próximo */}
      <button
        onClick={() => onPageChange(paginaAtual + 1)}
        disabled={paginaAtual === totalPaginas}
        className="px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Próximo
      </button>
    </nav>
  );
};