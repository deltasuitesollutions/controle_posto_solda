const API_BASE_URL = 'http://localhost:8000/api'

// Função auxiliar para fazer requisições
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  })
  
  const data = await response.json().catch(() => ({ erro: 'Erro ao processar resposta' }))
  
  if (!response.ok) {
    // O backend retorna 'erro' (português) quando há erro
    const errorMessage = data.erro || data.error || data.message || `Erro ${response.status}`
    throw new Error(errorMessage)
  }
  
  // Verificar se a resposta contém um erro mesmo com status 200
  if (data.erro) {
    throw new Error(data.erro)
  }
  
  return data
}

// CHAMADA PARA MODELOS_CONTROLLER.PY

export const modelosAPI = {
  listar: () => fetchAPI('/modelos'),
  listarTodos: () => fetchAPI('/modelos'),
  buscarPorCodigo: (codigo: string) => fetchAPI(`/modelos/${codigo}`),
  criar: (data: { nome: string; pecas?: Array<{codigo: string; nome: string}>}) => 
    fetchAPI('/modelos', {
      method: 'POST',
      body: JSON.stringify({ ...data, codigo: data.nome }), 
    }),
  atualizar: (id: number, data: {nome: string; pecas?: Array<{id?: number; codigo: string; nome: string}>}) =>
    fetchAPI(`/modelos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, codigo: data.nome }), 
    }),
  deletar: (id: number) =>
    fetchAPI(`/modelos/${id}`, {
      method: 'DELETE',
    }),
}

// CHAMADA PARA PECAS_CONTROLLER.PY

export const pecasAPI = {
  listarTodos: () => fetchAPI('/pecas'),
  buscarPorId: (id: number) => fetchAPI(`/pecas/${id}`),
  buscarPorModelo: (modeloId: number) => fetchAPI(`/pecas/modelo/${modeloId}`),
  criar: (data: { modelo_id: number; codigo: string; nome: string}) => 
    fetchAPI('/pecas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  atualizar: (id: number, data: {modelo_id: number; codigo: string; nome: string}) =>
    fetchAPI(`/pecas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletar: (id: number) =>
    fetchAPI(`/pecas/${id}`, {
      method: 'DELETE',
    }),
}

// CHAMADA PARA FUNCIONARIOS_CONTROLLER.PY

export const funcionariosAPI = {
  listar: () => fetchAPI('/funcionarios'),
  listarTodos: () => fetchAPI('/funcionarios/todos'),
  criar: (data: { matricula: string; nome: string; ativo?: boolean; tag?: string; turno: string; operacoes_ids?: number[]}) => 
    fetchAPI('/funcionarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  atualizar: (id: number, data: { nome: string; ativo?: boolean; tag?: string; turno: string; operacoes_ids?: number[] }) =>
    fetchAPI(`/funcionarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletar: (id: number) =>
    fetchAPI(`/funcionarios/${id}`, {
      method: 'DELETE',
    }),
  buscarOperacoesHabilitadas: (id: number) =>
    fetchAPI(`/funcionarios/${id}/operacoes-habilitadas`),
}

// CHAMADA PARA PRODUTOS_CONTROLLER.PY

export const produtosAPI = {
  listar: () =>
    fetchAPI('/produtos'),

  buscarPorId: (id: number) =>
    fetchAPI(`/produtos/${id}`),

  criar: (data: { nome: string }) =>
    fetchAPI('/produtos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  atualizar: (id: number, data: { nome: string }) =>
    fetchAPI(`/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletar: (id: number) =>
    fetchAPI(`/produtos/${id}`, {
      method: 'DELETE',
    }),
};

// CHAMADA PARA LINHA_CONTROLLER.PY

export const linhasAPI = {
  listar: () => fetchAPI('/linhas'),
  listarTodos: () => fetchAPI('/linhas'),
  buscarPorId: (id: number) => fetchAPI(`/linhas/${id}`),
  criar: (data: { nome: string }) => 
    fetchAPI('/linhas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  atualizar: (id: number, data: { nome: string }) =>
    fetchAPI(`/linhas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletar: (id: number) =>
    fetchAPI(`/linhas/${id}`, {
      method: 'DELETE',
    }),
}

// CHAMADA PARA SUBLINHA_CONTROLLER.PY

export const sublinhasAPI = {
  listar: (comLinha: boolean = false) => 
    fetchAPI(`/sublinhas${comLinha ? '?com_linha=true' : ''}`),
  listarTodos: (comLinha: boolean = false) => 
    fetchAPI(`/sublinhas${comLinha ? '?com_linha=true' : ''}`),
  buscarPorId: (id: number) => fetchAPI(`/sublinhas/${id}`),
  buscarPorLinha: (linhaId: number) => fetchAPI(`/sublinhas/por-linha/${linhaId}`),
  criar: (data: { nome: string; linha_id: number }) => 
    fetchAPI('/sublinhas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  atualizar: (id: number, data: { nome: string; linha_id: number }) =>
    fetchAPI(`/sublinhas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletar: (id: number) =>
    fetchAPI(`/sublinhas/${id}`, {
      method: 'DELETE',
    }),
}

// CHAMADA PARA POSTO_CONTROLLER.PY

export const postosAPI = {
  listar: () => fetchAPI('/postos'),
  listarTodos: () => fetchAPI('/postos'),
  buscarPorId: (id: number) => fetchAPI(`/postos/${id}`),
  buscarPorSublinha: (sublinhaId: number) => fetchAPI(`/postos/por-sublinha/${sublinhaId}`),
  buscarPorToten: (totenId: number) => fetchAPI(`/postos/por-toten/${totenId}`),
  listarTotensDisponiveis: () => fetchAPI('/postos/totens-disponiveis'),
  criar: (data: { nome: string; sublinha_id: number; toten_id: number }) => 
    fetchAPI('/postos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  atualizar: (id: number, data: { nome?: string; sublinha_id?: number; toten_id?: number }) =>
    fetchAPI(`/postos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletar: (id: number) =>
    fetchAPI(`/postos/${id}`, {
      method: 'DELETE',
    }),
}

// CHAMADA PARA OPERACAO_CONTROLLER.PY

export const operacoesAPI = {
  listar: () => fetchAPI('/operacoes'),
  listarTodos: () => fetchAPI('/operacoes'),
  buscarPorId: (id: number) => fetchAPI(`/operacoes/${id}`),
  criar: (data: { 
    operacao: string
    produto: string
    modelo: string
    linha: string
    posto: string
    totens?: string[]
    pecas?: string[]
    codigos?: string[]
  }) => 
    fetchAPI('/operacoes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  atualizar: (id: number, data: { 
    operacao?: string
    produto?: string
    modelo?: string
    linha?: string
    posto?: string
    totens?: string[]
    pecas?: string[]
    codigos?: string[]
  }) =>
    fetchAPI(`/operacoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletar: (id: number) =>
    fetchAPI(`/operacoes/${id}`, {
      method: 'DELETE',
    }),
}

// CHAMADA PARA IHM_CONTROLLER.PY

export const ihmAPI = {
  validarRfid: (codigo: string) =>
    fetchAPI('/ihm/validar-rfid', {
      method: 'POST',
      body: JSON.stringify({ codigo }),
    }),
  
  listarOperacoes: () => fetchAPI('/ihm/operacoes'),
  
  listarPostos: () => fetchAPI('/ihm/postos'),
  
  listarProdutos: () => fetchAPI('/ihm/produtos'),
  
  listarModelos: () => fetchAPI('/ihm/modelos'),
  
  registrarProducao: (data: {
    operacao: string
    produto?: string
    modelo: string
    peca?: string
    codigo?: string
    quantidade: number
    operador: string
  }) =>
    fetchAPI('/ihm/registrar-producao', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// CHAMADA PARA PRODUCAO_CONTROLLER.PY

export const producaoAPI = {
  registrarEntrada: (data: {
    posto: string
    funcionario_matricula?: string
    produto?: string
    modelo_codigo?: string
  }) =>
    fetchAPI('/producao/entrada', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  registrarSaida: (data: {
    registro_id?: number
    posto?: string
    funcionario_matricula?: string
  }) =>
    fetchAPI('/producao/saida', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  buscarRegistroAberto: (posto: string, funcionario_matricula: string) =>
    fetchAPI(`/producao/registro-aberto?posto=${encodeURIComponent(posto)}&funcionario_matricula=${encodeURIComponent(funcionario_matricula)}`),
}
