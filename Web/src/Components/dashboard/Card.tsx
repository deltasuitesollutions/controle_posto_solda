import { useState, useEffect } from 'react';
import { registrosAPI } from '../../api/api';

interface CardProps {
    posto: string;
    mod: string;
    peca_nome: string;
    qtd_real: number;
    operador: string;
    habilitado: boolean;
    turno?: string;
    comentario?: string;
    comentario_aviso?: string;
    registro_id?: number;
}


const Card = ({posto, mod, peca_nome, operador, habilitado, turno, comentario: comentarioInicial, comentario_aviso, registro_id}: CardProps) => {
  const [comentario, setComentario] = useState(comentarioInicial || '');
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(false);

  // Atualizar comentário quando o prop mudar (ex: quando funcionário não habilitado)
  useEffect(() => {
    if (comentarioInicial) {
      setComentario(comentarioInicial);
    }
  }, [comentarioInicial]);

  const handleSalvarComentario = async () => {
    if (!registro_id) {
      alert('Erro: ID do registro não encontrado');
      return;
    }

    setSalvando(true);
    try {
      await registrosAPI.atualizarComentario(registro_id, comentario);
      setMensagemSucesso(true);
      setTimeout(() => setMensagemSucesso(false), 3000);
    } catch (error: any) {
      alert(`Erro ao salvar comentário: ${error?.message || 'Erro desconhecido'}`);
    } finally {
      setSalvando(false);
    }
  };

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
            <p className='text-xs text-gray-600 mb-1'>Peça / Modelo</p>
            <p className='text-sm font-semibold text-gray-800'>
              {peca_nome || 'Sem peça'} / {mod || 'Sem modelo'}
            </p>
          </div>
          
          <div className='bg-orange-50 rounded p-2 border border-orange-200'>
            <p className='text-xs text-gray-600 mb-1'>Operador</p>
            <p className='text-sm font-semibold text-gray-800'>{operador || 'Sem operador'}</p>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-2'>
          <div className='bg-orange-50 rounded p-2 border border-orange-200'>
            <p className='text-xs text-gray-600 mb-1'>Turno</p>
            <p className='text-sm font-semibold text-gray-800'>{turno || 'Não definido'}</p>
          </div>
        </div>

        {comentario_aviso && (
          <div className='bg-red-50 border border-red-200 rounded p-2'>
            <p className='text-xs font-semibold text-red-800 mb-1'>⚠️ Aviso</p>
            <p className='text-xs text-red-700'>{comentario_aviso}</p>
          </div>
        )}

        <div className='border-t border-gray-200 pt-2'>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder='Observação...'
            className='w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-xs resize-none'
            rows={2}
            disabled={!registro_id}
          />
          {registro_id && (
            <div className='mt-2 flex items-center justify-between'>
              <button
                onClick={handleSalvarComentario}
                disabled={salvando || comentario === comentarioInicial}
                className='px-3 py-1.5 text-xs font-medium text-white rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                style={{ 
                  backgroundColor: salvando || comentario === comentarioInicial ? '#9CA3AF' : 'var(--bg-azul)'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                {salvando ? (
                  <span className='flex items-center gap-1'>
                    <i className='bi bi-hourglass-split animate-spin'></i>
                    Salvando...
                  </span>
                ) : (
                  <span className='flex items-center gap-1'>
                    <i className='bi bi-check-circle'></i>
                    Enviar
                  </span>
                )}
              </button>
              {mensagemSucesso && (
                <span className='text-xs text-green-600 flex items-center gap-1'>
                  <i className='bi bi-check-circle-fill'></i>
                  Salvo com sucesso!
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Card