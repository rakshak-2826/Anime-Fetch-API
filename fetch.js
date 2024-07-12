document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const screenshotInput = document.getElementById('screenshot');
    const preview = document.getElementById('preview');
    const resultSection = document.getElementById('resultSection');
    const resultDiv = document.getElementById('result');
    const resetButton = document.getElementById('resetButton');

    // Function to show result section and hide upload section
    function showResultSection() {
        document.querySelector('.modal').style.display = 'none';
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

                const proxyUrl = 'http://localhost:3000/proxy?url=';
                const imgResponse = await fetch(proxyUrl + encodeURIComponent(sceneImageUrl));
                const imgBlob = await imgResponse.blob();
                const imgUrl = URL.createObjectURL(imgBlob);
                console.log('CORS Proxy Image URL:', proxyUrl);

                const anilistResponse = await fetch('https://graphql.anilist.co', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        query: `
                            query ($id: Int) {
                                Media(id: $id) {
                                    title {
                                        native
                                        romaji
                                        english
                                    }
                                    coverImage {
                                        large
                                    }
                                }
                            }
                        `,
                        variables: {
                            id: anilistId
                        }
                    })
                });

                const anilistData = await anilistResponse.json();
                console.log('AniList data:', anilistData);

                const title = anilistData.data.Media.title.english || anilistData.data.Media.title.romaji || anilistData.data.Media.title.native || 'Unknown Title';
                const mainThumbnailUrl = anilistData.data.Media.coverImage.large || '';

                displayResult(title, result.episode, result.from, videoUrl, imgUrl, mainThumbnailUrl);
                showResultSection();
            }
        } catch (error) {
            console.error('Error:', error);
            resultDiv.innerText = 'An error occurred. Please try again.';
        }
    });

    // Handle reset button click
    resetButton.addEventListener('click', function() {
        document.querySelector('.modal').style.display = 'block';
        resultSection.style.display = 'none';
        preview.style.display = 'none'; // Hide preview on reset
        screenshotInput.value = ''; // Clear the file input
        resultDiv.innerHTML = ''; // Clear the result div
        // Show the upload area content
        document.querySelector('.upload-area-icon').style.display = 'block';
        document.querySelector('.upload-area-title').style.display = 'block';
        document.querySelector('.upload-area-description').style.display = 'block';
    });

    // Display preview of uploaded image
    screenshotInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                // Hide the upload area content
                document.querySelector('.upload-area-icon').style.display = 'none';
                document.querySelector('.upload-area-title').style.display = 'none';
                document.querySelector('.upload-area-description').style.display = 'none';
            }
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
            // Show the upload area content if no file is selected
            document.querySelector('.upload-area-icon').style.display = 'block';
            document.querySelector('.upload-area-title').style.display = 'block';
            document.querySelector('.upload-area-description').style.display = 'block';
        }
    });

    function displayResult(title, episode, timestamp, videoUrl, sceneImageUrl, mainThumbnailUrl) {
        const formattedTimestamp = timestamp ? new Date(timestamp * 1000).toISOString().substr(11, 8) : 'N/A';

        console.log('Displaying Result - Title:', title, 'Episode:', episode, 'Timestamp:', formattedTimestamp, 'Video URL:', videoUrl, 'Scene Image URL:', sceneImageUrl, 'Main Thumbnail URL:', mainThumbnailUrl);

        resultDiv.innerHTML = `
            <h2>Anime Scene Details</h2>
            <p>Anime: ${title}</p>
            <p>Episode: ${episode}</p>
            <p>Timestamp: ${formattedTimestamp}</p>
            <h3>Main Thumbnail</h3>
            ${mainThumbnailUrl ? `<a href="${videoUrl}" target="_blank"><img src="${mainThumbnailUrl}" alt="Main Thumbnail" style="max-width: 100%; height: auto;"></a>` : ''}
        `;
    }

    // Trigger file input when upload area is clicked
    document.querySelector('.upload-area').addEventListener('click', function() {
        screenshotInput.click();
    });
});
