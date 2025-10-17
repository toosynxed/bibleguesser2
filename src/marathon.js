document.addEventListener('DOMContentLoaded', () => {
    const verseContainer = document.getElementById('verse-container');
    const guessInput = document.getElementById('guess-input');
    const submitGuessBtn = document.getElementById('submit-guess');
    const loadingText = document.getElementById('loading-text');
    const roundCounter = document.getElementById('round-counter');
    const nextRoundBtn = document.getElementById('next-round-btn');
    const viewResultsBtn = document.getElementById('view-results-btn');
    const shareCodeEntry = document.getElementById('share-code-entry');
    const startNewGameSection = document.getElementById('start-new-game-section');
    const shareCodeInput = document.getElementById('share-code-input');
    const loadFromCodeBtn = document.getElementById('load-from-code');
    const gameControls = document.getElementById('game-controls');
    const feedbackEl = document.getElementById('feedback');

    const CONTEXT_SIZE = 2;

    // --- State Management Utility ---
    const marathonState = {
        get: () => JSON.parse(sessionStorage.getItem('marathonState')),
        set: (state) => sessionStorage.setItem('marathonState', JSON.stringify(state)),
        clear: () => sessionStorage.removeItem('marathonState'),
        exists: () => sessionStorage.getItem('marathonState') !== null,
        update: (updates) => marathonState.set({ ...marathonState.get(), ...updates })
    };

    function initializeGame() {
        marathonState.clear();
        loadingText.textContent = 'Loading new game...';
        verseContainer.innerHTML = '';
        verseContainer.appendChild(loadingText);
        shareCodeEntry.style.display = 'none';
        startNewGameSection.style.display = 'none';
        fetch('/api/marathon-verses')
            .then(response => response.json())
            .then(data => {
                const initialState = {
                    verses: data.verses,
                    marathonShareCode: data.marathon_share_code,
                    currentRound: 0,
                    results: []
                };
                marathonState.set(initialState);
                loadRound(initialState);
            })
            .catch(error => {
                console.error('Error fetching marathon verses:', error);
                loadingText.textContent = 'Failed to load game. Please try again.';
            });
    }

    function loadFromShareCode() {
        const marathonCode = shareCodeInput.value.trim();
        if (!marathonCode) {
            alert('Please enter a marathon code.');
            return;
        }

        const individualCodes = marathonCode.split('.');
        if (individualCodes.length !== 5) {
            alert('Invalid marathon code format.');
            return;
        }

        loadingText.textContent = 'Loading shared game...';
        verseContainer.innerHTML = '';
        verseContainer.appendChild(loadingText);

        const versePromises = individualCodes.map(code =>
            fetch(`/api/verse-from-code?code=${code}&context=${CONTEXT_SIZE}`).then(res => res.json())
        );

        Promise.all(versePromises)
            .then(verses => {
                const initialState = {
                    verses: verses,
                    marathonShareCode: marathonCode,
                    currentRound: 0,
                    results: []
                };
                marathonState.set(initialState);
                loadRound(initialState);
            })
            .catch(error => {
                console.error('Error loading verses from code:', error);
                loadingText.textContent = 'Failed to load one or more verses from the code.';
            });
    }

    function loadRound(state) {
        const roundIndex = state.currentRound;
        const verseData = state.verses[roundIndex];

        shareCodeEntry.style.display = 'none';
        startNewGameSection.style.display = 'none';
        gameControls.style.display = 'block';
        feedbackEl.innerHTML = '';
        nextRoundBtn.style.display = 'none';
        viewResultsBtn.style.display = 'none';

        roundCounter.textContent = `Round ${roundIndex + 1} of 5`;
        verseContainer.innerHTML = '';
        verseData.context_verses.forEach((verse, index) => {
            const p = document.createElement('p');
            p.textContent = verse.text;
            if (index === verseData.target_verse_index_in_context) {
                p.classList.add('highlight');
            }
            verseContainer.appendChild(p);
        });

        guessInput.value = '';
        guessInput.disabled = false;
        submitGuessBtn.disabled = false;
        guessInput.focus();
    }

    function submitGuess() {
        const userGuess = guessInput.value.trim();
        if (!userGuess) {
            alert('Please enter your guess.');
            return;
        }

        const state = marathonState.get();
        const verseData = state.verses[state.currentRound];

        const payload = {
            guess: userGuess,
            verse: {
                reference: verseData.reference,
                text: verseData.context_verses[verseData.target_verse_index_in_context].text
            }
        };

        fetch('/api/check-guess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(result => {
            marathonState.update({
                results: [...state.results, result],
                currentRound: state.currentRound + 1
            });

            feedbackEl.innerHTML = `
                <p>Correct Answer: ${result.correct_answer}</p>
                <p>Your Score for this round: ${result.score}/100</p>
            `;

            guessInput.disabled = true;
            submitGuessBtn.disabled = true;

            if (marathonState.get().currentRound < 5) {
                nextRoundBtn.style.display = 'inline-block';
                nextRoundBtn.focus();
            } else {
                viewResultsBtn.style.display = 'inline-block';
                viewResultsBtn.focus();
            }
        });
    }

    function goToNextRound() {
        const state = marathonState.get();
        loadRound(state);
    }

    function viewResults() {
        window.location.href = 'marathon_result.html';
    }

    // Event Listeners
    const startNewMarathonBtn = document.getElementById('start-new-marathon');
    submitGuessBtn.addEventListener('click', submitGuess);
    guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitGuess();
    });
    nextRoundBtn.addEventListener('click', goToNextRound);
    // This button needs its event listener regardless of session state
    startNewMarathonBtn.addEventListener('click', initializeGame);
    viewResultsBtn.addEventListener('click', viewResults);
    loadFromCodeBtn.addEventListener('click', loadFromShareCode);

    // Initial Load
    if (marathonState.exists()) {
        const state = marathonState.get();
        if (state.currentRound < 5) {
            loadRound(state);
        } else {
            viewResults();
        }
    } else {
        gameControls.style.display = 'none';
        startNewGameSection.style.display = 'block';
        loadingText.textContent = 'Start a new marathon game or enter a code to begin.';
    }
});