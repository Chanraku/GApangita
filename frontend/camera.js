document.addEventListener('DOMContentLoaded', () => {

    const openCameraBtn =
        document.getElementById('openCameraBtn');

    const captureBtn =
        document.getElementById('captureBtn');

    const cameraFeed =
        document.getElementById('cameraFeed');

    const snapshotCanvas =
        document.getElementById('snapshotCanvas');

    const imagePreview =
        document.getElementById('imagePreview');

    const previewPlaceholder =
        document.getElementById('previewPlaceholder');

    let stream;

    // Open webcam
    openCameraBtn.addEventListener('click', async () => {

        try {

            stream =
                await navigator.mediaDevices.getUserMedia({
                    video: true
                });

            cameraFeed.srcObject = stream;

        } catch (error) {

            alert('Camera access denied or unavailable.');

            console.error(error);
        }
    });

    // Capture image
    captureBtn.addEventListener('click', () => {

        const context =
            snapshotCanvas.getContext('2d');

        snapshotCanvas.width =
            cameraFeed.videoWidth;

        snapshotCanvas.height =
            cameraFeed.videoHeight;

        context.drawImage(
            cameraFeed,
            0,
            0
        );

        const imageData =
            snapshotCanvas.toDataURL('image/png');

        imagePreview.src = imageData;

        imagePreview.style.display = 'block';

        previewPlaceholder.style.display = 'none';
    });

    const cancelImageBtn =
    document.getElementById('cancelImageBtn');

        cancelImageBtn.addEventListener('click', () => {

            // Remove preview image
            imagePreview.src = '';

            // Hide image
            imagePreview.style.display = 'none';

            // Show placeholder again
            previewPlaceholder.style.display = 'block';
        });

        cancelImageBtn.addEventListener('click', () => {

            // Remove preview
            imagePreview.src = '';

            imagePreview.style.display = 'none';

            previewPlaceholder.style.display = 'block';

            // Stop webcam stream
            if (stream) {

                stream.getTracks().forEach(track => track.stop());

                cameraFeed.srcObject = null;
            }
});

});