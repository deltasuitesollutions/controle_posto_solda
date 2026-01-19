import { useState, useEffect } from 'react';

interface CardProps {
    posto: string;
    mod: string;
    pecas: string;
    operador: string;
    habilitado: boolean;
    turno?: string;
    comentario?: string;
}


const Card = ({posto, mod, pecas, operador, habilitado, turno, comentario: comentarioInicial}: CardProps) => {
  const [comentario, setComentario] = useState(comentarioInicial || '');

  // Atualizar comentário quando o prop mudar (ex: quando funcionário não habilitado)
  useEffect(() => {
    if (comentarioInicial) {
      setComentario(comentarioInicial);
    }
  }, [comentarioInicial]);

  return (
    <div className='bg-white rounded-lg shadow border border-gray-200'>
      <div className='p-3' style={{ backgroundColor: 'var(--bg-azul)' }}>
        <div className='flex items-center justify-between'>
          <h3 className='text-white font-bold text-sm'>{posto}</h3>
          <div className='flex items-center gap-2'>
            <div 
              className='w-2 h-2 rounded-full'
              style={{ backgroundColor: habilitado ? 'var(--bg-laranja)' : '#EF4444' }}
            ></div>
            <span className='text-white text-xs'>
              {habilitado ? 'Habilitado' : 'Desabilitado'}
            </span>
          </div>
        </div>
      </div>

      <div className='p-3 space-y-2'>
        <div className='grid grid-cols-2 gap-2'>
          <div className='bg-blue-50 rounded p-2 border border-blue-200'>
            <p className='text-xs text-gray-600 mb-1'>Modelo</p>
            <p className='text-sm font-semibold text-gray-800'>{mod}</p>
          </div>
          
          <div className='bg-orange-50 rounded p-2 border border-orange-200'>
            <p className='text-xs text-gray-600 mb-1'>Operador</p>
            <p className='text-sm font-semibold text-gray-800'>{operador || 'Sem operador'}</p>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <div className='bg-blue-50 rounded p-2 border border-blue-200'>
            <p className='text-xs text-gray-600 mb-1'>Peças</p>
            <p className='text-sm font-bold text-gray-800'>{pecas}</p>
          </div>
          
          <div className='bg-orange-50 rounded p-2 border border-orange-200'>
            <p className='text-xs text-gray-600 mb-1'>Turno</p>
            <p className='text-sm font-semibold text-gray-800'>{turno || 'Não definido'}</p>
          </div>
        </div>

        {!habilitado && comentarioInicial && (
          <div className='bg-red-50 border border-red-200 rounded p-2'>
            <p className='text-xs font-semibold text-red-800 mb-1'>⚠️ Aviso</p>
            <p className='text-xs text-red-700'>{comentarioInicial}</p>
          </div>
        )}

        <div className='border-t border-gray-200 pt-2'>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder='Observação...'
            className='w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-xs resize-none'
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}

export default Card