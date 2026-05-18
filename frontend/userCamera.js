document.addEventListener('DOMContentLoaded', () => {

    const openUserCameraBtn = document.getElementById('openUserCameraBtn');
    const captureUserBtn = document.getElementById('captureUserBtn');
    const cancelUserImageBtn = document.getElementById('cancelUserImageBtn');

    const userCameraFeed = document.getElementById('userCameraFeed');
    const userSnapshotCanvas = document.getElementById('userSnapshotCanvas');

    const userImagePreview = document.getElementById('userImagePreview');
    const userPreviewPlaceholder = document.getElementById('userPreviewPlaceholder');

    openUserCameraBtn.addEventListener('click', async () => {

        try {

            // Stops Item Camera First
            if (itemStream) {

                itemStream.getTracks().forEach(track => track.stop());
                itemCameraFeed.srcObject = null;
            }

            // Stops Old User Stream
            if (userStream) {

                userStream.getTracks().forEach(track => track.stop());

            }

            // Open User Camera
            userStream = await navigator.mediaDevices.getUserMedia({ video: true });
            userCameraFeed.srcObject = userStream;
            await userCameraFeed.play();

        } catch (error) {

            alert('User camera access denied or unavailable.');
            console.error(error);

        }
    });

    captureUserBtn.addEventListener('click', () => {

        const context = userSnapshotCanvas.getContext('2d');

        userSnapshotCanvas.width = userCameraFeed.videoWidth;
        userSnapshotCanvas.height = userCameraFeed.videoHeight;

        context.drawImage( userCameraFeed, 0, 0, userSnapshotCanvas.width, userSnapshotCanvas.height );

        const imageData = userSnapshotCanvas.toDataURL('image/png');

        userImagePreview.src = imageData;
        userImagePreview.style.display = 'block';

        userPreviewPlaceholder.style.display = 'none';

    });

    cancelUserImageBtn.addEventListener('click', () => {

        // Remove preview
        userImagePreview.src = '';
        userImagePreview.style.display = 'none';
        userPreviewPlaceholder.style.display = 'block';

        // Stop webcam
        if (userStream) {

            userStream.getTracks().forEach(track => track.stop());
            userCameraFeed.srcObject = null;

        }

    });
});