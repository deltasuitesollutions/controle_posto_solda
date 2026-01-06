// Gerenciamento de Filtros
class FiltersManager {
    constructor() {
        this.activeFilters = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateActiveFiltersDisplay();
    }

    setupEventListeners() {
        // Filtros de input
        const filterInputs = document.querySelectorAll('.filter-input');
        filterInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.applyFilter(e.target.dataset.filter, e.target.value);
            });
        });

        // Filtros de select
        const filterSelects = document.querySelectorAll('.filter-select');
        filterSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.applyFilter(e.target.dataset.filter, e.target.value);
            });
        });

        // Botão de limpar filtros
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Botão de aplicar filtros
        const applyFiltersBtn = document.getElementById('apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyAllFilters();
            });
        }

        // Quick filters dropdown
        const quickFiltersToggle = document.getElementById('quick-filters-toggle');
        const quickFiltersMenu = document.getElementById('quick-filters-menu');
        if (quickFiltersToggle && quickFiltersMenu) {
            quickFiltersToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                quickFiltersMenu.classList.toggle('show');
            });

            // Fechar ao clicar fora
            document.addEventListener('click', () => {
                quickFiltersMenu.classList.remove('show');
            });
        }

        // Actions dropdown
        const actionsToggle = document.getElementById('actions-toggle');
        const actionsMenu = document.getElementById('actions-menu');
        if (actionsToggle && actionsMenu) {
            actionsToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                actionsMenu.classList.toggle('show');
            });

            // Fechar ao clicar fora
            document.addEventListener('click', () => {
                actionsMenu.classList.remove('show');
            });
        }
    }

    applyFilter(filterName, value) {
        if (value && value.trim() !== '') {
            this.activeFilters[filterName] = value;
        } else {
            delete this.activeFilters[filterName];
        }
        this.updateActiveFiltersDisplay();
        this.notifyFiltersChanged();
    }

    clearFilter(filterName) {
        delete this.activeFilters[filterName];
        // Limpar o input correspondente
        const input = document.querySelector(`[data-filter="${filterName}"]`);
        if (input) {
            input.value = '';
        }
        this.updateActiveFiltersDisplay();
        this.notifyFiltersChanged();
    }

    clearAllFilters() {
        this.activeFilters = {};
        // Limpar todos os inputs
        document.querySelectorAll('.filter-input, .filter-select').forEach(input => {
            input.value = '';
        });
        this.updateActiveFiltersDisplay();
        this.notifyFiltersChanged();
    }

    applyAllFilters() {
        // Coletar valores de todos os filtros
        document.querySelectorAll('.filter-input, .filter-select').forEach(input => {
            const filterName = input.dataset.filter;
            const value = input.value;
            if (filterName && value && value.trim() !== '') {
                this.activeFilters[filterName] = value;
            } else if (filterName) {
                delete this.activeFilters[filterName];
            }
        });
        this.updateActiveFiltersDisplay();
        this.notifyFiltersChanged();
    }

    updateActiveFiltersDisplay() {
        const container = document.getElementById('active-filters');
        if (!container) return;

        container.innerHTML = '';

        Object.entries(this.activeFilters).forEach(([name, value]) => {
            if (value && value.trim() !== '') {
                const badge = document.createElement('span');
                badge.className = 'filter-badge';
                badge.innerHTML = `
                    ${this.getFilterLabel(name)}: ${value}
                    <span class="remove" data-filter="${name}">×</span>
                `;
                badge.querySelector('.remove').addEventListener('click', () => {
                    this.clearFilter(name);
                });
                container.appendChild(badge);
            }
        });
    }

    getFilterLabel(filterName) {
        const labels = {
            'data': 'Data',
            'funcionario': 'Funcionário',
            'modelo': 'Modelo',
            'posto': 'Posto',
            'turno': 'Turno',
            'inicio': 'Início',
            'fim': 'Fim'
        };
        return labels[filterName] || filterName;
    }

    getActiveFilters() {
        return { ...this.activeFilters };
    }

    notifyFiltersChanged() {
        // Disparar evento customizado para que outros módulos possam reagir
        const event = new CustomEvent('filtersChanged', {
            detail: { filters: this.getActiveFilters() }
        });
        document.dispatchEvent(event);
    }
}

// Inicializar quando o DOM estiver pronto
let filtersManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        filtersManager = new FiltersManager();
    });
} else {
    filtersManager = new FiltersManager();
}

