function formatDetails(item) {
    return `
        Name: ${escapeHtml(item.name)}
        Status: ${escapeHtml(item.status || 'N/A')}
        Type: ${escapeHtml(item.item_type)}
        Category: ${escapeHtml(item.categoryName || 'N/A')} (${escapeHtml(item.categoryDescription || '')})
        Branch: ${escapeHtml(item.branchName || 'N/A')}
        Location: ${escapeHtml(item.locationName || 'N/A')} (${escapeHtml(item.locationDescription || '')})
        Description: ${escapeHtml(item.description || 'No description provided.')}
        Date Found: ${formatWithoutTimezone(item.date_found)}
        Date Reported: ${formatWithoutTimezone(item.date_reported)}
    `;
}

function buildItemDetails(item, options = {}) {
    console.log("DATABASE ROW OBJECT IS:", item);

    const container = document.createElement('div');
    container.className = 'item-modal';
    const img = document.createElement('img');

    if (item.item_file_path) {
            const cleanPath = item.item_file_path.replace(/^\/+/, '');
            const imgBase = API_BASE_URL.replace(/\/api$/, '');
            img.src = `${imgBase}/uploads/${cleanPath}`;
        } else {
            img.src = 'assets/placeholder.png';
        }

        img.onerror = () => {
            img.onerror = null;
            img.src = 'assets/placeholder.png';
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
            <strong>Date Found:</strong><br>
            ${formatWithoutTimezone(item.date_found)}
        </p>

        <p>
            <strong>Date Reported:</strong><br>
            ${formatWithoutTimezone(item.date_reported)}
        </p>
    `;

    container.appendChild(img);
    container.appendChild(content);

    // ACTION BUTTON
    if (window.AppState?.isAuthenticated && options.actionButton) {

        const actions = document.createElement('div');
        actions.className = 'item-modal__actions';
        const actionBtn = document.createElement('button');
        actionBtn.type = 'button';
        actionBtn.textContent = options.actionButton.text || 'Action';
        actionBtn.className = options.actionButton.className || 'btn btn-primary';
        actionBtn.addEventListener('click', () => {
            if (options.actionButton.onClick) {
                options.actionButton.onClick(item);
            }
        });
            actions.appendChild(actionBtn);
            container.appendChild(actions);
        }

    return container;
    }

function showItemDetails(item, options = {}) {
    Modal.show({
        title: 'Item Details',
        node: buildItemDetails(item, options)
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
            showItemDetails(item, {
                actionButton: {
                    text: 'Claim Item',
                    className: 'btn btn-primary',
                    onClick: openClaimModal
                }
            });
        }, 50);
    });

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Claim Item';

    // Form Section Container
    const formSection = document.createElement('div');
    formSection.className = 'claim-form-section';
    
    // Name Fields Row
    const nameRow = document.createElement('div');
    nameRow.className = 'claim-name-row';

    // Helper function to build standard input structures using CSS classes
    function buildInputField(labelText, placeholder, isRequired = true) {
        const group = document.createElement('div');
        group.className = 'claim-field-group';

        const label = document.createElement('label');
        label.textContent = labelText;

        if (isRequired) {
            const star = document.createElement('span');
            star.className = 'required-star';
            star.textContent = ' *';
            label.appendChild(star);
        }

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = placeholder;
        input.className = 'form-control';

        group.appendChild(label);
        group.appendChild(input);
        return { group, input };
    }

    // Build the fields
    const firstNameField = buildInputField('First Name', 'First Name');
    const middleNameField = buildInputField('Middle Name', 'Middle Name', false);
    const lastNameField = buildInputField('Last Name', 'Last Name');
    const contactField = buildInputField('Contact Number', 'e.g., +63 9XX XXX XXXX');

    // Add custom class identifier specifically for the standalone contact row
    contactField.group.classList.add('claim-contact-group');

    // Append items down into structural containers
    nameRow.appendChild(firstNameField.group);
    nameRow.appendChild(middleNameField.group);
    nameRow.appendChild(lastNameField.group);

    formSection.appendChild(nameRow);
    formSection.appendChild(contactField.group);

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
        claimConfirmBtn.disabled = false;
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
    wrapper.appendChild(formSection);
    wrapper.appendChild(buttonRow);
    wrapper.appendChild(cameraFeed);
    wrapper.appendChild(closeCameraBtn);
    wrapper.appendChild(snapshotCanvas);
    wrapper.appendChild(previewTitle);
    wrapper.appendChild(previewContainer);
    wrapper.appendChild(removePreviewBtn);
    wrapper.appendChild(claimConfirmBtn);

    // Ensure camera stream is stopped if modal is closed by other means
    wrapper.addEventListener('DOMNodeRemovedFromDocument', () => {
        if (cameraFeed) {
            stopClaimCamera(cameraFeed);
        }
    });

    Modal.show({
        title: '',
        node: wrapper,
        // Close Camera Upon Modal Close
        onClose: () => {
            if (cameraFeed) {
                stopClaimCamera(cameraFeed);
            }
        }
    });

}

function openRestoreItemModal(item) {

    const wrapper = document.createElement('div');
    wrapper.className = 'restore-modal';
    const title = document.createElement('h3');
    title.textContent = 'Restore Archived Item';
    const itemDetailsNode = buildItemDetails(item);
    const description = document.createElement('p');

    // Reason Label
    const reasonLabel = document.createElement('label');
    reasonLabel.textContent = 'Reason for restoring item';

    // Reason Textarea
    const reasonInput = document.createElement('textarea');
    reasonInput.className = 'restore-reason-input';
    reasonInput.placeholder = 'Enter at least 8 characters...';
    reasonInput.rows = 4;

    // Validation Text
    const validationText = document.createElement('small');
    validationText.textContent = 'Minimum 8 characters required.';
    validationText.style.display = 'block';

    description.textContent = 'Please review the item details before restoring.';

    const buttonRow = document.createElement('div');
    buttonRow.className = 'restore-button-row';
    const cancelBtn = document.createElement('button');

    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn';
    cancelBtn.addEventListener('click', () => {

        Modal.hide();
    });

    const restoreBtn = document.createElement('button');
    restoreBtn.type = 'button';
    restoreBtn.textContent = 'Restore Item';
    restoreBtn.className = 'btn btn-primary';
    restoreBtn.disabled = true;
    restoreBtn.addEventListener('click', async () => {

        try {

            // PLACEHOLDER LOGIC
            console.log('Restoring item:', item.item_code);

            Modal.hide();

            alert('Placeholder: Item restored.');

        } catch (error) {

            console.error(error);

            alert('Failed to restore item.');
        }
    });

    reasonInput.addEventListener('input', () => {

        const value = reasonInput.value.trim();

        restoreBtn.disabled = value.length < 8;
    });


        // Go Back Button
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.textContent = '← Go Back';
    backBtn.className = 'btn';
    backBtn.addEventListener('click', () => {

        Modal.hide();

        setTimeout(() => {

            showItemDetails(item, {
                actionButton: {
                    text: 'Restore Item',
                    className: 'btn btn-primary',
                    onClick: openRestoreItemModal
                }
            });

        }, 50);
    });

    buttonRow.append(cancelBtn, restoreBtn);
    wrapper.append(backBtn, title, description, itemDetailsNode, reasonLabel, reasonInput, validationText, buttonRow);
    Modal.show({
        title: '',
        node: wrapper
    });
}