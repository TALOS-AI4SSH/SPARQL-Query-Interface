class SPARQLClient {
    constructor() {
        this.endpoint = 'https://triplestore.talos-ai4ssh.uoc.gr/sparql/';
        this.defaultGraph = '';
    }

    async query(sparqlQuery, format = 'json') {
        const url = new URL(this.endpoint);
        const params = {
            query: sparqlQuery,
            format: format
        };

        if (this.defaultGraph) {
            params['default-graph-uri'] = this.defaultGraph;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/sparql-results+json'
                },
                body: new URLSearchParams(params)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('SPARQL query error:', error);
            throw error;
        }
    }

    setEndpoint(url) {
        this.endpoint = url;
    }

    async queryWithPagination(sparqlQuery, limit = 10000, offset = 0) {
        const paginatedQuery = `${sparqlQuery} LIMIT ${limit} OFFSET ${offset}`;
        return await this.query(paginatedQuery);
    }

    setDefaultGraph(uri) {
        this.defaultGraph = uri;
    }

    // Helper method to format SPARQL query
    formatQuery(query) {
        return query
            .replace(/\s+/g, ' ')
            .replace(/([{}])/g, '\n$1\n')
            .replace(/\s*\.\s*/g, ' .\n')
            .replace(/\s*;\s*/g, ' ;\n')
            .trim();
    }

    // Export results to different formats
    exportToCSV(results) {
        if (!results?.head?.vars || !results?.results?.bindings) {
            return '';
        }

        const headers = results.head.vars;
        const rows = results.results.bindings;

        const csvHeaders = headers.join(',');
        const csvRows = rows.map(row => 
            headers.map(header => {
                const value = row[header]?.value || '';
                // Escape quotes and wrap in quotes if contains comma
                const escaped = value.replace(/"/g, '""');
                return value.includes(',') ? `"${escaped}"` : escaped;
            }).join(',')
        );

        return [csvHeaders, ...csvRows].join('\n');
    }

    exportToJSON(results) {
        return JSON.stringify(results, null, 2);
    }
}