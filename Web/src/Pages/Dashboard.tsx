import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Card from '../Components/dashboard/Card';
import MenuLateral from '../Components/MenuLateral/MenuLateral';
import TopBar from '../Components/topBar/TopBar';
import { dashboardAPI } from '../api/api';

interface CardProps {
  posto_id: number;
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

interface Sublinha {
  sublinha_id: number;
  nome: string;
  postos: CardProps[];
}

const MetricCard = ({ titulo, valor, icone, cor }: { titulo: string; valor: string | number; icone: string; cor: string }) => {
  return (
    <div className="rounded-lg p-3 shadow" style={{ backgroundColor: cor }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-xs mb-1">{titulo}</p>
          <p className="text-white text-xl font-bold">{valor}</p>
        </div>
        <i className={`${icone} text-white text-lg`}></i>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const processos = [
    { id: 'sub_linha_chassi', nome: 'SUB LINHA CHASSI' },
  ];

  const [processoSelecionado, setProcessoSelecionado] = useState('sub_linha_chassi');
  const [selectAberto, setSelectAberto] = useState(false);
  const [sublinhas, setSublinhas] = useState<Sublinha[]>([]);
  const [metricas, setMetricas] = useState({
    postosAtivos: 0,
    totalPostos: 0,
    producaoHoje: 0,
    operadoresAtivos: 0
  });
  const [carregando, setCarregando] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  // Carregar dados iniciais e configurar WebSocket
  useEffect(() => {
    // Carregar dados iniciais
    carregarDadosDashboard();

    // Configurar WebSocket - usar a mesma origem do frontend para que o proxy funcione
    // Em produção (nginx), conecta via proxy na mesma porta do frontend
    // Em desenvolvimento, conecta diretamente ao backend na porta 8000
    let socketUrl: string;
    
    if (import.meta.env.VITE_API_URL) {
      // Se VITE_API_URL está definido, usar sem /api
      socketUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    } else if (import.meta.env.DEV) {
      // Em desenvolvimento, conectar diretamente ao backend
      socketUrl = `http://${window.location.hostname}:8000`;
    } else {
      // Em produção (via nginx), usar a mesma origem - nginx fará o proxy
      socketUrl = window.location.origin;
    }
    
    console.log('[Dashboard] Conectando ao Socket.IO:', socketUrl);
    
    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['polling', 'websocket'], // Polling primeiro, depois upgrade para websocket
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
    });

    socketRef.current = socket;

    // Eventos de conexão para debug
    socket.on('connect', () => {
      console.log('[Dashboard] Socket.IO conectado:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.warn('[Dashboard] Erro de conexão Socket.IO:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Dashboard] Socket.IO desconectado:', reason);
    });

    // Receber atualizações do dashboard
    socket.on('dashboard_update', (dados: any) => {
      console.log('[Dashboard] Atualização recebida via Socket.IO', dados);
      try {
        if (dados && typeof dados === 'object') {
          if (dados.metricas) {
            console.log('[Dashboard] Atualizando métricas:', dados.metricas);
            setMetricas(dados.metricas);
          }
          if (dados.sublinhas && Array.isArray(dados.sublinhas)) {
            console.log('[Dashboard] Atualizando sublinhas:', dados.sublinhas.length);
            setSublinhas(dados.sublinhas);
          }
        }
      } catch (error) {
        console.error('[Dashboard] Erro ao processar atualização:', error);
      }
      setCarregando(false);
    });

    // Polling como fallback a cada 30 segundos
    const pollingInterval = setInterval(() => {
      console.log('[Dashboard] Polling de dados...');
      carregarDadosDashboard();
    }, 30000);

    return () => {
      console.log('[Dashboard] Desconectando Socket.IO');
      socket.disconnect();
      clearInterval(pollingInterval);
    };
  }, []);

  const carregarDadosDashboard = async () => {
    try {
      setCarregando(true);
      const dados = await dashboardAPI.obterDados();
      
      if (dados.metricas) {
        setMetricas(dados.metricas);
      }
      
      if (dados.sublinhas) {
        setSublinhas(dados.sublinhas);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      // Em caso de erro, tentar novamente após alguns segundos
      setTimeout(() => {
        carregarDadosDashboard();
      }, 5000);
    } finally {
      setCarregando(false);
    }
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.select-processo')) {
        setSelectAberto(false);
      }
    };

    if (selectAberto) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectAberto]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar />
      
      <div className="flex flex-1">
        <MenuLateral />
        
        <main className="flex-1 px-10 py-4 ml-20 mt-24"> 
          <div className="grid grid-cols-4 gap-3 mb-6">
            {/* Select de Processo */}
            <div className="col-span-1 relative select-processo">
              <label className="block mb-2 text-sm font-medium text-gray-700 uppercase">
                Seleção do Processo
              </label>
              <button
                type="button"
                onClick={() => setSelectAberto(!selectAberto)}
                className="w-full px-4 py-3 text-white text-sm font-bold rounded-lg shadow border-2 border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase text-left flex items-center justify-between"
                style={{ backgroundColor: 'var(--bg-azul)', minHeight: '48px' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#5B9BD5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-azul)';
                }}
              >
                <span className="truncate">
                  {processos.find(p => p.id === processoSelecionado)?.nome || 'Selecione'}
                </span>
                <i className={`bi bi-chevron-${selectAberto ? 'up' : 'down'} ml-2 flex-shrink-0`}></i>
              </button>
              
              {/* Dropdown de Opções */}
              {selectAberto && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg overflow-hidden z-50 border-2 border-gray-400" style={{ backgroundColor: 'var(--bg-azul)' }}>
                  <div className="max-h-64 overflow-y-auto">
                    {processos.map((processo) => (
                      <button
                        key={processo.id}
                        type="button"
                        onClick={() => {
                          setProcessoSelecionado(processo.id);
                          setSelectAberto(false);
                        }}
                        className="w-full px-4 py-3 text-white text-xs font-bold transition-all uppercase text-left hover:bg-blue-500 block"
                        style={{
                          backgroundColor: processoSelecionado === processo.id ? '#5B9BD5' : 'var(--bg-azul)',
                          borderLeft: processoSelecionado === processo.id ? '4px solid #4ADE80' : 'none',
                        }}
                      >
                        {processo.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <MetricCard
              titulo="Produção Hoje"
              valor={metricas.producaoHoje}
              icone="bi bi-box-seam"
              cor="var(--bg-laranja)"
            />
            <MetricCard
              titulo="Operadores"
              valor={metricas.operadoresAtivos}
              icone="bi bi-people"
              cor="var(--bg-azul)"
            />
            <MetricCard
              titulo="Eficiência"
              valor={`${metricas.totalPostos > 0 ? Math.round((metricas.postosAtivos / metricas.totalPostos) * 100) : 0}%`}
              icone="bi bi-speedometer2"
              cor="var(--bg-laranja)"
            />
          </div>

          {carregando ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando dados do dashboard...</p>
            </div>
          ) : sublinhas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Nenhum posto encontrado</p>
            </div>
          ) : (
            sublinhas.map((sublinha) => (
              <div key={sublinha.sublinha_id} className="mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-3">{sublinha.nome}</h2>
                <div className="grid grid-cols-4 gap-3">
                  {sublinha.postos.map((item) => (
                    <Card
                      key={`${sublinha.sublinha_id}-${item.posto_id}`}
                      posto={item.posto}
                      mod={item.mod}
                      peca_nome={item.peca_nome || 'Sem peça'}
                      qtd_real={item.qtd_real || 0}
                      operador={item.operador}
                      habilitado={item.habilitado}
                      turno={item.turno}
                      comentario={item.comentario}
                      comentario_aviso={item.comentario_aviso}
                      registro_id={item.registro_id}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard;