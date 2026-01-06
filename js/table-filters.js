class TableFilters {
    constructor(registrosTable) {
        this.registrosTable = registrosTable;
        this.activeFilters = {
            posto: [],
            turno: [],
            data: [],
            produto: [],
            matricula: [],
            operador: []
        };
        this.allValues = {
            posto: new Set(),
            turno: new Set(),
            data: new Set(),
            produto: new Set(),
            matricula: new Set(),
            operador: new Set()
        };
        this.currentSortMode = 'az';
        this.init();
    }

    init() {
        this.createFilterModal();
        this.setupFilterButtons();
    }

    setupFilterButtons() {
        const setup = () => this.setupTopFilters();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setup);
        } else {
            setTimeout(setup, 100);
        }
        
        document.addEventListener('tableRendered', () => {
            Object.keys(this.allValues).forEach(key => {
                this.allValues[key] = new Set();
            });
        });
    }

    setupTopFilters() {
        document.querySelectorAll('.filter-modal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const columnName = btn.dataset.filterColumn;
                this.openFilterModal(columnName, document.getElementById(`filter-${columnName}`));
            });
        });
        
        document.querySelectorAll('.filter-modal-trigger').forEach(input => {
            input.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openFilterModal(input.dataset.filterColumn, input);
            });
        });
    }

    createFilterModal() {
        if (document.getElementById('filter-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'filter-modal';
        modal.className = 'filter-modal';
        modal.innerHTML = `
            <div class="filter-modal-content">
                <div class="filter-modal-header">
                    <h3 class="filter-modal-title" id="filter-modal-title">Filtrar</h3>
                    <button class="filter-modal-close" id="filter-modal-close">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="filter-modal-body">
                    <div class="filter-sort-buttons">
                        <button class="filter-sort-btn" id="filter-sort-az" data-sort="az" title="Classificar A-Z">
                            <i class="bi bi-sort-alpha-down"></i> A-Z
                        </button>
                        <button class="filter-sort-btn" id="filter-sort-za" data-sort="za" title="Classificar Z-A">
                            <i class="bi bi-sort-alpha-down-alt"></i> Z-A
                        </button>
                    </div>
                    <div class="filter-search-container">
                        <input type="text" 
                               id="filter-search-input" 
                               class="filter-search-input" 
                               placeholder="Pesquisar">
                        <i class="bi bi-search filter-search-icon"></i>
                    </div>
                    <div class="filter-options-container" id="filter-options-container">
                        <!-- Opções serão inseridas aqui -->
                    </div>
                </div>
                <div class="filter-modal-footer">
                    <button class="filter-btn filter-btn-secondary" id="filter-select-all">
                        (Selecionar Tudo)
                    </button>
                    <div class="filter-modal-actions">
                        <button class="filter-btn filter-btn-cancel" id="filter-btn-cancel">
                            Cancelar
                        </button>
                        <button class="filter-btn filter-btn-ok" id="filter-btn-ok">
                            OK
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('filter-modal-close').addEventListener('click', () => this.closeFilterModal());
        document.getElementById('filter-btn-cancel').addEventListener('click', () => this.closeFilterModal());
        document.getElementById('filter-btn-ok').addEventListener('click', () => this.applyFilter());
        document.getElementById('filter-select-all').addEventListener('click', () => this.toggleSelectAll());
        
        document.getElementById('filter-sort-az').addEventListener('click', (e) => {
            e.stopPropagation();
            this.setSortMode('az');
        });
        document.getElementById('filter-sort-za').addEventListener('click', (e) => {
            e.stopPropagation();
            this.setSortMode('za');
        });
        
        document.getElementById('filter-search-input').addEventListener('input', (e) => this.filterOptions(e.target.value));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeFilterModal();
        });
    }

    openFilterModal(columnName, triggerElement) {
        const modal = document.getElementById('filter-modal');
        const title = document.getElementById('filter-modal-title');
        const optionsContainer = document.getElementById('filter-options-container');
        const searchInput = document.getElementById('filter-search-input');
        
        this.currentColumn = columnName;
        this.currentTrigger = triggerElement;
        this.currentSortMode = 'az';
        
        const columnLabels = {
            'posto': 'POSTO',
            'turno': 'TURNO',
            'data': 'DATA',
            'produto': 'Produto',
            'matricula': 'MATRÍCULA',
            'operador': 'OPERADOR'
        };
        title.textContent = `Filtrar por ${columnLabels[columnName] || columnName}`;
        
        this.collectColumnValues(columnName);
        this.renderFilterOptions(columnName);
        searchInput.value = '';
        this.updateSortButtons();
        modal.classList.add('active');
        setTimeout(() => searchInput.focus(), 100);
    }

    collectColumnValues(columnName) {
        const values = new Set();
        let registros = [];
        
        if (this.registrosTable) {
            registros = this.registrosTable.registros && this.registrosTable.registros.length > 0 
                ? this.registrosTable.registros 
                : (this.registrosTable.filteredRegistros || []);
        }
        
        if (registros.length === 0) {
            console.warn('Nenhum registro disponível para coletar valores. Carregue os registros primeiro.');
            return;
        }
        
        registros.forEach(reg => {
            let value = null;
            
            switch(columnName) {
                case 'posto':
                    value = reg.posto;
                    break;
                case 'turno':
                    value = reg.turno ? `${reg.turno}` : null;
                    break;
                case 'data':
                    value = reg.data;
                    break;
                case 'produto':
                    value = reg.modelo?.codigo || reg.modelo?.descricao;
                    break;
                case 'matricula':
                    value = reg.funcionario?.matricula;
                    break;
                case 'operador':
                    value = reg.funcionario?.nome;
                    break;
            }
            
            if (value !== null && value !== undefined && value !== '') {
                values.add(String(value));
            }
        });
        
        this.allValues[columnName] = values;
    }

    renderFilterOptions(columnName, searchTerm = '') {
        const container = document.getElementById('filter-options-container');
        if (!container) {
            console.error('Container de opções não encontrado');
            return;
        }
        
        if (!this.allValues[columnName] || this.allValues[columnName].size === 0) {
            container.innerHTML = '<div style="padding: 12px; color: #666;">Nenhum valor disponível</div>';
            return;
        }
        
        let values = Array.from(this.allValues[columnName])
            .filter(value => !searchTerm || value.toLowerCase().includes(searchTerm.toLowerCase()));
        
        values = this.sortValues(values, columnName);
        
        const activeFilters = this.activeFilters[columnName] || [];
        const allSelected = values.length > 0 && values.every(v => activeFilters.includes(v));
        
        let html = `
            <label class="filter-option-item filter-select-all-item">
                <input type="checkbox" 
                       class="filter-checkbox filter-select-all-checkbox" 
                       ${allSelected ? 'checked' : ''}>
                <span class="filter-option-label">(Selecionar Tudo)</span>
            </label>
        `;
        
        if (columnName === 'data') {
            html += this.renderDateOptions(values, activeFilters);
        } else {
            values.forEach(value => {
                const isChecked = activeFilters.includes(value);
                html += `
                    <label class="filter-option-item">
                        <input type="checkbox" 
                               class="filter-checkbox" 
                               value="${this.escapeHtml(value)}"
                               ${isChecked ? 'checked' : ''}>
                        <span class="filter-option-label">${this.escapeHtml(value)}</span>
                    </label>
                `;
            });
        }
        
        container.innerHTML = html;
        
        container.querySelectorAll('.filter-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.classList.contains('filter-select-all-checkbox')) {
                    this.handleSelectAllChange(e.target.checked, values);
                } else {
                    this.handleOptionChange(e.target.value, e.target.checked, columnName);
                }
            });
        });
    }

    renderDateOptions(values, activeFilters) {
        const grouped = {};
        values.forEach(date => {
            let day, month, year;
            if (date.includes('/')) {
                const parts = date.split('/');
                if (parts.length === 3) {
                    day = parts[0];
                    month = parts[1];
                    year = parts[2];
                } else return;
            } else if (date.includes('-')) {
                const parts = date.split('-');
                if (parts.length === 3) {
                    year = parts[0];
                    month = parts[1];
                    day = parts[2];
                } else return;
            } else return;
            
            if (!grouped[year]) grouped[year] = {};
            if (!grouped[year][month]) grouped[year][month] = [];
            if (!grouped[year][month].includes(day)) {
                grouped[year][month].push(day);
            }
        });
        
        let html = '';
        const years = Object.keys(grouped).sort((a, b) => b - a);
        
        years.forEach(year => {
            const yearChecked = Object.values(grouped[year]).every(month => 
                month.every(day => activeFilters.includes(`${day}/${Object.keys(grouped[year])[0]}/${year}`))
            );
            
            html += `
                <div class="filter-date-group">
                    <label class="filter-option-item filter-date-group-header">
                        <input type="checkbox" 
                               class="filter-checkbox filter-year-checkbox" 
                               data-year="${year}"
                               ${yearChecked ? 'checked' : ''}>
                        <span class="filter-option-label">${year}</span>
                    </label>
                    <div class="filter-date-subgroup">
            `;
            
            const months = Object.keys(grouped[year]).sort((a, b) => b - a);
            months.forEach(month => {
                const monthNames = {
                    '01': 'janeiro', '02': 'fevereiro', '03': 'março', '04': 'abril',
                    '05': 'maio', '06': 'junho', '07': 'julho', '08': 'agosto',
                    '09': 'setembro', '10': 'outubro', '11': 'novembro', '12': 'dezembro'
                };
                
                const monthChecked = grouped[year][month].every(day => 
                    activeFilters.includes(`${day}/${month}/${year}`)
                );
                
                html += `
                    <label class="filter-option-item filter-date-month-header">
                        <input type="checkbox" 
                               class="filter-checkbox filter-month-checkbox" 
                               data-year="${year}"
                               data-month="${month}"
                               ${monthChecked ? 'checked' : ''}>
                        <span class="filter-option-label">${monthNames[month]}</span>
                    </label>
                    <div class="filter-date-days">
                `;
                
                grouped[year][month].sort((a, b) => parseInt(a) - parseInt(b)).forEach(day => {
                    const dayPadded = String(day).padStart(2, '0');
                    const monthPadded = String(month).padStart(2, '0');
                    const fullDate = `${dayPadded}/${monthPadded}/${year}`;
                    const isChecked = activeFilters.includes(fullDate) || 
                                     activeFilters.includes(`${day}/${month}/${year}`) ||
                                     activeFilters.includes(date);
                    html += `
                        <label class="filter-option-item filter-date-day">
                            <input type="checkbox" 
                                   class="filter-checkbox filter-day-checkbox" 
                                   value="${this.escapeHtml(fullDate)}"
                                   ${isChecked ? 'checked' : ''}>
                            <span class="filter-option-label">${dayPadded}</span>
                        </label>
                    `;
                });
                
                html += `</div>`;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    handleSelectAllChange(checked, values) {
        const checkboxes = document.querySelectorAll('.filter-checkbox:not(.filter-select-all-checkbox)');
        checkboxes.forEach(cb => {
            cb.checked = checked;
            if (checked) {
                const value = cb.value;
                if (value && !this.activeFilters[this.currentColumn].includes(value)) {
                    this.activeFilters[this.currentColumn].push(value);
                }
            } else {
                const value = cb.value;
                if (value) {
                    this.activeFilters[this.currentColumn] = this.activeFilters[this.currentColumn].filter(v => v !== value);
                }
            }
        });
    }

    handleOptionChange(value, checked, columnName) {
        if (checked) {
            if (!this.activeFilters[columnName].includes(value)) {
                this.activeFilters[columnName].push(value);
            }
        } else {
            this.activeFilters[columnName] = this.activeFilters[columnName].filter(v => v !== value);
        }
        this.updateSelectAllCheckbox();
    }

    updateSelectAllCheckbox() {
        const allCheckboxes = Array.from(document.querySelectorAll('.filter-checkbox:not(.filter-select-all-checkbox)'));
        const checkedCheckboxes = allCheckboxes.filter(cb => cb.checked);
        const selectAllCheckbox = document.querySelector('.filter-select-all-checkbox');
        
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = allCheckboxes.length > 0 && checkedCheckboxes.length === allCheckboxes.length;
        }
    }

    toggleSelectAll() {
        const selectAllCheckbox = document.querySelector('.filter-select-all-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = !selectAllCheckbox.checked;
            this.handleSelectAllChange(selectAllCheckbox.checked, Array.from(this.allValues[this.currentColumn]));
        }
    }

    filterOptions(searchTerm) {
        this.renderFilterOptions(this.currentColumn, searchTerm);
    }

    setSortMode(mode) {
        if (!this.currentColumn) {
            return;
        }
        
        this.currentSortMode = mode;
        this.updateSortButtons();
        const searchInput = document.getElementById('filter-search-input');
        const searchTerm = searchInput ? searchInput.value : '';
        this.renderFilterOptions(this.currentColumn, searchTerm);
    }

    updateSortButtons() {
        document.querySelectorAll('.filter-sort-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.sort === this.currentSortMode) {
                btn.classList.add('active');
            }
        });
    }

    sortValues(values, columnName) {
        switch(this.currentSortMode) {
            case 'az':
                return values.sort((a, b) => {
                    if (columnName === 'data') {
                        return new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'));
                    }
                    return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
                });
            case 'za':
                return values.sort((a, b) => {
                    if (columnName === 'data') {
                        return new Date(b.split('/').reverse().join('-')) - new Date(a.split('/').reverse().join('-'));
                    }
                    return b.localeCompare(a, 'pt-BR', { sensitivity: 'base' });
                });
            default:
                return values.sort((a, b) => a.localeCompare(b, 'pt-BR'));
        }
    }

    applyFilter() {
        if (this.registrosTable && typeof this.registrosTable.applyAdvancedFilters === 'function') {
            this.registrosTable.applyAdvancedFilters(this.activeFilters);
        }
        this.updateFilterIndicator();
        this.closeFilterModal();
    }

    updateFilterIndicator() {
        if (!this.currentTrigger || !this.currentColumn) return;
        
        const activeCount = this.activeFilters[this.currentColumn]?.length || 0;
        const totalCount = this.allValues[this.currentColumn]?.size || 0;
        const inputElement = document.getElementById(`filter-${this.currentColumn}`);
        const buttonElement = document.querySelector(`.filter-modal-btn[data-filter-column="${this.currentColumn}"]`);
        
        if (inputElement) {
            if (activeCount === 0) {
                inputElement.value = '';
                inputElement.placeholder = 'Selecione';
            } else if (activeCount === totalCount) {
                inputElement.value = `Todos (${totalCount})`;
            } else {
                inputElement.value = `${activeCount} selecionado(s)`;
            }
        }
        
        if (buttonElement) {
            if (activeCount > 0 && activeCount < totalCount) {
                buttonElement.classList.add('filter-active');
                buttonElement.setAttribute('data-filter-count', activeCount);
            } else {
                buttonElement.classList.remove('filter-active');
                buttonElement.removeAttribute('data-filter-count');
            }
        }
    }

    closeFilterModal() {
        const modal = document.getElementById('filter-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.currentColumn = null;
        this.currentHeader = null;
    }

    clearFilter(columnName) {
        if (this.activeFilters[columnName]) {
            this.activeFilters[columnName] = [];
        }
        if (this.registrosTable && typeof this.registrosTable.applyAdvancedFilters === 'function') {
            this.registrosTable.applyAdvancedFilters(this.activeFilters);
        }
        
        const inputElement = document.getElementById(`filter-${columnName}`);
        const buttonElement = document.querySelector(`.filter-modal-btn[data-filter-column="${columnName}"]`);
        
        if (inputElement) {
            inputElement.value = '';
            inputElement.placeholder = 'Selecione';
        }
        
        if (buttonElement) {
            buttonElement.classList.remove('filter-active');
            buttonElement.removeAttribute('data-filter-count');
        }
    }

    clearAllFilters() {
        Object.keys(this.activeFilters).forEach(key => {
            this.activeFilters[key] = [];
        });
        if (this.registrosTable && typeof this.registrosTable.applyAdvancedFilters === 'function') {
            this.registrosTable.applyAdvancedFilters(this.activeFilters);
        }
        
        document.querySelectorAll('.filter-modal-btn').forEach(btn => {
            btn.classList.remove('filter-active');
            btn.removeAttribute('data-filter-count');
        });
        
        document.querySelectorAll('.filter-modal-trigger').forEach(input => {
            input.value = '';
            input.placeholder = 'Selecione';
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

window.TableFilters = TableFilters;

