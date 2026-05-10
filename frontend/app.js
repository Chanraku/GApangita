const API_BASE_URL = 'http://localhost:5000/api';

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
            const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
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
        const msgEl = document.getElementById('reportMessage');
        msgEl.textContent = 'Submitting...';
        msgEl.style.color = 'black';

        const payload = {
            name: document.getElementById('itemName').value,
            item_type: document.getElementById('itemType').value,
            category_id: parseInt(document.getElementById('categoryId').value),
            branch_id: document.getElementById('branchId').value ? parseInt(document.getElementById('branchId').value) : null,
            location_id: document.getElementById('locationId').value ? parseInt(document.getElementById('locationId').value) : null,
            reporter_user_id: 1, // Automatically set reporter ID
            description: document.getElementById('itemDescription').value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                msgEl.textContent = 'Report submitted successfully!';
                msgEl.style.color = 'green';
                reportForm.reset();
            } else {
                const err = await response.json();
                msgEl.textContent = `Error: ${err.error || 'Failed to submit'}`;
                msgEl.style.color = 'red';
            }
        } catch (error) {
            console.error('Submit error:', error);
            msgEl.textContent = 'Failed to connect to the server.';
            msgEl.style.color = 'red';
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
