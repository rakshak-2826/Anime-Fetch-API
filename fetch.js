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

        // Declare timing variables
        let startTotalFetch, endTotalFetch;
        let startTraceMoeFetch, endTraceMoeFetch;
        let startTraceMoeParse, endTraceMoeParse;
        let startAniListFetch, endAniListFetch;
        let startAniListParse, endAniListParse;

        try {
            startTotalFetch = performance.now();
            startTraceMoeFetch = performance.now();
            const response = await fetch('https://api.trace.moe/search', {
                method: 'POST',
                body: formData
            });
            endTraceMoeFetch = performance.now();

            if (!response.ok) {
                throw new Error('Failed to fetch data from the API.');
            }

            startTraceMoeParse = performance.now();
            const data = await response.json();
            endTraceMoeParse = performance.now();
            console.log('API response data:', data);

            if (data.result.length > 0) {
                const result = data.result[0];
                const anilistId = result.anilist;
                const videoUrl = result.video || '';
                const sceneImageUrl = result.image || '';
                console.log('Original Video URL:', videoUrl);
                console.log('Original Image URL:', sceneImageUrl);

                // Fetch image directly from trace.moe API
                const imgResponse = await fetch(sceneImageUrl);
                const imgBlob = await imgResponse.blob();
                const imgUrl = URL.createObjectURL(imgBlob);
                console.log('Image URL:', imgUrl);

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
            endTotalFetch = performance.now();

            console.log('Timing Measurements:');
            console.log(`Total Fetch Time: ${endTotalFetch - startTotalFetch} ms`);
            console.log(`trace.moe API Fetch Time: ${endTraceMoeFetch - startTraceMoeFetch} ms`);
            console.log(`trace.moe API Response Parsing Time: ${endTraceMoeParse - startTraceMoeParse} ms`);
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
            }
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
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

    // Initially show upload section
    showUploadSection();
});
