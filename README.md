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

The TALOS SPARQL Query Interface is a web application for exploring the knowledge graphs of the [TALOS AI4SSH Lab](https://talos-ai4ssh.uoc.gr/) with **SPARQL queries**.

Its goal is to make TALOS research data accessible to researchers in **Digital Humanities**, **Semantic Web**, and **AI4SSH**, including those who are new to SPARQL. Each dataset comes with a description and ready-made example queries, and results can be filtered, browsed, and exported.

The application is written in plain HTML, CSS, and JavaScript. It has no dependencies and needs no build step.

---

## Datasets

The interface currently provides access to the following TALOS knowledge graphs:

- **Göbekli Tepe Ontoterminology (v1.0)**: the archaeological finds of T-Pillars in Göbekli Tepe, SE Turkey (10000 to 8300 BCE).
- **ALyrA Ontoterminology (v1.0)**: Archaic Lyric poets (799 to 430 BCE).
- **LACRIMALit Ontology (v1.0)**: crisis events and their semantic relations in ancient historiography.
- **Ontoterminology of Hellenistic Events (v1.0)**: events of the Hellenistic world (323 to 31 BC).
- **Ancient Greek and Chinese Philosophers Ontology (v1.0)**: philosophers, their works, and their place in space and time.
- **Ancient Oratory Ontology (v1.0)**: the primary legal proceedings in Classical Athenian courts (419 to 323 BC).
- **Ontology of Legal Bodies in Classical Athens (v1.0)**: the primary legal bodies in Classical Athenian courts (419 to 323 BC).

---

## Features

- **Interactive SPARQL editor**
- **Dataset selection & metadata preview**
- **Predefined example queries per dataset**
- **Prefix management modal**
- **Result pagination & filtering**
- **Export results** to CSV, JSON, and RDF
- **Light / Dark theme toggle**
- **Keyboard shortcuts**
- **Built-in Help & Instructions modal**

---

## Getting Started

The app only needs to be served from a web server rather than opened directly as a file.

### Folder structure

The files must be arranged like this, because `index.html` loads them from these folders:

```
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

To ask a question, report a problem, or suggest an improvement, please open an issue in this repository or contact the [TALOS AI4SSH Lab](https://talos-ai4ssh.uoc.gr/). Bug reports are very welcome.

---

## License

This project is licensed under the [Apache License, Version 2.0](LICENSE).

---

## Contribution

Contributions are welcome. Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in this project shall be licensed under the Apache License, Version 2.0, without any additional terms or conditions.

---

## Developer

Developed by **Maria Schoinaki** for the [TALOS AI4SSH Lab](https://talos-ai4ssh.uoc.gr/).
