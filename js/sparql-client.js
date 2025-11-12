class SPARQLClient {
    constructor() {
        this.defaultGraph = '';
    }

    async query(sparqlQuery, format = 'json') {
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
                    'Accept': this.getAcceptHeader(format)
                },
                body: new URLSearchParams(params)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (format === 'json') {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error('SPARQL query error:', error);
            throw error;
        }
    }

    getAcceptHeader(format) {
        const acceptHeaders = {
            'json': 'application/sparql-results+json',
            'xml': 'application/sparql-results+xml',
            'csv': 'text/csv',
            'rdf': 'application/rdf+xml',
            'turtle': 'text/turtle'
        };
        return acceptHeaders[format] || 'application/sparql-results+json';
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

    async exportToRDF(sparqlQuery) {
        try {
            // For RDF export, we need to use CONSTRUCT queries
            // If it's a SELECT query, convert it to CONSTRUCT
            let rdfQuery = sparqlQuery;
            
            if (sparqlQuery.trim().toUpperCase().startsWith('SELECT')) {
                // Convert SELECT to CONSTRUCT to get RDF triples
                rdfQuery = this.convertSelectToConstruct(sparqlQuery);
            }
            
            // Execute query with RDF format
            return await this.query(rdfQuery, 'rdf');
        } catch (error) {
            console.error('RDF export error:', error);
            throw error;
        }
    }

    // Helper method to convert SELECT to CONSTRUCT
    convertSelectToConstruct(selectQuery) {
        // Simple conversion - creates a CONSTRUCT with all triple patterns from WHERE
        // This is a basic implementation and might need refinement for complex queries
        const constructMatch = selectQuery.match(/SELECT\s+(.*?)\s+WHERE\s*\{/is);
        if (constructMatch) {
            const whereClauseMatch = selectQuery.match(/WHERE\s*\{(.*?)\}(?:\s*(?:ORDER BY|LIMIT|OFFSET|$))/is);
            if (whereClauseMatch) {
                const whereClause = whereClauseMatch[1];
                return `CONSTRUCT { ${whereClause} } WHERE { ${whereClause} }`;
            }
        }
        
        // Fallback: return original query (might not work for RDF)
        return selectQuery;
    }

    // Method to detect query type
    getQueryType(query) {
        const trimmed = query.trim().toUpperCase();
        if (trimmed.startsWith('SELECT')) return 'SELECT';
        if (trimmed.startsWith('CONSTRUCT')) return 'CONSTRUCT';
        if (trimmed.startsWith('ASK')) return 'ASK';
        if (trimmed.startsWith('DESCRIBE')) return 'DESCRIBE';
        return 'UNKNOWN';
    }
}