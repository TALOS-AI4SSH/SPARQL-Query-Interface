class UIComponents {
    constructor() {
        // this.sparqlClient = new SPARQLClient();
        this.currentResults = null;
        this.selectedDataset = null;
        this.datasets = this.getDatasetsConfig();
        this.sparqlClient = new SPARQLClient('https://triplestore.talos-ai4ssh.uoc.gr:8890/sparql');
        
        // Pagination and filtering state
        this.currentPage = 1;
        this.pageSize = 100;
        this.filterText = '';
        this.filteredResults = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
        this.populateDatasetSelect();
    }

    bindEvents() {
        // Query execution
        document.getElementById('runQuery').addEventListener('click', () => this.executeQuery());
        
        // Query clearing
        document.getElementById('clearQuery').addEventListener('click', () => this.clearQuery());
        
        // Export buttons
        document.getElementById('exportCSV').addEventListener('click', () => this.exportResults('csv'));
        document.getElementById('exportJSON').addEventListener('click', () => this.exportResults('json'));
		document.getElementById('exportRDF').addEventListener('click', () => this.exportResults('rdf'));
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Prefixes button
        document.getElementById('prefixesBtn').addEventListener('click', () => this.showPrefixesModal());
        
        // Dataset and example buttons
        document.getElementById('datasetSelect').addEventListener('change', (e) => this.onDatasetSelect(e));
        document.getElementById('loadDataset').addEventListener('click', () => this.loadSelectedDataset());
        document.getElementById('exampleSelect').addEventListener('change', (e) => this.onExampleSelect(e));
        document.getElementById('loadExample').addEventListener('click', () => this.loadSelectedExample());

        // Pagination and filtering events
        document.getElementById('prevPage').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPage').addEventListener('click', () => this.nextPage());
        document.getElementById('pageSize').addEventListener('change', (e) => this.changePageSize(e));
        document.getElementById('resultsFilter').addEventListener('input', (e) => this.filterResults(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Help button
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelpModal());
    }

    // === PREFIXES FUNCTIONALITY ===
    getCommonPrefixes() {
        return {
            'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
            'xsd': 'http://www.w3.org/2001/XMLSchema#',
            'owl': 'http://www.w3.org/2002/07/owl#',
            'dc': 'http://purl.org/dc/elements/1.1/',
            'foaf': 'http://xmlns.com/foaf/0.1/',
            'otv': 'http://www.ontologia.fr/OTB/otv#',
            'otb': 'http://www.ontologia.fr/OTB/',
            'ontolex': 'http://www.w3.org/ns/lemon/ontolex#',

            'skos': 'http://www.w3.org/2004/02/skos/core#',
            'dct': 'http://purl.org/dc/terms/',
            'schema': 'http://schema.org/',
            'geo': 'http://www.opengis.net/ont/geosparql#',
            'wgs': 'http://www.w3.org/2003/01/geo/wgs84_pos#'
        };
    }

    showPrefixesModal() {
        const prefixes = this.getCommonPrefixes();
        let modalHtml = `
            <div id="prefixesModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Select Prefixes to Insert</h3>
                        <button class="btn-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="prefixes-list">
        `;
        
        Object.keys(prefixes).forEach(prefix => {
            modalHtml += `
                <label class="prefix-checkbox">
                    <input type="checkbox" checked value="${prefix}">
                    <span class="prefix-name">${prefix}:</span>
                    <span class="prefix-uri">${prefixes[prefix]}</span>
                </label>
            `;
        });
        
        modalHtml += `
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="insertSelectedPrefixes" class="btn-primary">Insert Selected</button>
                        <button class="btn-secondary close-modal">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.bindPrefixesModalEvents();
    }

    bindPrefixesModalEvents() {
        const modal = document.getElementById('prefixesModal');
        const closeBtn = modal.querySelector('.btn-close');
        const closeModalBtn = modal.querySelector('.close-modal');
        const insertBtn = modal.querySelector('#insertSelectedPrefixes');
        
        const closeModal = () => modal.remove();
        
        closeBtn.addEventListener('click', closeModal);
        closeModalBtn.addEventListener('click', closeModal);
        
        insertBtn.addEventListener('click', () => {
            const selectedPrefixes = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked'))
                .map(checkbox => checkbox.value);
            this.insertSelectedPrefixes(selectedPrefixes);
            closeModal();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    insertSelectedPrefixes(selectedPrefixes) {
        const prefixes = this.getCommonPrefixes();
        let prefixesText = '';
        
        selectedPrefixes.forEach(prefix => {
            if (prefixes[prefix]) {
                prefixesText += `PREFIX ${prefix}: <${prefixes[prefix]}>\n`;
            }
        });
        
        if (prefixesText) {
            const editor = document.getElementById('queryEditor');
            const currentValue = editor.value;
            
            if (this.hasPrefixes(currentValue)) {
                const queryWithoutPrefixes = this.removeExistingPrefixes(currentValue);
                editor.value = prefixesText + '\n' + queryWithoutPrefixes;
            } else {
                editor.value = prefixesText + '\n' + currentValue;
            }
            
            editor.focus();
        }
    }

    hasPrefixes(query) {
        const prefixPattern = /PREFIX\s+\w+:\s*<[^>]+>/i;
        return prefixPattern.test(query);
    }

    removeExistingPrefixes(query) {
        return query.replace(/PREFIX\s+\w+:\s*<[^>]+>[\r\n]*/gi, '').trim();
    }

    // === DATASET AND EXAMPLES FUNCTIONALITY ===
    getDatasetsConfig() {
        return {
            'dataset1': {
                name: 'Göbekli Tepe Ontoterminology (v1.0)',
                description: 'Defines and represents the archaeological finds of T-Pillars in Göbekli Tepe, SE Turkey (-10000 to -8300 BCE) , in a machine-tractable way.',
                graphUri: 'https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Modeling-Archaeological-Site-Gobekli-Tepe-v1',
                endpoint: 'https://triplestore.talos-ai4ssh.uoc.gr/sparql/',
                examples: {
                    'query1': {
                        name: 'A list for the english terms and the definitions in natural language of the ontoterminology using OTV vocabulary.',
                        query: `PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX otv:  <http://www.ontologia.fr/OTB/otv#>

SELECT ?termName ?definition
FROM <https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Modeling-Archaeological-Site-Gobekli-Tepe-v1>
WHERE {
  ?concept rdf:type otv:Concept;
           otv:denotedByTerm ?term.
  ?term    otv:language        ?lg;
           otv:termName        ?termName;
           otv:termDefinition  ?definition.
  FILTER (?lg = "en")
}
ORDER BY ?termName
LIMIT 10
`
                    }
                }
            },
            'dataset2': {
                name: 'ALyrA Ontoterminology (v1.0)',
                description: 'A modelling of Archaic Lyric poets (799-430 BCΕ)',
                graphUri: 'https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Ancient-Lyric-Poetry-ALyrA-v1',
                endpoint: 'https://triplestore.talos-ai4ssh.uoc.gr/sparql/',
                examples: {
                    'query1': {
                        name: 'What is an “hymn” and which Archaic Lyric poets/poetesses have composed “hymns”?',
                        query: `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX alyra: <http://www.ontologia.fr/OTB/ALyrA_v.1.0#>
PREFIX otv: <http://www.ontologia.fr/OTB/otv#>

SELECT ?definition ?authorName ?centuryOfLiving 
FROM <https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Ancient-Lyric-Poetry-ALyrA-v1>
WHERE {    
    ?x rdfs:label "hymn"@en.
    ?x skos:definition ?definition.
          FILTER(langMatches(lang(?definition), "en"))
    ?y otv:instanceOf ?x;
          alyra:isWrittenBy ?author.
    ?author rdfs:label ?authorName;
            alyra:centuryOfLiving ?c.
    ?c rdfs:label ?centuryOfLiving.
}
ORDER BY ?centuryOfLiving`
                    },
                    'query2': {
                        name: 'Who was Pindar?',
                        query: `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX alyra: <http://www.ontologia.fr/OTB/ALyrA_v.1.0#>

SELECT ?propertyName ?value
FROM <https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Ancient-Lyric-Poetry-ALyrA-v1>
WHERE {
  	alyra:pindarus_boeotus ?x ?y .
  	?x rdfs:label ?propertyName .
  	?y rdfs:label ?value .
  	FILTER(LANG(?value) = 'en')
}
ORDER BY ?value`
                    },
                    'query3': {
                        name: 'Which is the four-digit "Thesaurus Linguae Graecae" identifying number of each Archaic Lyric composer?',
                        query: `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX alyra: <http://www.ontologia.fr/OTB/ALyrA_v.1.0#>
PREFIX otv: <http://www.ontologia.fr/OTB/otv#>

SELECT ?nameOfComposer ?tljNumber
FROM <https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Ancient-Lyric-Poetry-ALyrA-v1>

WHERE {
?x rdfs:subClassOf* alyra:Archaic_Lyric_Composer.
?y otv:instanceOf* ?x.
?y rdfs:label ?nameOfComposer;
   	alyra:tlgIdentifyingNumber ?tljNumber}`
                    },
                    'query4': {
                        name: 'Which are the What is the place where most Ancient Greek lyric composers were born and who were they?',
                        query: `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX otv: <http://www.ontologia.fr/OTB/otv#>
PREFIX alyra: <http://www.ontologia.fr/OTB/ALyrA_v.1.0#>

SELECT ?place ?coordinates ?poetLabel ?resourcePoet
FROM <https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Ancient-Lyric-Poetry-ALyrA-v1>

WHERE {
  {
    SELECT ?place (COUNT(?y) AS ?count)
    WHERE {
      ?x rdfs:subClassOf* alyra:Archaic_Lyric_Composer.
      ?y otv:instanceOf ?x.
      ?y alyra:bornIn ?p.
      ?p rdfs:label ?place.
    }
    GROUP BY ?place
    ORDER BY DESC(?count)
    LIMIT 1
  }
  ?x rdfs:subClassOf* alyra:Archaic_Lyric_Composer.
  ?y otv:instanceOf ?x.
  ?y alyra:bornIn ?p.
  ?p rdfs:label ?place.
  OPTIONAL { ?p alyra:pleiadesCoordinates ?coordinates. }
  ?y rdfs:label ?poetLabel.
  OPTIONAL {
    SELECT ?y (SAMPLE(?resource) AS ?resourcePoet)
    WHERE {
      ?y rdfs:seeAlso ?resource.
      FILTER(CONTAINS(LCASE(STR(?resource)), "perseus:author"))
    }
    GROUP BY ?y
  }
}
ORDER BY ?poetLabel`
                    },
                    'query5': {
                        name: 'Which are the different Archaic Lyric poems and what differentiates each of them?',
                        query: `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX alyra: <http://www.ontologia.fr/OTB/ALyrA_v.1.0#>
PREFIX otv: <http://www.ontologia.fr/OTB/otv#>

SELECT ?poems ?difference ?definition
FROM <https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Ancient-Lyric-Poetry-ALyrA-v1>
WHERE {    
       ?x rdfs:subClassOf* alyra:Archaic_Lyric_Poem;
             rdfs:label ?poems;
             otv:ownDifference ?y;
	skos:definition ?definition.
       ?y rdfs:label ?difference
FILTER (lang(?poems) = 'en')
FILTER (lang(?definition) = 'en')
}`
                    }
                }
            },
            'dataset3': {
                name: 'LACRIMALit Ontology (v1.0)',
                description: 'Representations of crisis events and their semantic relations, enabling structured exploration of ancient historiography.',
                graphUri: 'https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/LACRIMALit-Modeling-Events-Classical-Period-v1',
                endpoint: 'https://triplestore.talos-ai4ssh.uoc.gr/sparql/',
                examples: {
                    'query1': {
                        name: 'What are the different types of political crises?',
                        query: `PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX lac:  <http://ontologia.fr/OTB/lac#>

SELECT DISTINCT ?crisisName
WHERE {
  ?crisis rdfs:subClassOf* lac:Political_Crisis.
  ?crisis rdfs:label ?crisisName.
  FILTER (lang(?crisisName) = 'en')
}
ORDER BY ?crisisName`
                    },
                    'query2': {
                        name: 'Where did the sedition of Corfu take place?',
                        query: `PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX lac:  <http://ontologia.fr/OTB/lac#>

SELECT DISTINCT ?locationName
FROM <https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/LACRIMALit-Modeling-Events-Classical-Period-v1>
WHERE {
  ?sedition rdf:type lac:Sedition;
            rdfs:label ?seditionLabel;
            lac:location ?location.
  ?location rdfs:label ?locationName.

  # match label case-insensitively to avoid exact-case issues
  FILTER(LANG(?locationName) = 'en')
  FILTER(LANG(?seditionLabel) = 'en')
  FILTER(LCASE(STR(?seditionLabel)) = LCASE("sedition of Corfu"))
}`
                    },
                    'query3': {
                        name: 'Who are the protagonists of the sedition of Corfu?',
                        query: `PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX lac:  <http://ontologia.fr/OTB/lac#>

SELECT DISTINCT ?protagonistName
FROM <https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/LACRIMALit-Modeling-Events-Classical-Period-v1>
WHERE {
  ?sedition rdf:type lac:Sedition;
            rdfs:label ?slabel;
            lac:agent ?protagonist.
  ?protagonist rdfs:label ?protagonistName.

  FILTER(LANG(?slabel) = 'en')
  FILTER(LANG(?protagonistName) = 'en')
  FILTER(LCASE(STR(?slabel)) = LCASE("sedition of Corfu"))
}
ORDER BY ?protagonistName`
                    },
                    'query4': {
                        name: 'What are the relevant terms denoting crises (military, political etc.)?',
                        query: `PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX lac:  <http://ontologia.fr/OTB/lac#>

SELECT DISTINCT ?term
WHERE {
  ?subClassOfCrisis rdfs:subClassOf* lac:Crisis;
                    rdfs:label ?term.
  FILTER (LANG(?term) = 'en')
}
ORDER BY ?term`
                    },
                    'query5': {
                        name: 'Who served the function of Prytan at the trial of the generals of the Arginusae battle?',
                        query: `PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX lac:  <http://ontologia.fr/OTB/lac#>

SELECT DISTINCT ?whoName
FROM <https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/LACRIMALit-Modeling-Events-Classical-Period-v1>
WHERE {
  ?evtTrial a lac:Trial ;
            rdfs:label ?trialLabel ;
            (lac:beginDate|lac:startDate) ?beginDateTrial ;
            (lac:endDate|lac:finishDate)  ?endDateTrial .

  FILTER ( LANG(?trialLabel) = 'en' )
  FILTER ( CONTAINS(LCASE(STR(?trialLabel)),
                    "trial of generals after the battle of arginusae") )

  ?function a lac:Political_Function ;
            rdfs:label ?funcLabel .
  FILTER ( LANG(?funcLabel) = 'en' )
  FILTER ( CONTAINS(LCASE(STR(?funcLabel)), "prytan") )

  ?evtPerfFct a lac:Performed_Function ;
              lac:function ?function ;
              lac:agent ?who ;
              (lac:beginDate|lac:startDate) ?beginDateFunction ;
              (lac:endDate|lac:finishDate)  ?endDateFunction .

  ?who foaf:name ?whoName .
  FILTER ( LANG(?whoName) = 'en' )

  FILTER ( ?beginDateTrial >= ?beginDateFunction &&
           ?endDateTrial   <= ?endDateFunction )
}
ORDER BY ?whoName`
                    }
                }
            },
            'dataset4': {
                name: 'Ontoterminology of Hellenistic Events (v1.0)',
                description: 'Version 1.0 of an ontoterminology that models events of the Hellenistic World (323–31 BC).',
                graphUri: 'https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Modeling-Events-Hellenistic-Period-v1',
                endpoint: 'https://triplestore.talos-ai4ssh.uoc.gr/sparql/',
                examples: {
                    'query1': {
                        name: 'Who are the agents of the “Wars of the Successors”?',
                        query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX events: <http://www.ontologia.fr/OTB/Events-hellenistic-v.1.0#>
PREFIX otv: <http://www.ontologia.fr/OTB/otv#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

SELECT DISTINCT ?definition ?agentExLabel 
FROM <https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Modeling-Events-Hellenistic-Period-v1>
WHERE {
  ?warURI  rdfs:label "war"@en; 
         skos:definition ?definition.
  FILTER(langMatches(lang(?definition), "en"))
  ?warEx rdfs:label "wars of the succesors"@en;
         events:hasAgent ?agentEx.
  ?agentEx rdfs:label ?agentExLabel.
}
ORDER BY?agentExLabel`
                    },
                    'query2': {
                        name: 'Who are the agents of the “Battle of Artaxata”, as well as the location and the sources?',
                        query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX events: <http://www.ontologia.fr/OTB/Events-hellenistic-v.1.0#>
PREFIX otv: <http://www.ontologia.fr/OTB/otv#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

SELECT DISTINCT ?definition ?agentExLabel ?locationExLabel 
?sourceExLabel
FROM <https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Modeling-Events-Hellenistic-Period-v1>

WHERE { 
  ?battleURI    rdfs:label "battle"@en.
  ?battleURI skos:definition ?definition.
          FILTER(langMatches(lang(?definition), "en"))
?battleEx rdfs:label "battle of artaxata" @en.
?battleEx events:hasAgent ?agentEx.
?agentEx rdfs:label ?agentExLabel.
?battleEx events:hasLocation ?locationEx.
?locationEx rdfs:label ?locationExLabel.
?battleEx events:appearesInTheSourceOf ?sourceEx.
?sourceEx rdfs:label ?sourceExLabel.
}`
                    }
                }
            },
            'dataset5': {
                name: 'Ancient Greek and Chinese Philosophers Ontology (v1.0)',
                description: 'Version 1.0 of an ontoterminology that models Ancient Greek philosophers, their philosophical production, and their spatial and temporal positioning.',
                graphUri: 'https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Ancient-Greek-Chinese-Philosophers-v1',
                endpoint: 'https://triplestore.talos-ai4ssh.uoc.gr/sparql/',
                examples: {
                    'query1': {
                        name: 'Which ancient Greek philosophers were born or stayed in Athens?',
                        query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX ont: <http://www.ontologia.fr/OTB/Philosophers#>
PREFIX otv: <http://www.ontologia.fr/OTB/otv#>

SELECT ?name ?school ?century
FROM <https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Ancient-Greek-Chinese-Philosophers-v1>

WHERE {
  {?x otv:instanceOf ont:Ancient-Greek-Philosopher;
         ont:birthPlace ont:athens;
          rdfs:label ?name;
          ont:centuryOfLiving ?t.
    ?t rdfs:label ?century }
  UNION
  {?x otv:instanceOf ont:Ancient-Greek-Philosopher;
        ont:stayedIn ont:athens;
        rdfs:label ?name;
        ont:centuryOfLiving ?t.
    ?t rdfs:label ?century }
  OPTIONAL 
{?x ont:memberOfPhilosophicalSchool ?y.
    ?y rdfs:label ?school.
  FILTER (lang(?school) = "en") }
  FILTER (lang(?name) = "en") }
ORDER BY ASC(?name)`
                    },
                    'query2': {
                        name: 'Who were the Ancient Greek Pythagoreans from Tarentum, in which century did they live, and were they referenced in any philosophical works?',
                        query: `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX ont: <http://www.ontologia.fr/OTB/Philosophers#>
PREFIX otv: <http://www.ontologia.fr/OTB/otv#>

SELECT ?name ?century ?mentionedByPhilosophicalWork
FROM <https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Ancient-Greek-Chinese-Philosophers-v1>

WHERE {
  ?x otv:instanceOf ont:Ancient-Greek-Philosopher;
     ont:memberOfPhilosophicalSchool ont:pythagorean_school;
     ont:birthPlace ont:tarentum;
     rdfs:label ?name;
     ont:centuryOfLiving ?t.
  ?t rdfs:label ?century.
  
  OPTIONAL {
    ?x ont:mentionedBy ?y.
    ?y rdfs:label ?mentionedByPhilosophicalWork.
    FILTER (lang(?mentionedByPhilosophicalWork) = "en")
  }
  FILTER (lang(?name) = "en")
}
ORDER BY ?name`
                    },
                    'query3': {
                        name: 'Which are Aristotle\'s philosophical works and what related resources are associated with them in the current ontoterminology?',
                        query: `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX ont: <http://www.ontologia.fr/OTB/Philosophers#>
PREFIX otv: <http://www.ontologia.fr/OTB/otv#>

SELECT ?OfPhilosophicalWork ?resources
FROM <https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Ancient-Greek-Chinese-Philosophers-v1>

WHERE {
  ont:aristotle ont:authorOf ?y.
  ?y rdfs:seeAlso ?resources;
     otv:denotedByProperName ?x.
  ?x otv:properName ?OfPhilosophicalWork.
  FILTER (CONTAINS(STR(?x), "_en"))
}
ORDER BY ?OfPhilosophicalWork`
                    },
                    'query4': {
                        name: 'Which of Plato\'s philosophical dialogues mention Hippias of Elis, and which other philosophers are referenced in those dialogues?',
                        query: `PREFIX ont: <http://www.ontologia.fr/OTB/Philosophers#>
PREFIX otv: <http://www.ontologia.fr/OTB/otv#>

SELECT ?PhilosophicalWork ?nameOfPhilosopher
FROM <https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Ancient-Greek-Chinese-Philosophers-v1>

WHERE {
  ont:plato ont:authorOf ?y.
  ?y ont:mentions ont:hippias_of_elis;
     ont:mentions ?x.
  ?y otv:denotedByProperName ?titleOfWork.
  ?titleOfWork otv:properName ?PhilosophicalWork.
  ?x otv:denotedByProperName ?name.
  ?name otv:properName ?nameOfPhilosopher.
  FILTER (CONTAINS(STR(?titleOfWork), "en"))
  FILTER (CONTAINS(STR(?name), "en"))
}
ORDER BY ?OfPhilosophicalWork`
                    },
                    'query5': {
                        name: 'Which philosophers have authored philosophical work “On Nature”?',
                        query: `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX ont: <http://www.ontologia.fr/OTB/Philosophers#>
PREFIX otv: <http://www.ontologia.fr/OTB/otv#>

SELECT ?name ?century ?mentionedByPhilosophicalWork
FROM <https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Ancient-Greek-Chinese-Philosophers-v1>

WHERE {
  ?x otv:instanceOf ont:Ancient-Greek-Philosopher;
     ont:memberOfPhilosophicalSchool ont:pythagorean_school;
     ont:birthPlace ont:tarentum;
     rdfs:label ?name;
     ont:centuryOfLiving ?t.
  ?t rdfs:label ?century.
  
  OPTIONAL {
    ?x ont:mentionedBy ?y.
    ?y rdfs:label ?mentionedByPhilosophicalWork.
    FILTER (lang(?mentionedByPhilosophicalWork) = "en")
  }
  FILTER (lang(?name) = "en")
}
ORDER BY ?name`
                    }
                }
            },
            'dataset9': {
                name: 'Ancient Oratory Ontology (v1.0)',
                description: 'An ontoterminology (a terminology whose conceptual system is a formal ontology, Roche 2007) defining the primary legal proceedings in Classical Athenian courts (419–323 BC).',
                graphUri: 'https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Ancient-Oratory-v1',
                endpoint: 'https://triplestore.talos-ai4ssh.uoc.gr/sparql/',
                examples: {
                    'query1': {
                        name: '',
                        query: ``
                    }
                }
            },
            'dataset10': {
                name: 'Ontology of Legal Bodies in Classical Athens (v1.0)',
                description: 'An ontoterminology (a terminology whose conceptual system is a formal ontology, Roche 2007) defining the primary legal bodies in Classical Athenian courts (419–323 BC).',
                graphUri: 'https://triplestore.talos-ai4ssh.uoc.gr:8890/datasets/Legal-Bodies-Classical-Athens-v1',
                endpoint: 'https://triplestore.talos-ai4ssh.uoc.gr/sparql/',
                examples: {
                    'query1': {
                        name: '',
                        query: ``
                    }
                }
            }
        };
    }

    populateDatasetSelect() {
        const select = document.getElementById('datasetSelect');
        if (!select) return;
        
        select.innerHTML = '<option value="">-- Choose a dataset --</option>';
        
        Object.keys(this.datasets).forEach(datasetId => {
            const dataset = this.datasets[datasetId];
            const option = document.createElement('option');
            option.value = datasetId;
            option.textContent = dataset.name;
            select.appendChild(option);
        });
    }

    onDatasetSelect(event) {
        const datasetId = event.target.value;
        const loadBtn = document.getElementById('loadDataset');
        
        if (datasetId) {
            loadBtn.disabled = false;
            this.showDatasetInfo(datasetId);
        } else {
            loadBtn.disabled = true;
            this.hideDatasetInfo();
        }
    }

    showDatasetInfo(datasetId) {
        const dataset = this.datasets[datasetId];
        const descriptionEl = document.getElementById('datasetDescription');
        if (!descriptionEl) return;
        
        descriptionEl.innerHTML = `
            <h4>${dataset.name}</h4>
            <p><strong>Description:</strong> ${dataset.description}</p>
            <p><strong>Graph URI:</strong> <code>${dataset.graphUri}</code></p>
        `;
    }

    hideDatasetInfo() {
        const descriptionEl = document.getElementById('datasetDescription');
        if (descriptionEl) descriptionEl.innerHTML = '';
    }

    loadSelectedDataset() {
        const datasetId = document.getElementById('datasetSelect').value;
        if (!datasetId) return;
        
        this.selectedDataset = this.datasets[datasetId];
        
        // Update SPARQL client configuration
        this.sparqlClient.setEndpoint(this.selectedDataset.endpoint);
        this.sparqlClient.setDefaultGraph(this.selectedDataset.graphUri);
        
        // Enable examples section
        this.populateExamplesSelect(datasetId);
        const examplesSection = document.querySelector('.examples-selector');
        if (examplesSection) examplesSection.classList.remove('hidden');
        
        const exampleSelect = document.getElementById('exampleSelect');
        if (exampleSelect) exampleSelect.disabled = false;
        
        this.showDatasetLoadSuccess(this.selectedDataset.name);
    }

    showDatasetLoadSuccess(datasetName) {
        console.log(`Dataset "${datasetName}" loaded successfully`);
        
        const descriptionEl = document.getElementById('datasetDescription');
        if (!descriptionEl) return;
        
        const originalContent = descriptionEl.innerHTML;
        descriptionEl.innerHTML = originalContent + 
            `<p class="success-message"><i class="fas fa-check"></i> Dataset loaded successfully!</p>`;
        
        setTimeout(() => {
            if (descriptionEl.innerHTML.includes('success-message')) {
                descriptionEl.innerHTML = originalContent;
            }
        }, 3000);
    }

    populateExamplesSelect(datasetId) {
        const select = document.getElementById('exampleSelect');
        const loadBtn = document.getElementById('loadExample');
        if (!select || !loadBtn) return;
        
        select.innerHTML = '<option value="">-- Select an example query --</option>';
        select.disabled = false;
        loadBtn.disabled = true;
        
        const dataset = this.datasets[datasetId];
        Object.keys(dataset.examples).forEach(exampleId => {
            const example = dataset.examples[exampleId];
            const option = document.createElement('option');
            option.value = exampleId;
            option.textContent = example.name;
            select.appendChild(option);
        });
    }

    onExampleSelect(event) {
        const exampleId = event.target.value;
        const loadBtn = document.getElementById('loadExample');
        if (loadBtn) loadBtn.disabled = !exampleId;
    }

    loadSelectedExample() {
        const datasetId = document.getElementById('datasetSelect').value;
        const exampleId = document.getElementById('exampleSelect').value;
        
        if (!datasetId || !exampleId) return;
        
        const example = this.datasets[datasetId].examples[exampleId];
        const editor = document.getElementById('queryEditor');
        
        editor.value = example.query;
    }

    // === PAGINATION AND FILTERING FUNCTIONALITY ===
    changePageSize(event) {
        this.pageSize = parseInt(event.target.value);
        this.currentPage = 1;
        if (this.currentResults) {
            this.displayResults(this.currentResults);
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.displayResults(this.currentResults);
        }
    }

    nextPage() {
        const totalPages = this.getTotalPages();
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.displayResults(this.currentResults);
        }
    }

    filterResults(event) {
        this.filterText = event.target.value.toLowerCase().trim();
        this.currentPage = 1;
        
        if (this.currentResults) {
            this.applyFilter();
            this.displayResults(this.currentResults);
        }
    }

    applyFilter() {
        if (!this.filterText) {
            this.filteredResults = null;
            return;
        }

        const allResults = this.currentResults.results.bindings;
        this.filteredResults = allResults.filter(row => {
            return Object.values(row).some(cell => 
                cell && cell.value && cell.value.toLowerCase().includes(this.filterText)
            );
        });
    }

    getTotalPages() {
        const totalItems = this.filteredResults ? 
            this.filteredResults.length : 
            this.currentResults.results.bindings.length;
        return Math.ceil(totalItems / this.pageSize);
    }

    getCurrentPageData() {
        const allData = this.filteredResults || this.currentResults.results.bindings;
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        return allData.slice(startIndex, endIndex);
    }

    updatePaginationControls() {
        const totalItems = this.filteredResults ? 
            this.filteredResults.length : 
            this.currentResults.results.bindings.length;
        const totalPages = this.getTotalPages();
        
        const startItem = ((this.currentPage - 1) * this.pageSize) + 1;
        const endItem = Math.min(this.currentPage * this.pageSize, totalItems);
        
        // Update pagination info
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            if (totalItems === 0) {
                paginationInfo.textContent = 'No results';
            } else {
                let filterInfo = '';
                if (this.filteredResults && this.filterText) {
                    const originalTotal = this.currentResults.results.bindings.length;
                    filterInfo = ` (filtered from ${originalTotal})`;
                }
                paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems}${filterInfo}`;
            }
        }
        
        // Update button states
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
    }

    // === CORE QUERY FUNCTIONALITY ===
    async executeQuery() {
        const query = document.getElementById('queryEditor').value.trim();
        
        if (!query) {
            this.showError('Please enter a SPARQL query');
            return;
        }

        // Validate FROM clause against dataset graph URI if dataset is loaded
        if (this.selectedDataset) {
            const validationResult = this.validateFromClause(query, this.selectedDataset.graphUri);
            if (!validationResult.isValid) {
                this.showError(validationResult.message);
                return;
            }
        }

        // Reset pagination and filtering
        this.currentPage = 1;
        this.filterText = '';
        this.filteredResults = null;
        
        // Clear filter input
        const filterInput = document.getElementById('resultsFilter');
        if (filterInput) filterInput.value = '';
        
        this.showLoading();
        this.hideError();
        this.hideResults();

        try {
            const results = await this.sparqlClient.query(query);
            this.displayResults(results);
            this.currentResults = results;
        } catch (error) {
            this.showError(`Query execution failed: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    // === QUERY VALIDATION METHODS ===
    validateFromClause(query, datasetGraphUri) {
        // Check if query contains FROM clauses
        const fromClauses = this.extractFromClauses(query);
        
        if (fromClauses.length === 0) {
            // No FROM clauses - query will use the default graph
            return { isValid: true };
        }
        
        // Check if any FROM clause matches the dataset graph URI
        const hasMatchingFromClause = fromClauses.some(fromUri => 
            this.urisMatch(fromUri, datasetGraphUri)
        );
        
        if (!hasMatchingFromClause) {
            return {
                isValid: false,
                message: `Query FROM clause does not match the loaded dataset.\n\n` +
                        `Loaded dataset URI: ${datasetGraphUri}\n` +
                        `Query FROM clause(s): ${fromClauses.join(', ')}\n\n` +
                        `Please update your query to use: FROM <${datasetGraphUri}> or remove the FROM clause to use the default dataset.`
            };
        }
        
        return { isValid: true };
    }

    extractFromClauses(query) {
        // More robust FROM clause extraction that handles different formats
        const fromRegex = /FROM\s+<([^>]+)>/gi;
        const clauses = [];
        let match;
        
        // Remove comments first to avoid matching commented FROM clauses
        const queryWithoutComments = query.replace(/#[^\n]*\n?/g, '');
        
        while ((match = fromRegex.exec(queryWithoutComments)) !== null) {
            clauses.push(match[1].trim());
        }
        
        return clauses;
    }

    urisMatch(uri1, uri2) {
        // Normalize URIs for comparison
        const normalizeUri = (uri) => {
            return uri
                .replace(/\/+$/, '') // Remove trailing slashes
                .toLowerCase()
                .trim();
        };
        
        const normalized1 = normalizeUri(uri1);
        const normalized2 = normalizeUri(uri2);
        
        console.log('Comparing URIs:', { uri1: normalized1, uri2: normalized2 });
        
        // Check exact match
        if (normalized1 === normalized2) {
            return true;
        }
        
        // Check if one URI is a parent directory of the other
        if (normalized1.startsWith(normalized2) || normalized2.startsWith(normalized1)) {
            return true;
        }
        
        return false;
    }

    showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        // Format the message with line breaks
        const formattedMessage = message.replace(/\n/g, '<br>');
        errorElement.innerHTML = formattedMessage;
        errorElement.classList.remove('hidden');
        
        // Scroll to error message
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    displayResults(results) {
        const tableContainer = document.getElementById('resultsTable');
        const placeholder = document.getElementById('resultsPlaceholder');
        
        if (!tableContainer || !placeholder) return;
        
        placeholder.classList.add('hidden');
        tableContainer.classList.remove('hidden');
        
        // Store the original results
        this.currentResults = results;
        
        // Apply filtering if needed
        if (this.filterText) {
            this.applyFilter();
        }
        
        const currentData = this.getCurrentPageData();
        const totalItems = this.filteredResults ? 
            this.filteredResults.length : 
            results.results.bindings.length;
        
        if (!results?.head?.vars || totalItems === 0) {
            let message = 'No results found';
            if (this.filterText && totalItems === 0) {
                message = `No results match "${this.filterText}"`;
            }
            tableContainer.innerHTML = `<div class="no-results">${message}</div>`;
            this.updatePaginationControls();
            this.enableExportButtons();
            return;
        }

        const headers = results.head.vars;
        const rows = currentData;

        let html = '<table><thead><tr>';
        
        // Create header row
        headers.forEach(header => {
            html += `<th>${this.escapeHtml(header)}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Create data rows with highlighting
        rows.forEach(row => {
            html += '<tr>';
            headers.forEach(header => {
                const cell = row[header];
                if (cell) {
                    let value = this.escapeHtml(cell.value);
                    const type = cell.type;
                    
                    // Apply highlighting if filter text exists
                    if (this.filterText && value.toLowerCase().includes(this.filterText)) {
                        const regex = new RegExp(`(${this.escapeRegex(this.filterText)})`, 'gi');
                        value = value.replace(regex, '<span class="highlight">$1</span>');
                    }
                    
                    const displayValue = type === 'uri' ? 
                        `<a href="${this.escapeHtml(cell.value)}" target="_blank" title="${this.escapeHtml(cell.value)}">${this.truncateUrl(value)}</a>` : 
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
        
        // Update pagination controls
        this.updatePaginationControls();
        this.enableExportButtons();
    }

    clearQuery() {
        if (confirm('Are you sure you want to clear the query?')) {
            const editor = document.getElementById('queryEditor');
            if (editor) editor.value = '';
        }
    }

    exportResults(format) {
		if (!this.currentResults) return;

	    // For RDF format, we need to execute the query again with RDF format
  		if (format === 'rdf') {
    	    this.exportRDFResults();
        	return;
 	   }

 		let data, mimeType, extension;
    
    // Export filtered data if filter is active
    	const resultsToExport = this.filteredResults ? {
       		head: this.currentResults.head,
        	results: { bindings: this.filteredResults }
    	} : this.currentResults;
    
    	if (format === 'csv') {
        	data = this.sparqlClient.exportToCSV(resultsToExport);
        	mimeType = 'text/csv';
        	extension = 'csv';
    	} else {
        	data = this.sparqlClient.exportToJSON(resultsToExport);
        	mimeType = 'application/json';
        	extension = 'json';
    	}

    	this.downloadFile(data, mimeType, extension);
	}

	async exportRDFResults() {
    	const query = document.getElementById('queryEditor').value.trim();
    
    	if (!query) {
        	this.showError('No query to export as RDF');
        	return;
    	}

    	this.showLoading();
    
    	try {
        	const rdfData = await this.sparqlClient.exportToRDF(query);
        
        	// Include filter info in filename if filter is active
        	let filename = 'sparql-results';
        	if (this.filterText) {
            	filename += `-filtered-${this.filterText}`;
        	}
        
        	this.downloadFile(rdfData, 'application/rdf+xml', 'rdf');
    	} catch (error) {
        	this.showError(`RDF export failed: ${error.message}`);
    	} finally {
        	this.hideLoading();
    	}
	}

	// Helper method for file download
	downloadFile(data, mimeType, extension) {
    	const blob = new Blob([data], { type: mimeType });
    	const url = URL.createObjectURL(blob);
    	const a = document.createElement('a');
    	a.href = url;
    
    	// Include filter info in filename if filter is active
    	let filename = 'sparql-results';
    	if (this.filterText) {
        	filename += `-filtered-${this.filterText}`;
    	}
    	a.download = `${filename}.${extension}`;
    
    	document.body.appendChild(a);
    	a.click();
    	document.body.removeChild(a);
    	URL.revokeObjectURL(url);
	}

    // === UI STATE MANAGEMENT ===
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        this.saveSetting('theme', newTheme);
    }

    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.classList.remove('hidden');
    }

    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.classList.add('hidden');
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    hideError() {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) errorElement.classList.add('hidden');
    }

    hideResults() {
        const table = document.getElementById('resultsTable');
        const placeholder = document.getElementById('resultsPlaceholder');
        if (table) table.classList.add('hidden');
        if (placeholder) placeholder.classList.add('hidden');
    }

    enableExportButtons() {
        const csvBtn = document.getElementById('exportCSV');
        const jsonBtn = document.getElementById('exportJSON');
        const rdfBtn = document.getElementById('exportRDF');

        if (csvBtn) csvBtn.disabled = false;
        if (jsonBtn) jsonBtn.disabled = false;
        if (rdfBtn) rdfBtn.disabled = false;
    }

    // === UTILITY METHODS ===
    handleKeyboardShortcuts(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.executeQuery();
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    // Add the help modal method:
    showHelpModal() {
        const helpModal = document.getElementById('helpModal');
        if (helpModal) {
            helpModal.classList.remove('hidden');
            this.bindHelpModalEvents();
        }
    }

    bindHelpModalEvents() {
        const helpModal = document.getElementById('helpModal');
        const closeBtn = helpModal.querySelector('.btn-close');
        const closeHelpBtn = helpModal.querySelector('.close-help');
        
        const closeModal = () => helpModal.classList.add('hidden');
        
        closeBtn.addEventListener('click', closeModal);
        closeHelpBtn.addEventListener('click', closeModal);
        
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) closeModal();
        });
        
        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !helpModal.classList.contains('hidden')) {
                closeModal();
            }
        });
    }
}