class UIComponents {
    constructor() {
        this.sparqlClient = new SPARQLClient();
        this.currentResults = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
    }

    bindEvents() {
        // Query execution
        document.getElementById('runQuery').addEventListener('click', () => this.executeQuery());
        
        // Query formatting
        document.getElementById('formatQuery').addEventListener('click', () => this.formatQuery());
        
        // Query clearing
        document.getElementById('clearQuery').addEventListener('click', () => this.clearQuery());
        
        // Export buttons
        document.getElementById('exportCSV').addEventListener('click', () => this.exportResults('csv'));
        document.getElementById('exportJSON').addEventListener('click', () => this.exportResults('json'));
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    async executeQuery() {
        const query = document.getElementById('queryEditor').value.trim();
        
        if (!query) {
            this.showError('Please enter a SPARQL query');
            return;
        }

        this.showLoading();
        this.hideError();
        this.hideResults();

        try {
            const results = await this.sparqlClient.query(query);
            this.displayResults(results);
            this.currentResults = results;
            this.enableExportButtons();
        } catch (error) {
            this.showError(`Query execution failed: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    displayResults(results) {
        const tableContainer = document.getElementById('resultsTable');
        const placeholder = document.getElementById('resultsPlaceholder');
        
        placeholder.classList.add('hidden');
        tableContainer.classList.remove('hidden');
        
        if (!results?.head?.vars || !results?.results?.bindings) {
            tableContainer.innerHTML = '<p>No results found</p>';
            return;
        }

        const headers = results.head.vars;
        const rows = results.results.bindings;

        let html = '<table><thead><tr>';
        
        // Create header row
        headers.forEach(header => {
            html += `<th>${this.escapeHtml(header)}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Create data rows
        rows.forEach(row => {
            html += '<tr>';
            headers.forEach(header => {
                const cell = row[header];
                if (cell) {
                    const value = this.escapeHtml(cell.value);
                    const type = cell.type;
                    const displayValue = type === 'uri' ? 
                        `<a href="${value}" target="_blank" title="${value}">${this.truncateUrl(value)}</a>` : 
                        value;
                    html += `<td>${displayValue}</td>`;
                } else {
                    html += '<td></td>';
                }
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        tableContainer.innerHTML = html;
    }

    formatQuery() {
        const editor = document.getElementById('queryEditor');
        const formatted = this.sparqlClient.formatQuery(editor.value);
        editor.value = formatted;
    }

    clearQuery() {
        if (confirm('Are you sure you want to clear the query?')) {
            document.getElementById('queryEditor').value = '';
        }
    }

    exportResults(format) {
        if (!this.currentResults) return;

        let data, mimeType, extension;
        
        if (format === 'csv') {
            data = this.sparqlClient.exportToCSV(this.currentResults);
            mimeType = 'text/csv';
            extension = 'csv';
        } else {
            data = this.sparqlClient.exportToJSON(this.currentResults);
            mimeType = 'application/json';
            extension = 'json';
        }

        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sparql-results.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        this.saveSetting('theme', newTheme);
    }

    showLoading() {
        document.getElementById('loadingSpinner').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingSpinner').classList.add('hidden');
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }

    hideError() {
        document.getElementById('errorMessage').classList.add('hidden');
    }

    hideResults() {
        document.getElementById('resultsTable').classList.add('hidden');
        document.getElementById('resultsPlaceholder').classList.add('hidden');
    }

    enableExportButtons() {
        document.getElementById('exportCSV').disabled = false;
        document.getElementById('exportJSON').disabled = false;
    }

    handleKeyboardShortcuts(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.executeQuery();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.formatQuery();
        }
    }

    // Utility methods
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    truncateUrl(url, maxLength = 50) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength - 3) + '...';
    }

    saveSetting(key, value) {
        localStorage.setItem(`sparql_${key}`, value);
    }

    loadSetting(key, defaultValue) {
        return localStorage.getItem(`sparql_${key}`) || defaultValue;
    }

    loadSettings() {
        const theme = this.loadSetting('theme', 'light');
        document.documentElement.setAttribute('data-theme', theme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}