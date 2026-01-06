let tagsData = [];
let tagEditando = null;

// Chamada ao controller: GET /api/funcionarios
async function carregarFuncionariosParaTags() {
    // Verificar se o usuário está autenticado antes de fazer requisição
    if (!window.usuarioAutenticado) {
        return;
    }
    
    try {
        const response = await fetch('/api/funcionarios', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Não autenticado, não fazer nada (auth.js já redireciona)
                return;
            }
            throw new Error(`Erro ${response.status}`);
        }
        
        const funcionarios = await response.json();
        
        const select = document.getElementById('tag-funcionario');
        if (select) {
            select.innerHTML = '<option value="">-- Selecione o funcionário --</option>';
            funcionarios.forEach(func => {
                const option = document.createElement('option');
                option.value = func.matricula;
                option.textContent = `${func.nome} (${func.matricula})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        // Não mostrar erro se for por falta de autenticação
        if (error.message !== 'Failed to fetch' || window.usuarioAutenticado) {
            console.error('Erro ao carregar funcionários:', error);
        }
    }
}

// Chamada ao controller: GET /api/tags
async function carregarTags() {
    // Verificar se o usuário está autenticado antes de fazer requisição
    if (!window.usuarioAutenticado) {
        return;
    }
    
    try {
        const response = await fetch('/api/tags', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Não autenticado, não fazer nada (auth.js já redireciona)
                return;
            }
            throw new Error(`Erro ${response.status}`);
        }
        
        tagsData = await response.json();
        
        const tagsListDiv = document.getElementById('tags-list');
        if (!tagsListDiv) return;
        
        if (tagsData.length === 0) {
            tagsListDiv.innerHTML = '<p style="color: #666; padding: 20px;">Nenhuma tag cadastrada</p>';
            return;
        }
        
        tagsListDiv.innerHTML = `
            <table class="tags-table">
                <thead>
                    <tr>
                        <th>ID da Tag</th>
                        <th>Funcionário</th>
                        <th>Matrícula</th>
                        <th>Status</th>
                        <th>Data Cadastro</th>
                        <th>Observações</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${tagsData.map(tag => `
                        <tr>
                            <td><strong>${tag.tag_id}</strong></td>
                            <td>${tag.funcionario_nome || '-'}</td>
                            <td>${tag.funcionario_matricula || '-'}</td>
                            <td>
                                <span class="tag-status ${tag.ativo ? 'ativo' : 'inativo'}">
                                    ${tag.ativo ? 'Ativa' : 'Inativa'}
                                </span>
                            </td>
                            <td>${new Date(tag.data_cadastro).toLocaleString('pt-BR')}</td>
                            <td>${tag.observacoes || '-'}</td>
                            <td>
                                <button class="btn-edit" onclick="editarTag(${tag.id})">
                                    <i class="bi bi-pencil-fill"></i> Editar
                                </button>
                                <button class="btn-delete" onclick="deletarTag(${tag.id})">
                                    <i class="bi bi-trash-fill"></i> Excluir
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        // Não mostrar erro se for por falta de autenticação ou se não estiver autenticado
        if (error.message !== 'Failed to fetch' || window.usuarioAutenticado) {
            console.error('Erro ao carregar tags:', error);
            // Não mostrar alert se não estiver autenticado
            if (window.usuarioAutenticado) {
                alert('Erro ao carregar tags: ' + error.message);
            }
        }
    }
}

// Chamada ao controller: POST /api/tags ou PUT /api/tags/:id
async function salvarTag(event) {
    event.preventDefault();
    
    const tagId = document.getElementById('tag-id').value;
    const funcionarioMatricula = document.getElementById('tag-funcionario').value;
    const observacoes = document.getElementById('tag-observacoes').value;
    const ativo = document.getElementById('tag-ativo').checked;
    
    if (!tagId) {
        alert('ID da tag é obrigatório!');
        return;
    }
    
    try {
        let response;
        if (tagEditando) {
            // Chamada ao controller: PUT /api/tags/:id
            response = await fetch(`/api/tags/${tagEditando}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tag_id: tagId,
                    funcionario_matricula: funcionarioMatricula || null,
                    observacoes: observacoes,
                    ativo: ativo
                })
            });
        } else {
            // Chamada ao controller: POST /api/tags
            response = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tag_id: tagId,
                    funcionario_matricula: funcionarioMatricula || null,
                    observacoes: observacoes,
                    ativo: ativo
                })
            });
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('Tag salva com sucesso!');
            limparFormTag();
            carregarTags();
        } else {
            alert('Erro ao salvar tag: ' + result.message);
        }
    } catch (error) {
        console.error('Erro ao salvar tag:', error);
        alert('Erro ao salvar tag: ' + error.message);
    }
}

function editarTag(tagId) {
    const tag = tagsData.find(t => t.id === tagId);
    if (!tag) {
        alert('Tag não encontrada!');
        return;
    }
    
    tagEditando = tagId;
    document.getElementById('tag-id').value = tag.tag_id;
    document.getElementById('tag-id').disabled = true;
    document.getElementById('tag-funcionario').value = tag.funcionario_matricula || '';
    document.getElementById('tag-observacoes').value = tag.observacoes || '';
    document.getElementById('tag-ativo').checked = tag.ativo;
    
    document.getElementById('form-tag').scrollIntoView({ behavior: 'smooth' });
}

// Chamada ao controller: DELETE /api/tags/:id
async function deletarTag(tagId) {
    if (!confirm('Tem certeza que deseja excluir esta tag?')) return;
    
    try {
        const response = await fetch(`/api/tags/${tagId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('Tag excluída com sucesso!');
            carregarTags();
        } else {
            alert('Erro ao excluir tag: ' + result.message);
        }
    } catch (error) {
        console.error('Erro ao excluir tag:', error);
        alert('Erro ao excluir tag: ' + error.message);
    }
}

function limparFormTag() {
    tagEditando = null;
    document.getElementById('form-tag').reset();
    document.getElementById('tag-id').disabled = false;
}

document.addEventListener('DOMContentLoaded', function() {
    const formTag = document.getElementById('form-tag');
    if (formTag) {
        formTag.addEventListener('submit', salvarTag);
        // Não carregar dados aqui - aguardar autenticação
        // O router.js chamará essas funções quando a página de tags for acessada
    }
});

// Aguardar autenticação antes de carregar dados
document.addEventListener('usuarioAutenticado', function() {
    // Carregar dados apenas se estiver na página de tags
    const tagsPage = document.getElementById('page-tags');
    if (tagsPage && tagsPage.classList.contains('active')) {
        carregarFuncionariosParaTags();
        carregarTags();
    }
});

window.carregarTags = carregarTags;
window.editarTag = editarTag;
window.deletarTag = deletarTag;
window.limparFormTag = limparFormTag;
