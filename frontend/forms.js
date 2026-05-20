// Report form functionality
const reportForm = document.getElementById('reportForm');

if (reportForm) {

    reportForm.addEventListener('submit', async (e) => {

        e.preventDefault();

        const formData = new FormData();

        formData.append( 'name', document.getElementById('itemName').value );
        formData.append( 'item_type', document.getElementById('itemType').value);
        formData.append( 'category_code', document.getElementById('categoryId').value);
        formData.append( 'branch_code',document.getElementById('branchId').value);
        formData.append( 'location_code',document.getElementById('locationId').value);
        formData.append( 'description',document.getElementById('itemDescription').value);
        formData.append( 'date_found', document.getElementById('dateFound').value);

        // Grab the HTML5 datetime-local string (YYYY-MM-DDTHH:MM)
        const rawDateTime = document.getElementById('dateFound').value; 
        
        // Clean the 'T' separator out so MySQL's DATETIME column reads it cleanly
        const standardSqlDateTime = rawDateTime.replace('T', ' ');
        
        // Append it to your FormData payload
        formData.append('date_found', standardSqlDateTime);

        // CAMERA IMAGE
        if (itemImageFile) { formData.append( 'item_image', itemImageFile ); }
        if (userImageFile) { formData.append( 'reporter_image', userImageFile); }

        try {
            const csrfToken = localStorage.getItem('csrf_token');
            const response = await fetch(`${API_BASE_URL}/items`, {
                method: 'POST',
                headers: { 'X-CSRF-Token': csrfToken },
                body: formData,
                credentials: 'include'
            });
            if (response.ok) {

                Modal.show({
                    title: 'Success!',
                    message: 'Report submitted successfully!'
                });

                reportForm.reset();
                itemImageFile = null;
                itemImagePreview.src = '';
                itemImagePreview.style.display = 'none';
                itemPreviewPlaceholder.style.display = 'block';
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