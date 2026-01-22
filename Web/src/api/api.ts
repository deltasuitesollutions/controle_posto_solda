/**
 * ARQUITETURA API-FIRST
 * 
 * IMPORTANTE: Este é o ÚNICO ponto de comunicação entre o frontend e o backend.
 * 
 * REGRAS:
 * - O frontend NUNCA deve acessar o banco de dados diretamente
 * - Todas as operações devem passar por esta API
 * - Não importar models, services ou database do backend
 * - Usar apenas funções HTTP (GET, POST, PUT, DELETE)
 * 
 * Se você precisar acessar dados:
 * 1. Adicione uma função aqui (ex: modelosAPI.criar)
 * 2. Certifique-se de que o endpoint existe no backend (Server/controller/)
 * 3. Use a função no componente React
 */

const API_BASE_URL = 'http://localhost:8000/api'

/**
 * Função auxiliar para fazer requisições HTTP à API
 * 
 * Esta é a única forma permitida de comunicação com o backend.
 * NUNCA importe ou use DatabaseConnection, models ou services diretamente.
 * 
 * @param endpoint - Endpoint da API (ex: '/modelos', '/funcionarios')
 * @param options - Opções do fetch (method, body, headers, etc.)
 * @returns Promise com os dados retornados pela API
 */
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  // Obter usuario_id do localStorage se disponível
  let usuarioId: string | null = null
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      usuarioId = user.id?.toString() || user.usuario_id?.toString() || null
    }
  } catch {
    // Ignorar erros ao ler localStorage
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Adicionar usuario_id no header se disponível
  if (usuarioId) {
    headers['X-User-Id'] = usuarioId
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
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
  criar: (data: { nome: string; pecas?: Array<{codigo: string; nome: string}>; produto_id?: number}) => 
    fetchAPI('/modelos', {
      method: 'POST',
      body: JSON.stringify({ ...data, codigo: data.nome }), 
    }),
  atualizar: (id: number, data: {nome: string; pecas?: Array<{id?: number; codigo: string; nome: string}>; produto_id?: number}) =>
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
  listarTodosComRelacoes: () => fetchAPI('/pecas?com_relacoes=true'),
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
    operacao?: string
    peca?: string
    codigo?: string
    quantidade?: number
  }) =>
    fetchAPI('/producao/entrada', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  registrarSaida: (data: {
    registro_id?: number
    posto?: string
    funcionario_matricula?: string
    quantidade?: number
  }) =>
    fetchAPI('/producao/saida', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  buscarRegistroAberto: (posto: string, funcionario_matricula: string) =>
    fetchAPI(`/producao/registro-aberto?posto=${encodeURIComponent(posto)}&funcionario_matricula=${encodeURIComponent(funcionario_matricula)}`),
}

// CHAMADA PARA REGISTROS_CONTROLLER.PY

export const registrosAPI = {
  listar: (params?: {
    limit?: number
    offset?: number
    data?: string
    posto?: string
    operacao?: string
    turno?: string[]
    hora_inicio?: string
    hora_fim?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    if (params?.data) queryParams.append('data', params.data)
    if (params?.posto) queryParams.append('posto', params.posto)
    if (params?.operacao) queryParams.append('operacao', params.operacao)
    if (params?.turno && params.turno.length > 0) {
      queryParams.append('turno', params.turno.join(','))
    }
    if (params?.hora_inicio) queryParams.append('hora_inicio', params.hora_inicio)
    if (params?.hora_fim) queryParams.append('hora_fim', params.hora_fim)
    
    const queryString = queryParams.toString()
    return fetchAPI(`/registros${queryString ? `?${queryString}` : ''}`)
  },
  atualizarComentario: (registroId: number, comentario: string) =>
    fetchAPI(`/registros/${registroId}/comentario`, {
      method: 'PUT',
      body: JSON.stringify({ comentario }),
    }),
}

// CHAMADA PARA DASHBOARD_CONTROLLER.PY

export const dashboardAPI = {
  obterDados: () => fetchAPI('/dashboard'),
}

// CHAMADA PARA USUARIOS_CONTROLLER.PY

export const usuariosAPI = {
  login: (data: { username: string; senha: string }) =>
    fetchAPI('/usuarios/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listar: () => fetchAPI('/usuarios'),
  listarTodos: () => fetchAPI('/usuarios/todos'),
  criar: (data: { username: string; nome: string; senha: string; role: 'admin' | 'operador' | 'master'; ativo?: boolean }) => 
    fetchAPI('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  atualizar: (id: number, data: { username?: string; nome?: string; senha?: string; role?: 'admin' | 'operador' | 'master'; ativo?: boolean }) =>
    fetchAPI(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletar: (id: number) =>
    fetchAPI(`/usuarios/${id}`, {
      method: 'DELETE',
    }),
}

// CHAMADA PARA AUDIT_CONTROLLER.PY

export const auditAPI = {
  listar: (params?: {
    limit?: number
    offset?: number
    usuario_id?: number
    entidade?: string
    acao?: string
    data_inicio?: string
    data_fim?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    if (params?.usuario_id) queryParams.append('usuario_id', params.usuario_id.toString())
    if (params?.entidade) queryParams.append('entidade', params.entidade)
    if (params?.acao) queryParams.append('acao', params.acao)
    if (params?.data_inicio) queryParams.append('data_inicio', params.data_inicio)
    if (params?.data_fim) queryParams.append('data_fim', params.data_fim)
    
    const queryString = queryParams.toString()
    return fetchAPI(`/audit${queryString ? `?${queryString}` : ''}`)
  },
}

// CHAMADA PARA TAGS_TEMPORARIAS_CONTROLLER.PY

export const tagsTemporariasAPI = {
  criar: (data: { funcionario_id: number; tag_id: string; horas_duracao?: number }) =>
    fetchAPI('/tags-temporarias', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listarPorFuncionario: (funcionario_id: number) =>
    fetchAPI(`/tags-temporarias/funcionario/${funcionario_id}`),
  excluir: (tag_id: string) =>
    fetchAPI(`/tags-temporarias/${tag_id}`, {
      method: 'DELETE',
    }),
  limparExpiradas: () =>
    fetchAPI('/tags-temporarias/limpar-expiradas', {
      method: 'POST',
    }),
}

// CHAMADA PARA CANCELAMENTO_CONTROLLER.PY

export const cancelamentoAPI = {
  listarOperacoesIniciadas: (params?: {
    data?: string
    limit?: number
    offset?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.data) queryParams.append('data', params.data)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    
    const queryString = queryParams.toString()
    return fetchAPI(`/cancelamentos/operacoes-iniciadas${queryString ? `?${queryString}` : ''}`)
  },
  cancelar: (data: { registro_id: number; motivo: string }) =>
    fetchAPI('/cancelamentos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listarCancelamentos: (params?: {
    limit?: number
    offset?: number
    data_inicio?: string
    data_fim?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    if (params?.data_inicio) queryParams.append('data_inicio', params.data_inicio)
    if (params?.data_fim) queryParams.append('data_fim', params.data_fim)
    
    const queryString = queryParams.toString()
    return fetchAPI(`/cancelamentos${queryString ? `?${queryString}` : ''}`)
  },
  exportarCSV: (params?: {
    data_inicio?: string
    data_fim?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.data_inicio) queryParams.append('data_inicio', params.data_inicio)
    if (params?.data_fim) queryParams.append('data_fim', params.data_fim)
    
    const queryString = queryParams.toString()
    const url = `${API_BASE_URL}/cancelamentos/exportar-csv${queryString ? `?${queryString}` : ''}`
    
    // Para download de arquivo, usar fetch direto
    return fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'X-User-Id': localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').id?.toString() || '' : ''
      }
    }).then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.erro || 'Erro ao exportar')
        })
      }
      return response.blob().then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cancelamentos_${params?.data_inicio || 'todos'}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      })
    })
  },
}
