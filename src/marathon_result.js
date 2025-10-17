document.addEventListener('DOMContentLoaded', () => {
    const totalScoreEl = document.getElementById('total-score');
    const totalStarsEl = document.getElementById('total-stars');
    const shareCodeInput = document.getElementById('share-code');
    const copyCodeBtn = document.getElementById('copy-code-button');

    const marathonState = JSON.parse(sessionStorage.getItem('marathonState'));

    if (!marathonState || marathonState.results.length < 5) {
        // Redirect if game isn't complete
        window.location.href = 'home.html';
        return;
    }

    let totalScore = 0;
    let totalStars = 0;

    marathonState.results.forEach(result => {
        totalScore += result.score;
        if (result.stars.book) totalStars++;
        if (result.stars.chapter) totalStars++;
        if (result.stars.verse) totalStars++;
    });

    totalScoreEl.textContent = `${totalScore}/500`;
    totalStarsEl.textContent = `${totalStars}/15`;
    shareCodeInput.value = marathonState.marathonShareCode;

    copyCodeBtn.addEventListener('click', () => {
        shareCodeInput.select();
        document.execCommand('copy');
        copyCodeBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyCodeBtn.textContent = 'Copy Code';
        }, 2000);
    });

    // Clean up session storage for the next game
    sessionStorage.removeItem('marathonState');
});