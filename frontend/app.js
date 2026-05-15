const API_BASE_URL = 'http://localhost:5000/api';
const SAFE_ITEM_TYPES = ['lost', 'found'];

let categorySelect = null;
let branchSelect = null;
let locationSelect = null;

let pageSize = 15;
let currentPage = 1;
let lastTotal = 0;

let isFormDirty = false;
let isHandlingModalNavigation = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Query DOM elements after page loads
    categorySelect = document.getElementById('categoryId');
    branchSelect = document.getElementById('branchId');
    locationSelect = document.getElementById('locationId');
    
    checkAuth();
    initSearchAndFilters();

    await loadCategories();
    await loadBranches();

    initBranchLocationFilter();
    initUnsavedChangesTracker();
});

// Search functionality
function initSearchAndFilters() {
    const searchInput = document.getElementById('searchInput');
    const searchDescInput = document.getElementById('searchDescInput');
    const resultsContainer = document.getElementById('resultsContainer');

    const filterPill = document.querySelector('.filter-pill');
    const filterTrack = document.querySelector('.filter-pill__track');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    const pagePill = document.querySelector('.page-pill');
    const pageTrack = document.querySelector('.page-pill__track');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageNumberEl = document.getElementById('pageNumber');

    let selectedItemType = '';

    function positionFilterTrack(activeButton) {
        if (!filterPill || !filterTrack || !activeButton) return;
        const buttonRect = activeButton.getBoundingClientRect();
        const pillRect = filterPill.getBoundingClientRect();

        filterTrack.style.width = `${buttonRect.width}px`;
        filterTrack.style.left = `${buttonRect.left - pillRect.left}px`;
    }

    function positionPageTrack(activeButton) {
        if (!pagePill || !pageTrack || !activeButton) return;
        const buttonRect = activeButton.getBoundingClientRect();
        const pillRect = pagePill.getBoundingClientRect();

        pageTrack.style.width = `${buttonRect.width}px`;
        pageTrack.style.left = `${buttonRect.left - pillRect.left}px`;
    }

    pagePill?.addEventListener('click', (e) => {
        const btn = e.target.closest('.page-btn');
        if (!btn) return;

        document.querySelectorAll('.page-btn')
            .forEach(b => b.classList.remove('active'));

        btn.classList.add('active');

        pageSize = parseInt(btn.textContent.trim(), 10);
        currentPage = 1;

        requestAnimationFrame(() => {
            positionPageTrack(btn);
        });

        runSearch();
    });
    

    function updatePageUI() {
        const totalPages = Math.ceil(lastTotal / pageSize) || 1;

        pageNumberEl.textContent = currentPage;
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;

        const pagination = document.getElementById('pages');

        if (lastTotal === 0 || totalPages <= 1) {
            pagination.style.display = 'none';
        } else {
            pagination.style.display = 'flex';
        }
    }

    const initialPageActive =
    document.querySelector('.page-btn.active') ||
    document.querySelector('.page-btn');

    if (initialPageActive) {
        requestAnimationFrame(() => {
            positionPageTrack(initialPageActive);
        });
    }

    function syncPaginationUI() {
        const pagination = document.getElementById('pages');
        const totalPages = Math.max(1, Math.ceil(lastTotal / pageSize));

        if (lastTotal === 0 || totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }
        if (currentPage > 1) {
            currentPage = 1;
        }

        pagination.style.display = 'flex';

        pageNumberEl.textContent = currentPage;
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
    }

    prevBtn?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updatePageUI();
            runSearch();
        }
    });

    nextBtn?.addEventListener('click', () => {
        const totalPages = Math.ceil(lastTotal / pageSize);

        if (currentPage < totalPages) {
            currentPage++;
            updatePageUI();
            runSearch();
        }
    });

    const runSearch = debounce(async () => {
        if (!resultsContainer || !searchInput) return;

        const query = searchInput?.value.trim() || '';
        const description = searchDescInput?.value.trim() || '';

        const category = categorySelect?.value || '';
        const branch = branchSelect?.value || '';
        const location = locationSelect?.value || '';

        if (
            query.length < 2 &&
            description.length < 2 &&
            !category &&
            !branch &&
            !location
        ) {
            resultsContainer.innerHTML =
                '<p>Type at least 2 characters or choose a filter.</p>';

            return;
        }

        try {
            resultsContainer.innerHTML = '<p>Searching...</p>';
            const params = new URLSearchParams();
            if (query) params.append('name_q', query);
            if (description) params.append('desc_q', description);
            if (selectedItemType) params.append('filter', selectedItemType);
            if (category) params.append('category_id', category);
            if (branch) params.append('branch_id', branch);
            if (location) params.append('location_id', location);
            params.append('limit', pageSize);
            params.append('page', currentPage);

            const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`, { credentials: 'include' });
            const data = await response.json();

            lastTotal = data.total;
            const totalPages = Math.ceil(data.total / pageSize) || 0;

            if (currentPage > totalPages) {
                currentPage = totalPages;
            }

            displayResults(data.items, resultsContainer);
            updatePageUI();
            syncPaginationUI();

            const pagination = document.getElementById('pages');
            
        } catch (error) {
            console.error('Error fetching search results:', error);
            resultsContainer.innerHTML = '<p style="color: red;">Failed to load results. Is the backend running?</p>';
        }
    }, 300);

    categorySelect?.addEventListener('change', () => {
        currentPage = 1;
        runSearch();
    });

    branchSelect?.addEventListener('change', () => {
        currentPage = 1;
        runSearch();
    });

    locationSelect?.addEventListener('change', () => {
        currentPage = 1;
        runSearch();
    });

    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                selectedItemType = button.textContent.trim().toLowerCase();
                if (selectedItemType === 'all') selectedItemType = '';
                positionFilterTrack(button);
                runSearch();
            });
        });

        const initialActive = document.querySelector('.filter-btn.active') || filterButtons[0];
        if (initialActive) {
            positionFilterTrack(initialActive);
        }

        window.addEventListener('resize', () => {
            const activeButton = document.querySelector('.filter-btn.active');
            if (activeButton) positionFilterTrack(activeButton);
        });
    }

    searchInput.addEventListener('input', () => {
        currentPage = 1;
        runSearch();
    });
    searchDescInput.addEventListener('input', () => {
        currentPage = 1;
        runSearch();
    });
}

function displayResults(items, resultsContainer) {
    if (!items || items.length === 0) {
        resultsContainer.innerHTML = '<p>No items found.</p>';
        return;
    }

    resultsContainer.innerHTML = items.map(item => {
        const safeType = SAFE_ITEM_TYPES.includes(item.item_type)
            ? item.item_type
            : 'unknown';

        return `
            <div class="item-card" data-item='${JSON.stringify(item)}'>
                <div class="item-card__header">
                    <h3 class="item-card__title">${escapeHtml(item.name)}</h3>

                    <span class="item-card__badge item-card__badge--${safeType}">
                        ${escapeHtml(safeType)}
                    </span>
                </div>

                <p class="item-card__desc">
                    ${escapeHtml(item.description || 'No description provided.')}
                </p>

                <div class="item-card__meta" style="display:flex; justify-content:space-between;">
                    <span>
                        Name match:
                        <strong>${item.name_relevance != null ? item.name_relevance + '%' : 'N/A'}</strong>
                    </span>

                    <span>
                        Description match:
                        <strong>${item.desc_relevance != null ? item.desc_relevance + '%' : 'N/A'}</strong>
                    </span>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.item-card').forEach(card => {
        card.addEventListener('click', () => {
            const item = JSON.parse(card.dataset.item);
            showItemDetails(item);
        });
    });
}

async function loadCategories() {
    const res = await fetch(`${API_BASE_URL}/categories`);
    const data = await res.json();

    const select = document.getElementById('categoryId');
    select.innerHTML = `<option value="" selected>None</option>`;

    data.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.category_code;
        option.textContent = cat.NAME;
        select.appendChild(option);
    });
}

async function loadBranches() {
    const res = await fetch(`${API_BASE_URL}/branches`);
    const data = await res.json();

    const select = document.getElementById('branchId');
    select.innerHTML = `<option value="" selected>None</option>`;

    data.forEach(branch => {
        const option = document.createElement('option');
        option.value = branch.branch_code;
        option.textContent = branch.NAME;
        select.appendChild(option);
    });
}

function initBranchLocationFilter() {
    const branchSelect = document.getElementById('branchId');
    if (!branchSelect) return;

    const locationSelect = document.getElementById('locationId');

    // Initial state when page loads
    locationSelect.disabled = true;
    locationSelect.innerHTML =
        `<option value="" selected disabled>Select Branch first...</option>`;

    branchSelect.addEventListener('change', async function () {
        const branchCode = this.value;

        // No branch selected
        if (!branchCode) {
            locationSelect.disabled = true;
            locationSelect.innerHTML =
                `<option value="" selected disabled>Select Branch first...</option>`;
            return;
        }

        // Loading state
        locationSelect.disabled = true;
        locationSelect.innerHTML =
            `<option selected disabled>Loading...</option>`;

        try {
            const res = await fetch(
                `${API_BASE_URL}/locations/by-branch/${branchCode}`
            );

            const data = await res.json();

            locationSelect.innerHTML =
                `<option value="" selected>None</option>`;

            data.forEach(loc => {
                const option = document.createElement('option');
                option.value = loc.location_code;
                option.textContent = loc.NAME;
                locationSelect.appendChild(option);
            });

            locationSelect.disabled = false;

        } catch (err) {
            console.error(err);

            locationSelect.disabled = true;
            locationSelect.innerHTML =
                `<option selected disabled>Error loading locations</option>`;
        }
    });
}

// Report form functionality
const reportForm = document.getElementById('reportForm');
if (reportForm) {
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('itemName').value,
            item_type: document.getElementById('itemType').value,
            category_id: document.getElementById('categoryId').value,
            branch_id: document.getElementById('branchId').value,
            location_id: document.getElementById('locationId').value,
            reporter_user_id: 'USR0001', // Automatically set reporter ID
            description: document.getElementById('itemDescription').value
        };
        

        try {

            const csrfToken = localStorage.getItem('csrf_token');

            const response = await fetch(`${API_BASE_URL}/items`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (response.ok) {
                Modal.show({
                    title: 'Success!',
                    message: 'Report submitted successfully!'
                });
                reportForm.reset();
                isFormDirty = false;
            } else if (response.status === 401) {
                Modal.show({
                    title: 'Unauthorized',
                    message: 'You must log in to submit a report. Redirecting...',
                    onConfirm: () => window.location.href = 'login.html'
                });
            } else {
                const err = await response.json();
                Modal.show({
                    title: 'Error',
                    message: `Failed to submit: ${err.error || 'Failed to submit'}`
                });
            }
        } catch (error) {
            console.error('Submit error:', error);
            Modal.show({
                title: 'Connection Error',
                message: 'Failed to connect to the server.'
            });
        }
    });
}

// Utils
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(unsafe) {
    return (unsafe || '').toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Authentication Logic
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth-status`, { credentials: 'include' });
        const data = await response.json();
        
        const isAuth = data.is_authenticated;

        if (!isAuth) {
            localStorage.removeItem('csrf_token');
        }

        const currentPage = window.location.pathname.split('/').pop();
        
        updateNavbar(isAuth, data.user);
        
        if (!isAuth && (currentPage === 'report.html')) {
            window.location.href = 'login.html';
        }
        
        if (isAuth && (currentPage === 'login.html')) {
            window.location.href = 'report.html';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
}

function updateNavbar(isAuth, user) {
    const navLinks = document.querySelector('.navbar__links');
    if (!navLinks) return;

    if (isAuth) {
        navLinks.innerHTML = `
            <a href="index.html" class="navbar__link">Home</a>
            <a href="report.html" class="navbar__link">Report Item</a>
            <div class="navbar__user">
                <span><i class="fa-solid fa-user-circle"></i> ${escapeHtml(user.username)}</span>
                <a href="#" id="logoutBtn" class="navbar__link" style="margin-left: 15px;">Logout</a>
            </div>
        `;
        document.getElementById('logoutBtn').addEventListener('click', logout);
    } else {
        navLinks.innerHTML = `
            <a href="index.html" class="navbar__link">Home</a>
            <a href="login.html" class="navbar__link">
                <i class="fa-solid fa-user-circle" style="margin-right: 8px;"></i> Login
            </a>
        `;
    }
}

async function logout(e) {
    e.preventDefault();
    try {

        const csrfToken = localStorage.getItem('csrf_token');

        const response = await fetch(`${API_BASE_URL}/logout`, { 
            method: 'POST', 
            credentials: 'include',
            headers: {
                'X-CSRF-Token': csrfToken
            }
        });
        
        if (response.ok) {
            // REMOVE TOKEN AFTER LOGOUT
            localStorage.removeItem('csrf_token');
            window.location.href = 'index.html';

        } else {
            console.error('Logout failed.');
        }

    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Login Form Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('loginError');
        errorEl.style.display = 'none';

        const payload = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (response.ok) {

                const data = await response.json();

                // SAVE CSRF TOKEN
                localStorage.setItem('csrf_token', data.csrf_token);

                window.location.href = 'report.html';

            } else {
                const err = await response.json();
                errorEl.textContent = err.error || 'Login failed. Please try again.';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorEl.textContent = 'Failed to connect to the server.';
            errorEl.style.display = 'block';
        }
    });
}

function togglePassword() {
    const input = document.getElementById("password");
    const icon = document.querySelector(".toggle-password");

    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}
// Modal System Logic
const Modal = (() => {
    const modal = document.getElementById('customModal');
    const titleEl = document.getElementById('modalTitle');
    const messageEl = document.getElementById('modalMessage');
    const footerEl = document.getElementById('modalFooter');

    if (!modal || !titleEl || !messageEl || !footerEl) {
        console.warn('Modal elements not found');
        return {};
    }

    function show({ title = '', message = '', type = 'alert', onConfirm = null }) {
        titleEl.textContent = title;
        messageEl.textContent = message;
        messageEl.innerHTML = message.replace(/\n/g, '<br>');
        footerEl.innerHTML = '';

        if (type === 'confirm') {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn-cancel';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = hide;

            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn-confirm';
            confirmBtn.textContent = 'Yes, Proceed';
            confirmBtn.onclick = () => {
                hide();
                if (onConfirm) onConfirm();
            };

            footerEl.append(cancelBtn, confirmBtn);
        } else {
            const okBtn = document.createElement('button');
            okBtn.className = 'btn-confirm';
            okBtn.textContent = 'OK';
            okBtn.onclick = () => {
                hide();
                if (onConfirm) onConfirm();
            };

            footerEl.appendChild(okBtn);
        }

        modal.style.display = 'flex';
    }

    function hide() {
        modal.style.display = 'none';
    }

    return { show, hide };
})();

function formatDetails(item) {
    return `
        Name: ${escapeHtml(item.name)}
        Status: ${escapeHtml(item.status || 'N/A')}
        Type: ${escapeHtml(item.item_type)}

        Category: ${escapeHtml(item.categoryName || 'N/A')} (${escapeHtml(item.categoryDescription || '')})

        Branch: ${escapeHtml(item.branchName || 'N/A')}

        Location: ${escapeHtml(item.locationName || 'N/A')} (${escapeHtml(item.locationDescription || '')})

        Description:
        ${escapeHtml(item.description || 'No description provided.')}

        Date Reported:
        ${formatWithoutTimezone(item.date_reported)}
    `;
}

function showItemDetails(item) {
    Modal.show({
        title: 'Item Details',
        message: formatDetails(item)
    });
}

function formatWithoutTimezone(dateString) {
    const date = new Date(dateString);

    return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}, ${
        date.getUTCHours() % 12 || 12
    }:${String(date.getUTCMinutes()).padStart(2, '0')}:${
        String(date.getUTCSeconds()).padStart(2, '0')
    } ${date.getUTCHours() >= 12 ? 'PM' : 'AM'}`;
}

// Unsaved Changes Tracker
function initUnsavedChangesTracker() {
    // Listen for changes on ALL inputs, textareas, and selects globally
    const trackableElements = document.querySelectorAll('input, textarea, select');
    trackableElements.forEach(el => {
        el.addEventListener('input', () => {
            isFormDirty = true;
        });
    });

    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', () => {
            setTimeout(() => { isFormDirty = false; }, 50);
        });
        form.addEventListener('reset', () => {
            isFormDirty = false;
        });
    });

    // LOGIC 1: DEFAULT BROWSER POPUP (only for browser exit/refresh)
    window.addEventListener('beforeunload', (e) => {
        // Skip if we're handling navigation via custom modal
        if (isHandlingModalNavigation) {
            isHandlingModalNavigation = false; // Reset for next time
            return;
        }
        
        if (isFormDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
    
    // LOGIC 2: CUSTOM MODAL (only for internal link navigation)
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        // ignore special browser/system actions
        if (link.target === '_blank') return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#')) return;

        // Show CUSTOM MODAL if there are unsaved changes
        if (isFormDirty) {
            e.preventDefault();

            Modal.show({
                title: 'Unsaved Changes',
                message: 'You have unsaved changes. Leave page?',
                type: 'confirm',
                onConfirm: () => {
                    isHandlingModalNavigation = true;
                    isFormDirty = false;
                    window.location.href = href;
                }
            });
        }
    });
}
