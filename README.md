# TALOS SPARQL Query Interface

This repository contains the source code for the **TALOS SPARQL Query Interface**, a web-based application that enables interactive exploration of TALOS datasets through **SPARQL queries**.

The interface is designed to support researchers in **Digital Humanities**, **Semantic Web**, and **AI4SSH**, offering an intuitive way to query, explore, filter, and export results from multiple TALOS knowledge graphs.

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
- **Built-in **Help & Instructions modal**

---

## Application Architecture

The application follows a **modular, client-side architecture** using plain JavaScript, HTML, and CSS.

### Core Components

| File | Description |
|----|----|
| `index.html` | Main application layout and UI structure |
| `style.css` | Styling, theming (light/dark), and responsive design |
| `app.js` | Application bootstrap and compatibility checks |
| `sparql-client.js` | SPARQL communication layer |
| `ui-components.js` | UI logic, dataset handling, and user interactions |

---

## 📁 File Overview

### `index.html`
Defines the user interface structure:
- Dataset selector & description panel
- Query editor with default SPARQL template
- Results table with pagination and filtering
- Export controls (CSV / JSON / RDF)
- Help modal and theme toggle

---

### `app.js`
Responsible for:
- Initializing the application
- Browser compatibility checks (`fetch` API)
- Global error and promise rejection handling

---

### `sparql-client.js`
Encapsulates all SPARQL endpoint communication:

**Key responsibilities:**
- Execute SPARQL queries via POST requests
- Support multiple result formats (JSON, CSV, RDF, Turtle)
- Handle default graph URIs
- Convert `SELECT` queries to `CONSTRUCT` for RDF export
- Provide helpers for pagination and query formatting

---

### `ui-components.js`
The main UI controller, handling:

- Dataset configuration & metadata
- Dynamic population of datasets and example queries
- Query execution lifecycle (loading, results, errors)
- Pagination and client-side filtering
- Prefix insertion modal
- Export functionality
- Theme persistence and keyboard shortcuts
- Help modal logic

---

### `style.css`
Defines:
- Color variables and typography
- Light and dark theme support
- Responsive layout for mobile and desktop
- Component styling (buttons, tables, modals, forms)
