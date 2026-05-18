document.addEventListener('DOMContentLoaded', () => {

    const fileInput = document.getElementById('itemImage');

    const imagePreview =
        document.getElementById('imagePreview');

    const previewPlaceholder =
        document.getElementById('previewPlaceholder');

    const cancelImageBtn =
        document.getElementById('cancelImageBtn');

    // Show preview
fileInput.addEventListener('change', function () {

    const file = this.files[0];

    if (file) {

        const imageURL = URL.createObjectURL(file);

        imagePreview.src = imageURL;

        imagePreview.style.display = 'block';

        previewPlaceholder.style.display = 'none';
    }
});

    // Remove preview
    cancelImageBtn.addEventListener('click', () => {

        fileInput.value = '';

        imagePreview.src = '';

        imagePreview.style.display = 'none';

        previewPlaceholder.style.display = 'block';
    });

});