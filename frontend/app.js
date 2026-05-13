const API_BASE_URL = 'http://localhost:5000/api';
let isFormDirty = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Search functionality
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');

if (searchInput) {
    searchInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            resultsContainer.innerHTML = '<p>Type at least 2 characters to search...</p>';
            return;
        }

        try {
            resultsContainer.innerHTML = '<p>Searching...</p>';
            const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, { credentials: 'include' });
            const items = await response.json();
            
            displayResults(items);
        } catch (error) {
            console.error('Error fetching search results:', error);
            resultsContainer.innerHTML = '<p style="color: red;">Failed to load results. Is the backend running?</p>';
        }
    }, 300));
}

function displayResults(items) {
    if (!items || items.length === 0) {
        resultsContainer.innerHTML = '<p>No items found.</p>';
        return;
    }

    resultsContainer.innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-card__header">
                <h3 class="item-card__title">${escapeHtml(item.name)}</h3>
                <span class="item-card__badge item-card__badge--${item.item_type}">${item.item_type}</span>
            </div>
            <p class="item-card__desc">${escapeHtml(item.description || 'No description provided.')}</p>
            <div class="item-card__meta">
                <span>Date: ${new Date(item.date_reported).toLocaleDateString()}</span>
                <span title="Higher percentage means better match!">Match: ${Math.round(item.relevance)}%</span>
            </div>
        </div>
    `).join('');
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
            const response = await fetch(`${API_BASE_URL}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (response.ok) {
                showModal('Success!', 'Report submitted successfully!');
                reportForm.reset();
                isFormDirty = false;
            } else if (response.status === 401) {
                showModal('Unauthorized', 'You must log in to submit a report. Redirecting...', 'alert', () => {
                    window.location.href = 'login.html';
                });
            } else {
                const err = await response.json();
                showModal('Error', `Failed to submit: ${err.error || 'Failed to submit'}`);
            }
        } catch (error) {
            console.error('Submit error:', error);
            showModal('Connection Error', 'Failed to connect to the server.');
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
                <span><i class="fa-solid fa-user-circle"></i> ${user.username}</span>
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
        await fetch(`${API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' });
        window.location.href = 'index.html';
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

// Modal System Logic
function showModal(title, message, type = 'alert', onConfirm = null) {
    const modal = document.getElementById('customModal');
    if (!modal) return;

    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    
    const footer = document.getElementById('modalFooter');
    footer.innerHTML = ''; // Clear previous buttons

    if (type === 'confirm') {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => {
            modal.style.display = 'none';
        };

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn-confirm';
        confirmBtn.textContent = 'Yes, Proceed';
        confirmBtn.onclick = () => {
            modal.style.display = 'none';
            if (onConfirm) onConfirm();
        };

        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);
    } else {
        const okBtn = document.createElement('button');
        okBtn.className = 'btn-confirm';
        okBtn.textContent = 'OK';
        okBtn.onclick = () => {
            modal.style.display = 'none';
            if (onConfirm) onConfirm(); // onClose action
        };
        footer.appendChild(okBtn);
    }

    modal.style.display = 'flex';
}

// Unsaved Changes Tracker
document.addEventListener('DOMContentLoaded', () => {
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

    window.addEventListener('beforeunload', (e) => {
        if (isFormDirty) {
            e.preventDefault();
            e.returnValue = ''; // Required for some browsers to show the default prompt
        }
    });

    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) {
            const href = link.getAttribute('href');
            if (isFormDirty && href && !href.startsWith('#') && href !== 'javascript:void(0);') {
                e.preventDefault(); // Stop immediate navigation
                showModal(
                    'Unsaved Changes', 
                    'Are you sure you want to leave this page with unsaved changes?', 
                    'confirm', 
                    () => {
                        window.location.href = href; // Navigate if confirmed
                    }
                );
            }
        }
    });
});

