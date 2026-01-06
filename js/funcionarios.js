let funcionariosData = [];
let funcionarioEditando = null;

// Chamada ao controller: GET /api/funcionarios/todos
async function carregarFuncionarios() {
    // Verificar se o usuário está autenticado antes de fazer requisição
    if (!window.usuarioAutenticado) {
        return;
    }
    
    try {
        const response = await fetch('/api/funcionarios/todos', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Não autenticado, não fazer nada (auth.js já redireciona)
                return;
            }
            throw new Error(`Erro ${response.status}`);
        }
        
        funcionariosData = await response.json();
        
        const funcionariosListDiv = document.getElementById('funcionarios-list');
        if (!funcionariosListDiv) return;
        
        if (funcionariosData.length === 0) {
            funcionariosListDiv.innerHTML = '<p style="color: #666; padding: 20px;">Nenhum funcionário cadastrado</p>';
            return;
        }
        
        funcionariosListDiv.innerHTML = `
            <table class="tags-table">
                <thead>
                    <tr>
                        <th>Matrícula</th>
                        <th>Nome</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${funcionariosData.map(func => `
                        <tr>
                            <td><strong>${func.matricula}</strong></td>
                            <td>${func.nome}</td>
                            <td>
                                <span class="tag-status ${func.ativo ? 'ativo' : 'inativo'}">
                                    ${func.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </td>
                            <td>
                                <button class="btn-edit" onclick="editarFuncionario(${func.id})">
                                    <i class="bi bi-pencil-fill"></i> Editar
                                </button>
                                <button class="btn-delete" onclick="deletarFuncionario(${func.id})">
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
            console.error('Erro ao carregar funcionários:', error);
            // Não mostrar alert se não estiver autenticado
            if (window.usuarioAutenticado) {
                alert('Erro ao carregar funcionários: ' + error.message);
            }
        }
    }
}

// Chamada ao controller: POST /api/funcionarios
async function salvarFuncionario(event) {
    event.preventDefault();
    
    const matricula = document.getElementById('funcionario-matricula').value.trim();
    const nome = document.getElementById('funcionario-nome').value.trim();
    const ativo = document.getElementById('funcionario-ativo').checked;
    
    if (!matricula || !nome) {
        alert('Matrícula e nome são obrigatórios!');
        return;
    }
    
    try {
        let response;
        if (funcionarioEditando) {
            // Atualizar funcionário existente
            response = await fetch(`/api/funcionarios/${funcionarioEditando}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matricula: matricula,
                    nome: nome,
                    ativo: ativo
                })
            });
        } else {
            // Criar novo funcionário
            response = await fetch('/api/funcionarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matricula: matricula,
                    nome: nome,
                    ativo: ativo
                })
            });
        }
        
        const result = await response.json();
        
        if (result.status === 'success' || response.ok) {
            alert('Funcionário salvo com sucesso!');
            limparFormFuncionario();
            carregarFuncionarios();
        } else {
            alert('Erro ao salvar funcionário: ' + (result.error || result.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao salvar funcionário:', error);
        alert('Erro ao salvar funcionário: ' + error.message);
    }
}

function editarFuncionario(funcionarioId) {
    const funcionario = funcionariosData.find(f => f.id === funcionarioId);
    if (!funcionario) {
        alert('Funcionário não encontrado!');
        return;
    }
    
    funcionarioEditando = funcionarioId;
    document.getElementById('funcionario-matricula').value = funcionario.matricula;
    document.getElementById('funcionario-matricula').disabled = true;
    document.getElementById('funcionario-nome').value = funcionario.nome;
    document.getElementById('funcionario-ativo').checked = funcionario.ativo;
    
    document.getElementById('form-funcionario').scrollIntoView({ behavior: 'smooth' });
}

// Chamada ao controller: DELETE /api/funcionarios/:id
async function deletarFuncionario(funcionarioId) {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;
    
    try {
        const response = await fetch(`/api/funcionarios/${funcionarioId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.status === 'success' || response.ok) {
            alert('Funcionário excluído com sucesso!');
            carregarFuncionarios();
        } else {
            alert('Erro ao excluir funcionário: ' + (result.error || result.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao excluir funcionário:', error);
        alert('Erro ao excluir funcionário: ' + error.message);
    }
}

function limparFormFuncionario() {
    funcionarioEditando = null;
    document.getElementById('form-funcionario').reset();
    document.getElementById('funcionario-matricula').disabled = false;
    document.getElementById('funcionario-ativo').checked = true;
}

document.addEventListener('DOMContentLoaded', function() {
    const formFuncionario = document.getElementById('form-funcionario');
    if (formFuncionario) {
        formFuncionario.addEventListener('submit', salvarFuncionario);
    }
});

window.carregarFuncionarios = carregarFuncionarios;
window.editarFuncionario = editarFuncionario;
window.deletarFuncionario = deletarFuncionario;
window.limparFormFuncionario = limparFormFuncionario;

