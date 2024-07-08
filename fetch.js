// File: public/script.js

document.addEventListener('DOMContentLoaded', function() {
    const uploadSection = document.getElementById('uploadSection');
    const resultSection = document.getElementById('resultSection');
    const uploadForm = document.getElementById('uploadForm');
    const resetButton = document.getElementById('resetButton');
    const resultDiv = document.getElementById('result');
    const screenshotInput = document.getElementById('screenshot');
    const preview = document.getElementById('preview');

    // Function to show upload section and hide result section
    function showUploadSection() {
        uploadSection.style.display = 'block';
        resultSection.style.display = 'none';
    }

    // Function to show result section and hide upload section
    function showResultSection() {
        uploadSection.style.display = 'none';
        resultSection.style.display = 'block';
    }

    // Handle form submission
    uploadForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const screenshot = screenshotInput.files[0];

        if (!screenshot) {
            alert('Please upload a screenshot.');
            return;
        }

        const formData = new FormData();
        formData.append('image', screenshot);

        try {
            const response = await fetch('https://api.trace.moe/search', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to fetch data from the API.');
            }

            const data = await response.json();
            console.log('API response data:', data);

            if (data.result.length > 0) {
                const result = data.result[0];
                const anilistId = result.anilist;
                const videoUrl = result.video || '';
                const sceneImageUrl = result.image || '';

                const proxyUrl = 'https://your-vercel-project.vercel.app/api/proxy?url=';
                const imgResponse = await fetch(proxyUrl + encodeURIComponent(sceneImageUrl));
                const imgBlob = await imgResponse.blob();
                const imgUrl = URL.createObjectURL(imgBlob);

                const title = result.anime;
                const episode = result.episode;
                const timestamp = result.from;
                const mainThumbnailUrl = ''; // Add your logic to fetch main thumbnail if needed

                displayResult(title, episode, timestamp, videoUrl, imgUrl, mainThumbnailUrl);
                showResultSection();
            }
        } catch (error) {
            console.error('Error:', error);
            resultDiv.innerText = 'An error occurred. Please try again.';
        }
    });

    // Handle reset button click
    resetButton.addEventListener('click', function() {
        showUploadSection();
        preview.style.display = 'none'; // Hide preview on reset
    });

    // Display preview of uploaded image
    screenshotInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
        }
    });

    function displayResult(title, episode, timestamp, videoUrl, sceneImageUrl, mainThumbnailUrl) {
        const formattedTimestamp = timestamp ? new Date(timestamp * 1000).toISOString().substr(11, 8) : 'N/A';

        resultDiv.innerHTML = `
            <h2>Anime Scene Details</h2>
            <p>Anime: ${title}</p>
            <p>Episode: ${episode}</p>
            <p>Timestamp: ${formattedTimestamp}</p>
            <a href="${videoUrl}" target="_blank">Watch Video</a><br>
            <img src="${sceneImageUrl}" alt="Scene Screenshot" style="max-width: 100%; height: auto;">
            <h3>Main Thumbnail</h3>
            ${mainThumbnailUrl ? `<img src="${mainThumbnailUrl}" alt="Main Thumbnail" style="max-width: 100%; height: auto;">` : ''}
        `;
    }

    // Initially show upload section
    showUploadSection();
});
