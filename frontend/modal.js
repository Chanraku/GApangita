// Modal System Logic
const Modal = (() => {
    const modal = document.getElementById('customModal');
    const titleEl = document.getElementById('modalTitle');
    const messageEl = document.getElementById('modalMessage');
    const footerEl = document.getElementById('modalFooter');

    // Variable to hold active close callback loop
    let activeCloseCallback = null;

    if (!modal || !titleEl || !messageEl || !footerEl) {
        console.warn('Modal elements not found');
        return {};
    }

    function show({ title = '', message = '', node = null, type = 'alert', onConfirm = null, confirmText = 'Close', onClose = null }) {

        // save the reference down into our module scope variable
        activeCloseCallback = onClose;

        titleEl.textContent = title;
        footerEl.innerHTML = '';

        if (node) {
            messageEl.innerHTML = '';
            messageEl.appendChild(node);
        } else {
            messageEl.innerHTML = (message || '').replace(/\n/g, '<br>');
        }

        if (type === 'confirm') {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn-cancel';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = hide;

            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn-confirm';
            confirmBtn.textContent = 'Yes, Proceed';
            confirmBtn.disabled = false;
            confirmBtn.onclick = () => {
                hide();
                if (onConfirm) onConfirm();
            };

            footerEl.append(cancelBtn, confirmBtn);
        } else {
            const okBtn = document.createElement('button');
            okBtn.className = 'btn-confirm';
            okBtn.textContent = confirmText;
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

        // execute the saved close lifecycle tracking hook if it exists
        if (activeCloseCallback) {
            activeCloseCallback();
            activeCloseCallback = null; // Reset to avoid double execution bugs
        }
    }

    return { show, hide };
    })();