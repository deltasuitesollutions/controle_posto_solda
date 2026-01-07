// Configuração da API - chamadas para o controller do servidor
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
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro na requisição' }))
    const errorMessage = error.error || error.message || `Erro ${response.status}`
    throw new Error(errorMessage)
  }
  
  return response.json()
}

// API de Funcionários - chamada para funcionarios_controller.py
export const funcionariosAPI = {
  // GET /api/funcionarios - lista funcionários ativos
  listar: () => fetchAPI('/funcionarios'),
  
  // GET /api/funcionarios/todos - lista todos os funcionários
  listarTodos: () => fetchAPI('/funcionarios/todos'),
  
  // POST /api/funcionarios - cria novo funcionário
  criar: (data: { matricula: string; nome: string; ativo?: boolean; tag?: string }) => 
    fetchAPI('/funcionarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // PUT /api/funcionarios/:id - atualiza funcionário
  atualizar: (id: number, data: { nome: string; ativo: boolean; tag?: string }) =>
    fetchAPI(`/funcionarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // DELETE /api/funcionarios/:id - deleta funcionário
  deletar: (id: number) =>
    fetchAPI(`/funcionarios/${id}`, {
      method: 'DELETE',
    }),
}

// API de Modelos - chamada para modelos_controller.py
export const modelosAPI = {
  // GET /api/modelos - lista modelos
  listar: () => fetchAPI('/modelos'),
  
  // GET /api/modelos/todos - lista todos os modelos com ID
  listarTodos: () => fetchAPI('/modelos/todos'),
  
  // POST /api/modelos - cria novo modelo
  criar: (data: { codigo: string; descricao: string }) =>
    fetchAPI('/modelos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // PUT /api/modelos/:id - atualiza modelo
  atualizar: (id: number, data: { codigo: string; descricao: string }) =>
    fetchAPI(`/modelos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // DELETE /api/modelos/:id - deleta modelo
  deletar: (id: number) =>
    fetchAPI(`/modelos/${id}`, {
      method: 'DELETE',
    }),
}

// API de Postos - chamada para posto_configuracao_controller.py
export const postosAPI = {
  // GET /api/posto-configuracao - lista todas as configurações
  listar: () => fetchAPI('/posto-configuracao'),
  
  // GET /api/posto-configuracao/:posto - obtém configuração de um posto
  obter: (posto: string) => fetchAPI(`/posto-configuracao/${posto}`),
  
  // POST /api/posto-configuracao - configura ou atualiza posto
  configurar: (data: {
    posto: string
    funcionario_matricula?: string
    modelo_codigo?: string
    turno?: string
  }) =>
    fetchAPI('/posto-configuracao', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // DELETE /api/posto-configuracao/:posto - remove configuração
  remover: (posto: string) =>
    fetchAPI(`/posto-configuracao/${posto}`, {
      method: 'DELETE',
    }),
}

// API de Registros - chamada para registros_controller.py
export const registrosAPI = {
  // GET /api/registros - lista registros com filtros
  listar: (filtros?: {
    limit?: number
    offset?: number
    data?: string
    posto?: string
    turno?: string
  }) => {
    const params = new URLSearchParams()
    if (filtros?.limit) params.append('limit', filtros.limit.toString())
    if (filtros?.offset) params.append('offset', filtros.offset.toString())
    if (filtros?.data) params.append('data', filtros.data)
    if (filtros?.posto) params.append('posto', filtros.posto)
    if (filtros?.turno) params.append('turno', filtros.turno)
    
    const query = params.toString()
    return fetchAPI(`/registros${query ? `?${query}` : ''}`)
  },
}

// API de Produção - chamada para producao_controller.py
export const producaoAPI = {
  // POST /api/producao/entrada - registra entrada do operador
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
  
  // POST /api/producao/saida - registra saída do operador
  registrarSaida: (data: {
    registro_id?: number
    posto?: string
    funcionario_matricula?: string
  }) =>
    fetchAPI('/producao/saida', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// API de Tags RFID - chamada para tags_controller.py
export const tagsAPI = {
  // POST /api/tags/processar - processa leitura RFID e registra entrada/saída
  processar: (data: { tag_id: string; posto?: string }) =>
    fetchAPI('/tags/processar', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

