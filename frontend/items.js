function formatDetails(item) {
    return `
        Name: ${escapeHtml(item.name)}
        Status: ${escapeHtml(item.status || 'N/A')}
        Type: ${escapeHtml(item.item_type)}
        Category: ${escapeHtml(item.categoryName || 'N/A')} (${escapeHtml(item.categoryDescription || '')})
        Branch: ${escapeHtml(item.branchName || 'N/A')}
        Location: ${escapeHtml(item.locationName || 'N/A')} (${escapeHtml(item.locationDescription || '')})
        Description: ${escapeHtml(item.description || 'No description provided.')}
        Date Reported: ${formatWithoutTimezone(item.date_reported)}
    `;
}

function buildItemDetails(item) {

    const container = document.createElement('div');
    container.className = 'item-modal';
    const img = document.createElement('img');

    img.src = item.image_url || '/assets/placeholder.png';
    img.onerror = () => {
        img.onerror = null;
        img.src = '/assets/placeholder.png';
    };

    img.alt = item.name || 'Item image';
    img.className = 'item-modal__image';

    const content = document.createElement('div');

    content.className = 'item-modal__content';
    content.innerHTML = `
        <p><strong>Name:</strong> ${escapeHtml(item.name)}</p>
        <p><strong>Status:</strong> ${escapeHtml(item.status || 'N/A')}</p>
        <p><strong>Type:</strong> ${escapeHtml(item.item_type)}</p>
        <p><strong>Category:</strong> ${escapeHtml(item.categoryName || 'N/A')}</p>
        <p><strong>Branch:</strong> ${escapeHtml(item.branchName || 'N/A')}</p>
        <p><strong>Location:</strong> ${escapeHtml(item.locationName || 'N/A')}</p>

        <p>
            <strong>Description:</strong><br>
            ${escapeHtml(item.description || 'No description provided.')}
        </p>

        <p>
            <strong>Date Reported:</strong><br>
            ${formatWithoutTimezone(item.date_reported)}
        </p>
    `;

    container.appendChild(img);
    container.appendChild(content);

    // CLAIM BUTTON
    if (window.AppState?.isAuthenticated) {

        const actions = document.createElement('div');
        actions.className = 'item-modal__actions';
        const claimBtn = document.createElement('button');

        claimBtn.type = 'button';
        claimBtn.textContent = 'Claim Item';
        claimBtn.className = 'btn btn-primary';
        claimBtn.addEventListener('click', () => {

            openClaimModal(item);
        });

        actions.appendChild(claimBtn);
        container.appendChild(actions);
    }

    return container;
}

function showItemDetails(item) {
    Modal.show({
        title: 'Item Details',
        node: buildItemDetails(item)
    });
}

// Claim Item Modal
function openClaimModal(item) {

    const wrapper = document.createElement('div');
    wrapper.className = 'claim-modal';

    // Go Back Button
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.textContent = '← Go Back';
    backBtn.className = 'btn';
    backBtn.addEventListener('click', () => {
        stopClaimCamera(cameraFeed);
        Modal.hide();
        setTimeout(() => {
            showItemDetails(item);
        }, 50);
    });

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Claim Item';

    // Button Container

    const buttonRow = document.createElement('div');
    buttonRow.className = 'claim-button-row';

    // Open Camera Button
    const openCameraBtn = document.createElement('button');
    openCameraBtn.type = 'button';
    openCameraBtn.textContent = 'Open Camera';
    openCameraBtn.className = 'btn btn-primary';

    // Capture Image Button
    const captureBtn = document.createElement('button');
    captureBtn.type = 'button';
    captureBtn.textContent = 'Capture Image';
    captureBtn.className = 'btn';
    buttonRow.appendChild(openCameraBtn);
    buttonRow.appendChild(captureBtn);

    // Live Camera Feed
    const cameraFeed = document.createElement('video');
    cameraFeed.autoplay = true;
    cameraFeed.playsInline = true;
    cameraFeed.className = 'claim-camera-feed';

    // Close Camera Button
    const closeCameraBtn = document.createElement('button');
    closeCameraBtn.style.display = 'none';
    closeCameraBtn.type = 'button';
    closeCameraBtn.textContent = 'Close Camera';
    closeCameraBtn.className = 'btn';
    closeCameraBtn.addEventListener('click', () => { stopClaimCamera(cameraFeed); });

    // Snapshot Canvas
    const snapshotCanvas = document.createElement('canvas');
    snapshotCanvas.style.display = 'none';

    // Preview Title
    const previewTitle = document.createElement('h4');
    previewTitle.textContent = 'Preview Image';

    // Preview Container

    const previewContainer = document.createElement('div');
    previewContainer.className = 'claim-preview-container';

    // Preview Placeholder
    const previewPlaceholder = document.createElement('div');
    previewPlaceholder.className = 'claim-preview-placeholder';
    previewPlaceholder.textContent = 'No image yet';

    // Image Preview
    const imagePreview = document.createElement('img');
    imagePreview.className = 'claim-preview-image';
    imagePreview.style.display = 'none';
    previewContainer.appendChild(previewPlaceholder);
    previewContainer.appendChild(imagePreview);

    // Remove Preview Button
    const removePreviewBtn = document.createElement('button');
    removePreviewBtn.type = 'button';
    removePreviewBtn.textContent = 'Remove Preview Image';
    removePreviewBtn.className = 'btn';

    // Confirm Button
    const claimConfirmBtn = document.createElement('button');
    claimConfirmBtn.type = 'button';
    claimConfirmBtn.textContent = 'Confirm Claim Item';
    claimConfirmBtn.className = 'btn btn-primary';
    claimConfirmBtn.disabled = true;

    // Camera Events
    openCameraBtn.addEventListener('click', async () => {
        await openClaimCamera(cameraFeed);
        closeCameraBtn.style.display = 'block';
    });

    captureBtn.addEventListener('click', () => {
        captureClaimImage(
            cameraFeed,
            snapshotCanvas,
            imagePreview,
            previewPlaceholder
        );
        confirmBtn.disabled = false;
    });

    closeCameraBtn.addEventListener('click', () => {
        stopClaimCamera(cameraFeed);
        closeCameraBtn.style.display = 'none';
    });

    removePreviewBtn.addEventListener('click', () => {
        removeClaimPreview(
            imagePreview,
            previewPlaceholder
        );
        claimConfirmBtn.disabled = true;
    });

    claimConfirmBtn.addEventListener('click', () => {
        if (!imagePreview.src || imagePreview.style.display === 'none') { return; }
        stopClaimCamera(cameraFeed);
        Modal.hide();
        alert('Placeholder claim functionality.');
    });

    // Assemble everything
    wrapper.appendChild(backBtn);
    wrapper.appendChild(title);
    wrapper.appendChild(buttonRow);
    wrapper.appendChild(cameraFeed);
    wrapper.appendChild(closeCameraBtn);
    wrapper.appendChild(snapshotCanvas);
    wrapper.appendChild(previewTitle);
    wrapper.appendChild(previewContainer);
    wrapper.appendChild(removePreviewBtn);
    wrapper.appendChild(claimConfirmBtn);

    Modal.show({
        title: '',
        node: wrapper
    });
}