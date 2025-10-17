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

    // Retrieve the full result data from session storage
    const resultJSON = sessionStorage.getItem('guessResult');

    if (!resultJSON) {
        // If there's no data, redirect to the main page
        window.location.href = 'bibleguesser.html';
        return;
    }

    const resultData = JSON.parse(resultJSON);

    // Update the page with the results from session storage
    scoreEl.textContent = `${resultData.score}/100`;
    userGuessEl.textContent = resultData.user_guess || 'No guess provided';
    correctAnswerEl.textContent = resultData.correct_answer;
    verseTextEl.textContent = resultData.correct_text;

    // Update stars based on the result
    if (resultData.stars.book) starBook.classList.add('active');
    if (resultData.stars.chapter) starChapter.classList.add('active');
    if (resultData.stars.verse) starVerse.classList.add('active');

    // Add the share code button if a code exists
    const shareCode = resultData.share_code;
    if (shareCode) {
        const copyButton = document.createElement('button');
        copyButton.id = 'copy-button';
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

    playAgainBtn.addEventListener('click', () => {
        // Clear session storage for a fresh start
        sessionStorage.removeItem('guessResult');
        window.location.href = 'bibleguesser.html';
    });
});