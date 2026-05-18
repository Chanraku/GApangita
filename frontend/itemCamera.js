document.addEventListener('DOMContentLoaded', () => {

    const openItemCameraBtn = document.getElementById('openItemCameraBtn');
    const captureItemBtn = document.getElementById('captureItemBtn');
    const cancelItemImageBtn = document.getElementById('cancelItemImageBtn');

    const itemCameraFeed = document.getElementById('itemCameraFeed');
    const itemSnapshotCanvas = document.getElementById('itemSnapshotCanvas');

    const itemImagePreview = document.getElementById('itemImagePreview');
    const itemPreviewPlaceholder = document.getElementById('itemPreviewPlaceholder');

    openItemCameraBtn.addEventListener('click', async () => {

        try {

            // Stop USER camera first
            if (userStream) {

                userStream.getTracks().forEach(track => track.stop());
                userCameraFeed.srcObject = null;

            }

            // Stop old ITEM stream
            if (itemStream) {

                itemStream.getTracks().forEach(track => track.stop());

            }

            // Open ITEM camera
            itemStream = await navigator.mediaDevices.getUserMedia({ video: true });

            itemCameraFeed.srcObject = itemStream;
            await itemCameraFeed.play();

        } catch (error) {

            alert('Item camera access denied or unavailable.');
            console.error(error);

        }

    });

    captureItemBtn.addEventListener('click', () => {

        const context = itemSnapshotCanvas.getContext('2d');

        itemSnapshotCanvas.width = itemCameraFeed.videoWidth;
        itemSnapshotCanvas.height = itemCameraFeed.videoHeight;

        context.drawImage(itemCameraFeed, 0, 0, itemSnapshotCanvas.width, itemSnapshotCanvas.height);

        const imageData = itemSnapshotCanvas.toDataURL('image/png');

        itemImagePreview.src = imageData;
        itemImagePreview.style.display = 'block';

        itemPreviewPlaceholder.style.display = 'none';

    });

    cancelItemImageBtn.addEventListener('click', () => {

        // Remove preview
        itemImagePreview.src = '';
        itemImagePreview.style.display = 'none';
        itemPreviewPlaceholder.style.display = 'block';

        // Stop webcam
        if (itemStream) {

            itemStream.getTracks().forEach(track => track.stop());
            itemCameraFeed.srcObject = null;

        }

    });
});