<p align="center">
  <img src="images/talos_logo.png" alt="TALOS AI4SSH logo" width="220">
</p>

<h1 align="center">TALOS SPARQL Query Interface</h1>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License: Apache 2.0"></a>
  <img src="https://img.shields.io/badge/SPARQL-1.1-orange.svg" alt="SPARQL 1.1">
  <img src="https://img.shields.io/badge/JavaScript-vanilla-yellow.svg" alt="Vanilla JavaScript">
  <img src="https://img.shields.io/badge/build-none%20required-brightgreen.svg" alt="No build required">
</p>

The **TALOS SPARQL Query Interface** is a browser-based application for exploring and querying the knowledge graphs of the [TALOS AI4SSH Lab](https://www.talos-lab.eu/) using SPARQL.

The interface is designed to make TALOS research data accessible to researchers in **Digital Humanities**, the **Semantic Web**, and **AI for the Social Sciences and Humanities (AI4SSH)**, including researchers who are new to SPARQL. Each configured dataset includes a description and a collection of example queries, while query results can be inspected, filtered, paginated, and exported.

The application is implemented in plain HTML, CSS, and JavaScript and does not require a frontend framework or build step.

---

## Datasets

The interface currently provides access to seven TALOS knowledge graphs:

- **Göbekli Tepe Ontoterminology (v1.0)**: archaeological finds associated with the T-Pillars of Göbekli Tepe, southeastern Turkey (ca. 10,000–8,300 BCE).
- **ALyrA Ontoterminology (v1.0)**: Archaic Lyric poets and poetry (799–430 BCE).
- **LACRIMALit Ontology (v1.0)**: crisis events and their semantic relations in ancient historiography.
- **Ontoterminology of Hellenistic Events (v1.0)**: historical events of the Hellenistic world.
- **Ancient Greek and Chinese Philosophers Ontology (v1.0)**: Ancient Greek philosophers, their philosophical production, and their spatial and temporal positioning.
- **Ancient Oratory Ontology (v1.0)**: primary legal proceedings in Classical Athenian courts (419–323 BCE).
- **Ontology of Legal Bodies in Classical Athens (v1.0)**: primary legal bodies in Classical Athenian courts (419–323 BCE).

---

## Features

- **Interactive SPARQL query editor**
- **Dataset selection and metadata preview**
- **Dataset-specific example queries**
- **SPARQL prefix management**
- **Dataset-aware graph-scope checking**
- **Result pagination and client-side filtering**
- **CSV, JSON, and RDF export**
- **Light and dark themes**
- **Keyboard shortcuts**
- **Built-in Help and Instructions modal**

### Dataset-aware graph-scope checking

When a dataset is selected, its named graph is configured as the default graph for query execution.

If a query contains an explicit `FROM <graphURI>` clause, the interface checks it against the graph URI of the selected dataset before execution. A detected mismatch stops execution and displays an explanatory message. Queries without an explicit `FROM` clause use the selected dataset as the default graph.

This is a lightweight consistency check intended to reduce accidental graph-selection errors; it is not an access-control mechanism or a complete SPARQL parser.

---

## Getting Started

The application is static and can be served using any standard web server.

### Folder structure

```text
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── sparql-client.js
│   ├── ui-components.js
│   └── app.js
└── images/
    ├── talos_logo.png
    └── background.png
```

### Run locally

Using Node.js:

```bash
npm install
npm run dev
```

This starts a local server and opens the app in your browser.

Alternatively, any static web server works, for example with Python:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

### Deploy

Upload the files, keeping the folder structure above, to any static web host (for example GitHub Pages, Netlify, or a standard web server).

---

## SPARQL Endpoint

The app sends queries to the TALOS triplestore:

```
https://triplestore.talos-ai4ssh.uoc.gr/sparql/
```

To use a different endpoint, change:

- the default endpoint in `js/sparql-client.js` (`this.endpoint`), and
- the `endpoint` value of each dataset in `getDatasetsConfig()` in `js/ui-components.js`, since the endpoint is set from the selected dataset when it loads.

---

## Architecture

The application follows a **modular, client-side architecture** and is split into the following parts:

- **`index.html`**: the page layout, including the dataset selector and description panel, the query editor with a default SPARQL template, the results table with pagination and filtering, the export controls (CSV / JSON / RDF), the Help modal, and the theme toggle.
- **`js/app.js`**: starts the application, checks browser compatibility (`fetch` API), and handles global errors and promise rejections.
- **`js/sparql-client.js`**: the SPARQL communication layer. It sends queries to the endpoint via POST requests, supports multiple result formats (JSON, CSV, RDF, Turtle), handles default graph URIs, and converts `SELECT` queries to `CONSTRUCT` for RDF export. It also includes helpers for pagination and query formatting.
- **`js/ui-components.js`**: the main UI controller. It holds the dataset configuration and example queries, populates the dataset and example menus, manages the query lifecycle (loading, results, errors), handles pagination and client-side filtering, the prefix insertion modal, exports, theme persistence, keyboard shortcuts, and the Help modal.
- **`css/style.css`**: color variables and typography, light and dark themes, responsive layout for mobile and desktop, and styling for buttons, tables, modals, and forms.

---

## Help

To ask a question, report a problem, or suggest an improvement, please open an issue in this repository or contact the [TALOS AI4SSH Lab](https://www.talos-lab.eu/). Bug reports are very welcome.

---

## License

This project is licensed under the [Apache License, Version 2.0](LICENSE).

---

## Contribution

Contributions are welcome. Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in this project shall be licensed under the Apache License, Version 2.0, without any additional terms or conditions.

---

## Developer

Developed by **[Maria Schoinaki](https://github.com/MariaSchoinaki)** for the [TALOS AI4SSH Lab](https://www.talos-lab.eu/).
