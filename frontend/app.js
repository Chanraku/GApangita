// GLOBAL STATE VARIABLES
let categorySelect = null;
let branchSelect = null;
let locationSelect = null;

let itemStream = null;
let userStream = null;
let claimStream = null;

const AppState = {
    pageSize: 15,
    currentPage: 1,
    lastTotal: 0,
    hasSearched: false,

    runSearch: null,

    isFormDirty: false,
    isHandlingModalNavigation: false,

    isAuthenticated: false,
    user: null
};

window.AppState = AppState;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {

    const resultsContainer = document.getElementById('resultsContainer');

    if (resultsContainer) {
            resultsContainer.addEventListener('click', (e) => {
                const card = e.target.closest('.item-card');
                if (!card) return;

                const item = JSON.parse(decodeURIComponent(card.dataset.item));
                showItemDetails(item);
            });
        }

    // Query DOM elements after page loads
    categorySelect = document.getElementById('categoryId');
    branchSelect = document.getElementById('branchId');
    locationSelect = document.getElementById('locationId');

    await checkAuth();
    if (document.getElementById('searchInput')) { initSearchAndFilters(); }

    await loadCategories();
    await loadBranches();

    initBranchLocationFilter();
    initUnsavedChangesTracker();
});