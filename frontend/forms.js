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
                AppState.isFormDirty = false;
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

