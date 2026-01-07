import { useState, useEffect } from 'react';
import TopBar from '../Components/topBar/TopBar';
import MenuLateral from '../Components/MenuLateral/MenuLateral';
import { postosAPI } from '../api/api';
import { funcionariosAPI } from '../api/api';
import { modelosAPI } from '../api/api';

const Postos = () => {
  const [menuAberto, setMenuAberto] = useState(false);
  const [postos, setPostos] = useState([
    { id: 'P1', operador: '', peca: '', turno: '' },
    { id: 'P2', operador: '', peca: '', turno: '' },
    { id: 'P3', operador: '', peca: '', turno: '' },
    { id: 'P4', operador: '', peca: '', turno: '' }
  ]);
  const [operadores, setOperadores] = useState<{ id: string; nome: string }[]>([]);
  const [modelos, setModelos] = useState<{ id: string; nome: string }[]>([]);
  const [carregando, setCarregando] = useState(false);

  // Carrega funcionários e modelos ao montar - chamadas para funcionarios_controller.py e modelos_controller.py
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true)
        const [funcionariosData, modelosData, configuracoesData] = await Promise.all([
          funcionariosAPI.listar(),
          modelosAPI.listar(),
          postosAPI.listar()
        ])

        // Mapeia funcionários para o formato esperado
        setOperadores((funcionariosData || []).map((f: any) => ({
          id: f.matricula,
          nome: f.nome
        })))

        // Mapeia modelos para o formato esperado
        setModelos((modelosData || []).map((m: any) => ({
          id: m.codigo,
          nome: m.descricao || m.codigo
        })))

        // Carrega configurações dos postos se existirem
        if (configuracoesData?.configuracoes) {
          const configs = configuracoesData.configuracoes
          setPostos(postos.map(p => {
            const config = configs.find((c: any) => c.posto === p.id)
            if (config) {
              return {
                ...p,
                operador: config.funcionario_matricula || '',
                peca: config.modelo_codigo || '',
                turno: config.turno || ''
              }
            }
            return p
          }))
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setCarregando(false)
      }
    }
    carregarDados()
  }, [])

  const updatePosto = (id: string, campo: string, valor: string) => {
    setPostos(postos.map(p => 
      p.id === id ? { ...p, [campo]: valor } : p
    ));
  };

  const handleSalvarConfiguracao = async (id: string) => {
    const posto = postos.find(p => p.id === id);
    if (!posto) return;

    try {
      // Chamada API para salvar configuração do posto - posto_configuracao_controller.py POST /api/posto-configuracao
      const resposta = await postosAPI.configurar({
        posto: id,
        funcionario_matricula: posto.operador || undefined,
        modelo_codigo: posto.peca || undefined,
        turno: posto.turno || undefined
      });

      if (resposta.status === 'success') {
        alert('Configuração salva com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração. Tente novamente.');
    }
  };

  const getPostoNum = (id: string) => {
    return id === 'P1' ? '1' : id === 'P2' ? '2' : id === 'P3' ? '3' : '4';
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <TopBar menuAberto={menuAberto} onToggleMenu={() => setMenuAberto(!menuAberto)} />
      <MenuLateral menuAberto={menuAberto} onClose={() => setMenuAberto(false)} />
      
      <div className="grow pt-24 px-6 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
        <div className="bg-white container mx-auto px-6 py-8 rounded-lg shadow-md">
          <p className="text-xl text-gray-600 mb-6">
            Escolha a peça e turno em que irá trabalhar.
          </p>
          {carregando && (
            <div className="mb-4 text-gray-500">Carregando...</div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {postos.map((posto) => (
              <div key={posto.id} className="bg-white rounded-lg p-4 md:p-5 shadow-sm" style={{ border: '1px solid #4C79AF' }}>
                <h4 className="text-lg md:text-xl font-medium mb-4" style={{ color: '#4C79AF' }}>
                  Posto {getPostoNum(posto.id)}
                </h4>
                
                <div className="mb-4">
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Operador:
                  </label>
                  <select
                    value={posto.operador}
                    onChange={(e) => updatePosto(posto.id, 'operador', e.target.value)}
                    className="w-full px-3 py-2 md:px-4 md:py-3 rounded-md text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
                    style={{ border: '1px solid #4C79AF' }}
                  >
                    <option value="">Operador</option>
                    {operadores.map((op) => (
                      <option key={op.id} value={op.id}>{op.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Peça:
                  </label>
                  <select
                    value={posto.peca}
                    onChange={(e) => updatePosto(posto.id, 'peca', e.target.value)}
                    className="w-full px-3 py-2 md:px-4 md:py-3 rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
                    style={{ border: '1px solid #4C79AF' }}
                  >
                    <option value="">Peça</option>
                    {modelos.map((modelo) => (
                      <option key={modelo.id} value={modelo.id}>{modelo.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Turno:
                  </label>
                  <select
                    value={posto.turno}
                    onChange={(e) => updatePosto(posto.id, 'turno', e.target.value)}
                    className="w-full px-3 py-2 md:px-4 md:py-3 rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
                    style={{ border: '1px solid #4C79AF' }}
                  >
                    <option value="">Turno</option>
                    <option value="1">Turno 1</option>
                    <option value="2">Turno 2</option>
                  </select>
                </div>

                <button
                  onClick={() => handleSalvarConfiguracao(posto.id)}
                  className="w-full mt-2 px-4 py-2 md:px-5 md:py-3 text-white rounded-md text-sm md:text-base font-medium hover:opacity-90 transition-opacity active:opacity-75"
                  style={{ backgroundColor: '#4C79AF' }}
                >
                  Salvar Configuração
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Postos
