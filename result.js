document.addEventListener('DOMContentLoaded', () => {
    const scoreEl = document.getElementById('score');
    const userGuessEl = document.getElementById('user-guess');
    const correctAnswerEl = document.getElementById('correct-answer');
    const verseTextEl = document.getElementById('verse-text');
    const playAgainBtn = document.getElementById('play-again-button');
    const shareContainer = document.querySelector('.details-container');

    const starBook = document.getElementById('star-book');
    const starChapter = document.getElementById('star-chapter');
    const starVerse = document.getElementById('star-verse');

    // Retrieve the guess data from session storage
    const resultData = sessionStorage.getItem('guessResult');
    const shareCode = sessionStorage.getItem('share_code');

    if (!resultData) {
        // If there's no data, redirect to the main page
        window.location.href = 'bibleguesser.html';
        return;
    }

    const payload = JSON.parse(resultData);
    userGuessEl.textContent = payload.guess || 'No guess provided';

    // Send the guess to the backend to be checked
    fetch('/api/check-guess', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(data => {
        // Update the page with the results from the backend
        scoreEl.textContent = `${data.score}/100`;
        correctAnswerEl.textContent = data.correct_answer;
        verseTextEl.textContent = data.correct_text;

        // Update stars based on the result
        if (data.stars.book) starBook.classList.add('active');
        if (data.stars.chapter) starChapter.classList.add('active');
        if (data.stars.verse) starVerse.classList.add('active');

        // Add the share code button if a code exists
        if (shareCode) {
            const copyButton = document.createElement('button');
            copyButton.id = 'copy-code-button';
            copyButton.textContent = 'Copy Share Code';
            copyButton.onclick = () => {
                navigator.clipboard.writeText(shareCode).then(() => {
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => { copyButton.textContent = 'Copy Share Code'; }, 2000);
                }).catch(err => {
                    console.error('Failed to copy code: ', err);
                    alert('Failed to copy code.');
                });
            };
            shareContainer.appendChild(copyButton);
        }
    })
    .catch(error => {
        console.error('Error checking guess:', error);
        correctAnswerEl.textContent = "Error checking guess. Please try again.";
    });

    playAgainBtn.addEventListener('click', () => {
        // Clear session storage for a fresh start
        sessionStorage.removeItem('guessResult');
        sessionStorage.removeItem('share_code');
        window.location.href = 'bibleguesser.html';
    });
});