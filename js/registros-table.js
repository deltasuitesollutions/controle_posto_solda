class RegistrosTable {
    constructor() {
        this.registros = [];
        this.filteredRegistros = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.sortColumn = null;
        this.sortDirection = 'desc';
        this.init();
    }

    init() {
        this.setupEventListeners();
        // Aguardar um pouco para garantir que o DOM está pronto
        setTimeout(() => {
            this.populateTimeSelectors();
        }, 100);
        
        // Aguardar autenticação antes de carregar registros
        if (window.authVerificado && window.usuarioAutenticado) {
            this.loadRegistros();
        } else {
            // Aguardar verificação de autenticação
            const verificarAuth = setInterval(() => {
                if (window.authVerificado) {
                    clearInterval(verificarAuth);
                    if (window.usuarioAutenticado) {
                        this.loadRegistros();
                    }
                    // Se não autenticado, auth.js já redirecionou
                }
            }, 50);

            // Timeout de segurança
            setTimeout(() => {
                clearInterval(verificarAuth);
            }, 2000);
        }
    }

    populateTimeSelectors() {
        // Popular seletores de hora (00-23)
        const horas = Array.from({ length: 24 }, (_, i) => {
            const hora = i.toString().padStart(2, '0');
            return { value: hora, label: hora };
        });

        // Popular seletores de minuto (00-59 para precisão total)
        const minutos = Array.from({ length: 60 }, (_, i) => {
            const minuto = i.toString().padStart(2, '0');
            return { value: minuto, label: minuto };
        });

        // Função auxiliar para popular um select
        const populateSelect = (selectId, options, placeholder = '--') => {
            const select = document.getElementById(selectId);
            if (!select) return;
            
            select.innerHTML = `<option value="">${placeholder}</option>`;
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                select.appendChild(option);
            });
        };

        // Popular todos os seletores
        populateSelect('filter-inicio-hora', horas);
        populateSelect('filter-inicio-minuto', minutos);
        populateSelect('filter-fim-hora', horas);
        populateSelect('filter-fim-minuto', minutos);
    }

    getTimeValue(horaId, minutoId) {
        const hora = document.getElementById(horaId)?.value || '';
        const minuto = document.getElementById(minutoId)?.value || '';
        
        if (!hora || !minuto) return '';
        
        return `${hora}:${minuto}`;
    }

    setupEventListeners() {
        document.addEventListener('filtersChanged', (e) => {
            this.applyFilters(e.detail.filters);
        });

        const filterData = document.getElementById('filter-data');
        if (filterData) {
            filterData.addEventListener('change', () => this.loadRegistros());
        }

        // Event listeners para filtros de horário (hora e minuto separados)
        const filterInicioHora = document.getElementById('filter-inicio-hora');
        const filterInicioMinuto = document.getElementById('filter-inicio-minuto');
        const filterFimHora = document.getElementById('filter-fim-hora');
        const filterFimMinuto = document.getElementById('filter-fim-minuto');

        const aplicarFiltroTempo = () => {
            this.validarIntervaloHorario();
            this.applyTimeFilters();
        };

        if (filterInicioHora) {
            filterInicioHora.addEventListener('change', aplicarFiltroTempo);
        }
        if (filterInicioMinuto) {
            filterInicioMinuto.addEventListener('change', aplicarFiltroTempo);
        }
        if (filterFimHora) {
            filterFimHora.addEventListener('change', aplicarFiltroTempo);
        }
        if (filterFimMinuto) {
            filterFimMinuto.addEventListener('change', aplicarFiltroTempo);
        }

        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageSizeSelect = document.getElementById('page-size');

        if (prevBtn) prevBtn.addEventListener('click', () => this.previousPage());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                this.pageSize = parseInt(e.target.value);
                this.currentPage = 1;
                this.render();
            });
        }

        const refreshBtn = document.getElementById('refresh-table');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadRegistros());
        }
    }

    // Chamada ao controller: GET /api/registros
    async loadRegistros() {
        // Não carregar se não estiver autenticado
        if (!window.usuarioAutenticado && window.location.pathname !== '/login.html' && window.location.pathname !== '/cadastro.html') {
            return;
        }

        const container = document.getElementById('registros-table-container');
        if (!container) return;

        container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Carregando registros...</p></div>';

        try {
            const filtros = {
                data: document.getElementById('filter-data')?.value || '',
                posto: document.getElementById('filter-posto')?.value || '',
                turno: document.getElementById('filter-turno')?.value || '',
                limit: this.pageSize,
                offset: (this.currentPage - 1) * this.pageSize
            };
            
            const params = new URLSearchParams();
            Object.entries(filtros).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            
            const response = await fetch(`/api/registros?${params.toString()}`);
            if (!response.ok) {
                if (response.status === 401) {
                    // Não autenticado, será redirecionado pelo auth.js
                    return;
                }
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            const registros = data.registros || data;
            
            this.registros = registros;
            this.filteredRegistros = [...registros];
            this.totalRegistros = data.total || registros.length;
            this.currentPage = 1;
            this.render();
        } catch (error) {
            console.error('Erro ao carregar registros:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p class="empty-state-text">Erro ao carregar registros: ${error.message}</p>
                </div>
            `;
        }
    }

    applyFilters(filters) {
        this.filteredRegistros = this.registros.filter(reg => {
            for (const [key, value] of Object.entries(filters)) {
                if (!value || value.trim() === '') continue;

                const lowerValue = value.toLowerCase();

                switch (key) {
                    case 'data':
                        if (!reg.data_raw || !reg.data_raw.toLowerCase().includes(lowerValue)) return false;
                        break;
                    case 'funcionario':
                        const funcMatch = reg.funcionario?.nome?.toLowerCase().includes(lowerValue) ||
                                         reg.funcionario?.matricula?.toLowerCase().includes(lowerValue);
                        if (!funcMatch) return false;
                        break;
                    case 'modelo':
                        const modelMatch = reg.modelo?.descricao?.toLowerCase().includes(lowerValue) ||
                                          reg.modelo?.codigo?.toLowerCase().includes(lowerValue);
                        if (!modelMatch) return false;
                        break;
                    case 'posto':
                        if (!reg.posto || !reg.posto.toLowerCase().includes(lowerValue)) return false;
                        break;
                    case 'turno':
                        if (reg.turno != value) return false;
                        break;
                }
            }
            return true;
        });

        this.currentPage = 1;
        this.render();
    }

    /**
     * Converte horário HH:MM para minutos desde o início do dia
     * @param {string} horaStr - Horário no formato HH:MM
     * @returns {number|null} - Minutos desde meia-noite ou null se inválido
     */
    horaParaMinutos(horaStr) {
        if (!horaStr || horaStr === '') return null;
        const partes = horaStr.split(':');
        if (partes.length !== 2) return null;
        const horas = parseInt(partes[0], 10);
        const minutos = parseInt(partes[1], 10);
        if (isNaN(horas) || isNaN(minutos)) return null;
        return horas * 60 + minutos;
    }

    /**
     * Verifica se um registro intercepta o intervalo de horário do filtro
     * @param {string} regInicio - Horário de início do registro (HH:MM)
     * @param {string|null} regFim - Horário de fim do registro (HH:MM ou null se em produção)
     * @param {string} filtroInicio - Horário de início do filtro (HH:MM ou '')
     * @param {string} filtroFim - Horário de fim do filtro (HH:MM ou '')
     * @returns {boolean} - true se há interceptação
     */
    horarioInterceptaIntervalo(regInicio, regFim, filtroInicio, filtroFim) {
        if (!regInicio) return false;

        const regInicioMin = this.horaParaMinutos(regInicio);
        if (regInicioMin === null) return false;

        // Se registro está em produção (sem hora_fim), considerar que vai até o final do dia
        const regFimMin = regFim ? this.horaParaMinutos(regFim) : (24 * 60 - 1);
        if (regFimMin === null) return false;

        const filtroInicioMin = filtroInicio ? this.horaParaMinutos(filtroInicio) : null;
        const filtroFimMin = filtroFim ? this.horaParaMinutos(filtroFim) : null;

        // Caso 1: Apenas filtro de início
        if (filtroInicioMin !== null && filtroFimMin === null) {
            // Mostrar registros que começaram a partir da hora de início OU que já estavam acontecendo
            // Um registro estava acontecendo se: começou antes ou na hora do filtro E terminou depois
            return regInicioMin >= filtroInicioMin || (regInicioMin <= filtroInicioMin && regFimMin > filtroInicioMin);
        }

        // Caso 2: Apenas filtro de fim
        if (filtroInicioMin === null && filtroFimMin !== null) {
            // Mostrar registros que ainda estavam acontecendo na hora de fim
            // Um registro estava acontecendo se: começou antes ou na hora E terminou depois ou na hora
            return regInicioMin <= filtroFimMin && regFimMin >= filtroFimMin;
        }

        // Caso 3: Intervalo completo (início e fim)
        if (filtroInicioMin !== null && filtroFimMin !== null) {
            // Validar que o intervalo do filtro é válido (fim >= início)
            if (filtroFimMin < filtroInicioMin) return false;

            // Dois intervalos se interceptam se há qualquer sobreposição:
            // 1. O início do registro está dentro do intervalo do filtro
            // 2. O fim do registro está dentro do intervalo do filtro
            // 3. O registro engloba completamente o intervalo do filtro
            // 4. O filtro engloba completamente o registro
            const regComecaDentro = regInicioMin >= filtroInicioMin && regInicioMin <= filtroFimMin;
            const regTerminaDentro = regFimMin >= filtroInicioMin && regFimMin <= filtroFimMin;
            const regEnglobaFiltro = regInicioMin <= filtroInicioMin && regFimMin >= filtroFimMin;
            const filtroEnglobaReg = filtroInicioMin <= regInicioMin && filtroFimMin >= regFimMin;

            return regComecaDentro || regTerminaDentro || regEnglobaFiltro || filtroEnglobaReg;
        }

        return true;
    }

    /**
     * Valida e corrige se o horário de fim for menor que o de início
     * @returns {boolean} - true se válido, false se inválido
     */
    validarIntervaloHorario() {
        const inicioValue = this.getTimeValue('filter-inicio-hora', 'filter-inicio-minuto');
        const fimValue = this.getTimeValue('filter-fim-hora', 'filter-fim-minuto');

        if (inicioValue && fimValue) {
            const inicioMin = this.horaParaMinutos(inicioValue);
            const fimMin = this.horaParaMinutos(fimValue);

            if (inicioMin !== null && fimMin !== null && fimMin < inicioMin) {
                // Resetar o filtro de fim se for inválido (fim antes do início)
                const fimHoraSelect = document.getElementById('filter-fim-hora');
                const fimMinutoSelect = document.getElementById('filter-fim-minuto');
                
                if (fimHoraSelect && fimMinutoSelect) {
                    fimHoraSelect.value = '';
                    fimMinutoSelect.value = '';
                    
                    // Aplicar estilo de erro temporário
                    fimHoraSelect.style.borderColor = '#dc3545';
                    fimMinutoSelect.style.borderColor = '#dc3545';
                    
                    setTimeout(() => {
                        fimHoraSelect.style.borderColor = '';
                        fimMinutoSelect.style.borderColor = '';
                    }, 2000);
                }
                return false;
            }
        }
        return true;
    }

    applyTimeFilters() {
        // Validar intervalo primeiro
        this.validarIntervaloHorario();
        
        // Obter valores após validação (pode ter sido resetado)
        const inicioValue = this.getTimeValue('filter-inicio-hora', 'filter-inicio-minuto');
        const fimValue = this.getTimeValue('filter-fim-hora', 'filter-fim-minuto');

        return this.applyTimeFiltersComIntervalo(inicioValue, fimValue);
    }

    applyTimeFiltersComIntervalo(inicioValue, fimValue) {
        // Começar com os registros já filtrados pelos filtros avançados, ou todos se não houver filtros avançados
        const baseRegistros = this.filteredRegistros.length > 0 ? this.filteredRegistros : this.registros;

        if (!inicioValue && !fimValue) {
            // Se ambos os filtros estão vazios, manter os filtros existentes
            this.filteredRegistros = baseRegistros;
            this.currentPage = 1;
            this.render();
            return;
        }

        this.filteredRegistros = baseRegistros.filter(reg => {
            const regInicio = reg.hora_inicio || '';
            const regFim = reg.hora_fim || null;

            return this.horarioInterceptaIntervalo(regInicio, regFim, inicioValue, fimValue);
        });

        this.currentPage = 1;
        this.render();
    }

    render() {
        const container = document.getElementById('registros-table-container');
        if (!container) return;

        if (this.filteredRegistros.length === 0) {
            container.innerHTML = '<div class="empty-state"><p class="empty-state-text">Nenhum registro encontrado</p></div>';
            this.updatePagination();
            return;
        }

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageData = this.filteredRegistros.slice(startIndex, endIndex);

        let html = `
            <div class="table-wrapper">
                <table class="registros-table">
                    <thead>
                        <tr>
                            <th class="table-checkbox"><input type="checkbox" id="select-all"></th>
                            <th>Registro</th>
                            <th>POSTO</th>
                            <th>OPERADOR</th>
                            <th>Produto</th>
                            <th>TURNO</th>
                            <th>Início</th>
                            <th>Fim</th>
                            <th>DATA</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        pageData.forEach((reg, index) => {
            const textoRegistro = reg.texto_registro || 
                `No ${reg.turno}° turno, ${reg.hora_fim ? `de ${reg.hora_inicio} às ${reg.hora_fim}` : `a partir de ${reg.hora_inicio}`}, do dia ${reg.data}, o ${reg.funcionario.nome}, matrícula ${reg.funcionario.matricula}, produziu o ${reg.modelo.descricao}.`;
            
            html += `
                <tr>
                    <td class="table-checkbox">
                        <input type="checkbox" class="row-checkbox" data-index="${startIndex + index}">
                    </td>
                    <td><div class="registro-text">${textoRegistro}</div></td>
                    <td>${reg.posto || 'N/A'}</td>
                    <td>
                        <strong>${reg.funcionario?.nome || 'N/A'}</strong><br>
                        <small class="registro-meta">${reg.funcionario?.matricula || ''}</small>
                    </td>
                    <td>
                        <strong>${reg.modelo?.descricao || 'N/A'}</strong><br>
                        <small class="registro-meta">${reg.modelo?.codigo || ''}</small>
                    </td>
                    <td><span class="status-badge active">${reg.turno}° Turno</span></td>
                    <td>${reg.hora_inicio || 'N/A'}</td>
                    <td>${reg.hora_fim || 'N/A'}</td>
                    <td>${reg.data || 'N/A'}</td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        container.innerHTML = html;
        this.updatePagination();
        this.setupTableListeners();
        document.dispatchEvent(new CustomEvent('tableRendered'));
    }
    
    applyAdvancedFilters(filters) {
        const baseRegistros = this.registros.length > 0 ? this.registros : this.filteredRegistros;
        
        this.filteredRegistros = baseRegistros.filter(reg => {
            for (const [columnName, selectedValues] of Object.entries(filters)) {
                if (!selectedValues || !Array.isArray(selectedValues) || selectedValues.length === 0) continue;
                
                let regValue = null;
                
                switch(columnName) {
                    case 'posto': regValue = reg.posto; break;
                    case 'turno': regValue = reg.turno ? `${reg.turno}` : null; break;
                    case 'data': regValue = reg.data; break;
                    case 'produto': regValue = reg.modelo?.codigo || reg.modelo?.descricao; break;
                    case 'matricula': regValue = reg.funcionario?.matricula; break;
                    case 'operador': regValue = reg.funcionario?.nome; break;
                }
                
                const regValueStr = regValue !== null && regValue !== undefined ? String(regValue) : '';
                if (regValueStr === '' || !selectedValues.includes(regValueStr)) return false;
            }
            
            // Aplicar filtros de tempo junto com os outros filtros
            const inicioValue = this.getTimeValue('filter-inicio-hora', 'filter-inicio-minuto');
            const fimValue = this.getTimeValue('filter-fim-hora', 'filter-fim-minuto');
            
            if (inicioValue || fimValue) {
                const regInicio = reg.hora_inicio || '';
                const regFim = reg.hora_fim || null;

                if (!this.horarioInterceptaIntervalo(regInicio, regFim, inicioValue, fimValue)) {
                    return false;
                }
            }
            
            return true;
        });
        
        this.currentPage = 1;
        this.render();
    }

    setupTableListeners() {
        const selectAll = document.getElementById('select-all');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = e.target.checked);
            });
        }
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredRegistros.length / this.pageSize);
        const startIndex = (this.currentPage - 1) * this.pageSize + 1;
        const endIndex = Math.min(this.currentPage * this.pageSize, this.filteredRegistros.length);
        const total = this.filteredRegistros.length;

        const paginationInfo = document.getElementById('pagination-info');
        if (paginationInfo) {
            paginationInfo.textContent = `Mostrando ${startIndex} - ${endIndex} de ${total}`;
        }

        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.render();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredRegistros.length / this.pageSize);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.render();
        }
    }
}

let registrosTable;
let tableFilters;

function inicializarRegistrosTable() {
    // Verificar se estamos em página de login/cadastro - não inicializar
    if (window.location.pathname.includes('login') || window.location.pathname.includes('cadastro')) {
        return;
    }

    function criarTabela() {
        registrosTable = new RegistrosTable();
        tableFilters = new TableFilters(registrosTable);
    }

    // Se já verificou e está autenticado, criar imediatamente
    if (window.authVerificado && window.usuarioAutenticado) {
        criarTabela();
    } else {
        // Aguardar verificação de autenticação
        const verificarAuth = setInterval(() => {
            if (window.authVerificado) {
                clearInterval(verificarAuth);
                if (window.usuarioAutenticado) {
                    criarTabela();
                }
                // Se não autenticado, auth.js já redirecionou
            }
        }, 50);

        // Timeout de segurança
        setTimeout(() => {
            clearInterval(verificarAuth);
        }, 2000);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarRegistrosTable);
} else {
    inicializarRegistrosTable();
}
