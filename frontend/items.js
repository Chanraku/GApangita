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

function openClaimModal(item) {

    Modal.hide();

    const wrapper = document.createElement('div');
    const backBtn = document.createElement('button');

    backBtn.type = 'button';
    backBtn.textContent = '← Go Back';
    backBtn.className = 'btn';
    backBtn.addEventListener('click', () => {

        Modal.hide();

        setTimeout(() => {
            showItemDetails(item);
        }, 50);
    });

    const title = document.createElement('h3');
    title.textContent = 'Claim Item';
    const text = document.createElement('p');

    text.textContent =
        `Placeholder modal for ${item.name}`;

    wrapper.appendChild(backBtn);
    wrapper.appendChild(title);
    wrapper.appendChild(text);

    Modal.show({
        title: '',
        node: wrapper
    });
}