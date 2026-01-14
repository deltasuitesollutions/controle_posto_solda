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

// CHAMADA PARA MODELOS_CONTROLLER.PY

export const modelosAPI = {
  listar: () => fetchAPI('/modelos'),
  listarTodos: () => fetchAPI('/modelos'),
  buscarPorCodigo: (codigo: string) => fetchAPI(`/modelos/${codigo}`),
  criar: (data: { nome: string; pecas?: Array<{codigo: string; nome: string}>}) => 
    fetchAPI('/modelos', {
      method: 'POST',
      body: JSON.stringify({ ...data, codigo: data.nome }), // Envia nome como código para compatibilidade com backend
    }),
  atualizar: (id: number, data: {nome: string; pecas?: Array<{id?: number; codigo: string; nome: string}>}) =>
    fetchAPI(`/modelos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, codigo: data.nome }), // Envia nome como código para compatibilidade com backend
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
  criar: (data: { matricula: string; nome: string; ativo?: boolean; tag?: string }) => 
    fetchAPI('/funcionarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  atualizar: (id: number, data: { nome: string; ativo?: boolean; tag?: string }) =>
    fetchAPI(`/funcionarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletar: (id: number) =>
    fetchAPI(`/funcionarios/${id}`, {
      method: 'DELETE',
    }),
}

// CHAMADA PARA REGISTROS_CONTROLLER.PY

export const registrosAPI = {
  listar: (params?: { limit?: number; offset?: number; data?: string; posto?: string; turno?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString())
    if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString())
    if (params?.data) queryParams.append('data', params.data)
    if (params?.posto) queryParams.append('posto', params.posto)
    if (params?.turno) queryParams.append('turno', params.turno)
    const queryString = queryParams.toString()
    return fetchAPI(`/registros${queryString ? `?${queryString}` : ''}`)
  },
}

