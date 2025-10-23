class SPARQLApp {
    constructor() {
        this.ui = new UIComponents();
        this.init();
    }

    init() {
        console.log('SPARQL Query Interface initialized');
        this.checkCompatibility();
    }

    checkCompatibility() {
        if (!window.fetch) {
            alert('Your browser does not support fetch API. Please update your browser.');
            return false;
        }
        return true;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SPARQLApp();
});

// Error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});