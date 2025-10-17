document.addEventListener('DOMContentLoaded', () => {
    const verseContainer = document.getElementById('verse-container');
    const guessInput = document.getElementById('guess-input');
    const submitGuessBtn = document.getElementById('submit-guess');
    const randomVerseBtn = document.getElementById('random-verse-btn');
    const loadingText = document.getElementById('loading-text');
    const shareCodeInput = document.getElementById('share-code-input');
    const loadFromCodeBtn = document.getElementById('load-from-code');
    const difficultySlider = document.getElementById('difficulty-slider');
    const contextValueSpan = document.getElementById('context-value');

    let correctVerseData = {};
    // CONTEXT_SIZE is now managed by the slider

    /**
     * Displays the verse and its context on the page.
     * @param {object} data - The verse data from the API.
     */
    function displayVerse(data) {
        correctVerseData = {
            reference: data.reference,
            text: data.context_verses[data.target_verse_index_in_context].text
        };

        // Store the share code in the session to carry it to the results page
        sessionStorage.setItem('share_code', data.share_code);

        verseContainer.innerHTML = ''; // Clear previous verse/loading text
        data.context_verses.forEach((verse, index) => {
            const p = document.createElement('p');
            p.textContent = verse.text; // Display only the verse text
            if (index === data.target_verse_index_in_context) {
                p.classList.add('highlight'); // Highlight the target verse
                // The user's request was to show the verse to be guessed.
            }
            verseContainer.appendChild(p);
        });
        guessInput.disabled = false;
        submitGuessBtn.disabled = false;
        guessInput.focus();
    }

    /**
     * Fetches a random verse from the backend.
     */ 
    function fetchRandomVerse() {
        loadingText.textContent = 'Loading a new random verse...';
        verseContainer.innerHTML = '';
        verseContainer.wendChild(loadingText);
        guessInput.value = '';
        guessInput.disabled = true;
        submitGuessBtn.disabled = true;
        const contextSize = difficultySlider.value;

        fetch(`/api/random-verse-with-context?context=${contextSize}`)
            .then(response => response.json())
            .then(displayVerse)
            /*.catch(error => {
                // console.error('Error fetching random verse:', error);
                loadingText.textContent = 'Failed to load verse. Please try again.';
            });*/
    }

    /**
     * Fetches a verse from the backend using a share code.
     */
    function fetchVerseFromCode() {
        const code = shareCodeInput.value.trim();
        if (!code) {
            alert('Please enter a share code.');
            return;
        }

        loadingText.textContent = 'Loading verse from code...';
        verseContainer.innerHTML = '';
        verseContainer.appendChild(loadingText);
        guessInput.value = '';
        guessInput.disabled = true;
        submitGuessBtn.disabled = true;
        const contextSize = difficultySlider.value;

        fetch(`/api/verse-from-code?code=${code}&context=${contextSize}`)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.message || 'Invalid code') });
                }
                return response.json();
            })
            .then(displayVerse)
            .catch(error => {
                //console.error('Error fetching verse from code:', error);
                loadingText.textContent = `Error: ${error.message}. Please check the code or get a random verse.`;
                verseContainer.innerHTML = `<p class="error">${loadingText.textContent}</p>`;
            });
    }

    /**
     * Submits the user's guess to the backend.
     */
    function submitGuess() {
        const userGuess = guessInput.value.trim();
        if (!userGuess) {
            alert('Please enter your guess.');
            return;
        }

        const payload = {
            guess: userGuess,
            verse: correctVerseData
        };

        // Store the result in session storage and redirect
        sessionStorage.setItem('guessResult', JSON.stringify(payload));
        window.location.href = 'result.html';
    }

    // Event Listeners
    submitGuessBtn.addEventListener('click', submitGuess);
    guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitGuess();
    });
    randomVerseBtn.addEventListener('click', fetchRandomVerse);
    loadFromCodeBtn.addEventListener('click', fetchVerseFromCode);
    difficultySlider.addEventListener('input', (e) => {
        contextValueSpan.textContent = e.target.value;
    });

    // Initial load
    fetchRandomVerse();
});