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

function buildItemDetails(item) {
    const container = document.createElement('div');
    container.className = 'item-modal';

    const img = document.createElement('img');
    img.src = item.image_url || '/assets/placeholder.png';
    img.onerror = () => {
        img.onerror = null; // prevents infinite loop of errors
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

        <p><strong>Description:</strong><br>
        ${escapeHtml(item.description || 'No description provided.')}</p>

        <p><strong>Date Reported:</strong><br>
        ${formatWithoutTimezone(item.date_reported)}</p>
    `;

    container.appendChild(img);
    container.appendChild(content);

    return container;
}

function showItemDetails(item) {
    Modal.show({
        title: 'Item Details',
        node: buildItemDetails(item)
    });
}

