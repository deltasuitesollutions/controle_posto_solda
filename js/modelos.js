let modelosData = [];
let modeloEditando = null;

// Chamada ao controller: GET /api/modelos/todos
async function carregarModelos() {
    // Verificar se o usuário está autenticado antes de fazer requisição
    if (!window.usuarioAutenticado) {
        return;
    }
    
    try {
        const response = await fetch('/api/modelos/todos', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Não autenticado, não fazer nada (auth.js já redireciona)
                return;
            }
            throw new Error(`Erro ${response.status}`);
        }
        
        modelosData = await response.json();
        
        const modelosListDiv = document.getElementById('modelos-list');
        if (!modelosListDiv) return;
        
        if (modelosData.length === 0) {
            modelosListDiv.innerHTML = '<p style="color: #666; padding: 20px;">Nenhum modelo cadastrado</p>';
            return;
        }
        
        modelosListDiv.innerHTML = `
            <table class="tags-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Descrição</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${modelosData.map(modelo => `
                        <tr>
                            <td><strong>${modelo.codigo}</strong></td>
                            <td>${modelo.descricao || '-'}</td>
                            <td>
                                <button class="btn-edit" onclick="editarModelo(${modelo.id})">
                                    <i class="bi bi-pencil-fill"></i> Editar
                                </button>
                                <button class="btn-delete" onclick="deletarModelo(${modelo.id})">
                                    <i class="bi bi-trash-fill"></i> Excluir
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        // Não mostrar erro se for por falta de autenticação
        if (error.message !== 'Failed to fetch' || window.usuarioAutenticado) {
            console.error('Erro ao carregar modelos:', error);
            // Não mostrar alert se não estiver autenticado
            if (window.usuarioAutenticado) {
                alert('Erro ao carregar modelos: ' + error.message);
            }
        }
    }
}

// Chamada ao controller: POST /api/modelos
async function salvarModelo(event) {
    event.preventDefault();
    
    const codigo = document.getElementById('modelo-codigo').value.trim();
    const descricao = document.getElementById('modelo-descricao').value.trim();
    
    if (!codigo) {
        alert('Código é obrigatório!');
        return;
    }
    
    try {
        let response;
        if (modeloEditando) {
            // Atualizar modelo existente
            response = await fetch(`/api/modelos/${modeloEditando}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    codigo: codigo,
                    descricao: descricao
                })
            });
        } else {
            // Criar novo modelo
            response = await fetch('/api/modelos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    codigo: codigo,
                    descricao: descricao
                })
            });
        }
        
        const result = await response.json();
        
        if (result.status === 'success' || response.ok) {
            alert('Modelo salvo com sucesso!');
            limparFormModelo();
            carregarModelos();
        } else {
            alert('Erro ao salvar modelo: ' + (result.error || result.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao salvar modelo:', error);
        alert('Erro ao salvar modelo: ' + error.message);
    }
}

function editarModelo(modeloId) {
    const modelo = modelosData.find(m => m.id === modeloId);
    if (!modelo) {
        alert('Modelo não encontrado!');
        return;
    }
    
    modeloEditando = modeloId;
    document.getElementById('modelo-codigo').value = modelo.codigo;
    document.getElementById('modelo-descricao').value = modelo.descricao || '';
    
    document.getElementById('form-modelo').scrollIntoView({ behavior: 'smooth' });
}

// Chamada ao controller: DELETE /api/modelos/:id
async function deletarModelo(modeloId) {
    if (!confirm('Tem certeza que deseja excluir este modelo?')) return;
    
    try {
        const response = await fetch(`/api/modelos/${modeloId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.status === 'success' || response.ok) {
            alert('Modelo excluído com sucesso!');
            carregarModelos();
        } else {
            alert('Erro ao excluir modelo: ' + (result.error || result.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao excluir modelo:', error);
        alert('Erro ao excluir modelo: ' + error.message);
    }
}

function limparFormModelo() {
    modeloEditando = null;
    document.getElementById('form-modelo').reset();
}

document.addEventListener('DOMContentLoaded', function() {
    const formModelo = document.getElementById('form-modelo');
    if (formModelo) {
        formModelo.addEventListener('submit', salvarModelo);
    }
});

window.carregarModelos = carregarModelos;
window.editarModelo = editarModelo;
window.deletarModelo = deletarModelo;
window.limparFormModelo = limparFormModelo;



