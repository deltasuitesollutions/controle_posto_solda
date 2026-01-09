import { useState, useEffect } from 'react';
import Card from '../Components/dashboard/Card';
import MenuLateral from '../Components/MenuLateral/MenuLateral';
import TopBar from '../Components/topBar/TopBar';
import { postosAPI, funcionariosAPI, modelosAPI, registrosAPI } from '../api/api';

interface CardProps {
  id: number; 
  posto: string;
  mod: string;
  pecas: string;
  operador: string;
  habilitado: boolean;
  turno?: string;
}

interface Funcionario {
  matricula: string;
  nome: string;
  ativo?: boolean;
  tag?: string;
}

interface Modelo {
  codigo: string;
  descricao?: string;
}

interface ConfiguracaoPosto {
  posto: string;
  funcionario_matricula?: string;
  modelo_codigo?: string;
  turno?: string;
}

interface Registro {
  posto: string;
  turno?: string;
  [key: string]: unknown;
}

interface ConfiguracoesResponse {
  configuracoes: ConfiguracaoPosto[];
}

interface RegistrosResponse {
  registros: Registro[];
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
  const [listaPostos, setListaPostos] = useState<CardProps[]>([
    { id: 1, posto: 'Posto 1', mod: 'Sem modelo', pecas: '0/100', operador: 'Sem operador', habilitado: false },
    { id: 2, posto: 'Posto 2', mod: 'Sem modelo', pecas: '0/100', operador: 'Sem operador', habilitado: false },
    { id: 3, posto: 'Posto 3', mod: 'Sem modelo', pecas: '0/100', operador: 'Sem operador', habilitado: false },
    { id: 4, posto: 'Posto 4', mod: 'Sem modelo', pecas: '0/100', operador: 'Sem operador', habilitado: false },
  ]);
  const [metricas, setMetricas] = useState({
    postosAtivos: 0,
    totalPostos: 4,
    producaoHoje: 0,
    operadoresAtivos: 0
  });

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [configuracoesData, funcionariosData, modelosData, registrosData] = await Promise.all([
          postosAPI.listar().catch(() => ({ configuracoes: [] })) as Promise<ConfiguracoesResponse>,
          funcionariosAPI.listar().catch(() => []) as Promise<Funcionario[]>,
          modelosAPI.listar().catch(() => []) as Promise<Modelo[]>,
          registrosAPI.listar({ limit: 100 }).catch(() => ({ registros: [] })) as Promise<RegistrosResponse>
        ]);

        const funcionariosMap = new Map((funcionariosData || []).map((f) => [f.matricula, f.nome]));
        const modelosMap = new Map((modelosData || []).map((m) => [m.codigo, m.descricao || m.codigo]));
        const configuracoes = configuracoesData?.configuracoes || [];
        const postosProcessados: CardProps[] = [];

        for (let i = 1; i <= 4; i++) {
          const postoId = `P${i}`;
          const config = configuracoes.find((c) => c.posto === postoId);
          
          const operadorNome = config?.funcionario_matricula 
            ? funcionariosMap.get(config.funcionario_matricula) || 'Sem operador'
            : 'Sem operador';
          
          const modeloNome = config?.modelo_codigo 
            ? modelosMap.get(config.modelo_codigo) || 'Sem modelo'
            : 'Sem modelo';

          const registrosPosto = registrosData?.registros?.filter((r) => r.posto === postoId) || [];
          const producao = registrosPosto.length || 0;
          const meta = 100;
          
          postosProcessados.push({
            id: i,
            posto: `Posto ${i}`,
            mod: modeloNome,
            pecas: `${producao}/${meta}`,
            operador: operadorNome,
            habilitado: !!config,
            turno: config?.turno || 'Não definido'
          });
        }

        setListaPostos(postosProcessados);

        const postosAtivos = postosProcessados.filter(p => p.habilitado).length;
        const totalPostos = postosProcessados.length;
        const producaoTotal = postosProcessados.reduce((acc, p) => {
          const [atual] = p.pecas.split('/').map(Number);
          return acc + (atual || 0);
        }, 0);
        const operadoresAtivos = new Set(postosProcessados.filter(p => p.operador !== 'Sem operador').map(p => p.operador)).size;

        setMetricas({
          postosAtivos,
          totalPostos,
          producaoHoje: producaoTotal,
          operadoresAtivos
        });

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    carregarDados();
  }, []);

  const sublinhas = [
    { nome: 'SubLinha 1', postos: listaPostos },
    { nome: 'SubLinha 2', postos: listaPostos },
    { nome: 'SubLinha 3', postos: listaPostos },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar />
      
      <div className="flex flex-1">
        <MenuLateral />
        
        <main className="flex-1 px-10 py-4 ml-20 mt-24"> 
          <div className="grid grid-cols-4 gap-3 mb-6">
            <MetricCard
              titulo="Postos Ativos"
              valor={`${metricas.postosAtivos}/${metricas.totalPostos}`}
              icone="bi bi-building"
              cor="var(--bg-azul)"
            />
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

          {sublinhas.map((sublinha, idx) => (
            <div key={idx} className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3">{sublinha.nome}</h2>
              <div className="grid grid-cols-4 gap-3">
                {sublinha.postos.map((item) => (
                  <Card
                    key={`${sublinha.nome}-${item.id}`}
                    posto={item.posto}
                    mod={item.mod}
                    pecas={item.pecas}
                    operador={item.operador}
                    habilitado={item.habilitado}
                    turno={item.turno}
                  />
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  )
}

export default Dashboard;