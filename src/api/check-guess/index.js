const { findBook } = require('../shared/bible-utils');

module.exports = async function (context, req) {
    const { guess: userGuessStr, verse } = req.body;
    const { reference: correctReferenceStr, text: correctText } = verse || {};

    if (!userGuessStr || !correctReferenceStr) {
        context.res = { status: 400, body: "Request body must include 'guess' and 'verse.reference'." };
        return;
    }

    // --- Helper Functions ---
    const parseReference = (refStr) => {
        const match = refStr.trim().match(/^(\d?\s?[a-zA-Z\s]+?)\s+(\d+):(\d+)$/);
        if (!match) return null;
        const [, book, chapter, verse] = match;
        return { book: book.trim(), chapter: parseInt(chapter, 10), verse: parseInt(verse, 10) };
    };

    const getProximityScore = (userNum, correctNum, maxItems) => {
        if (maxItems <= 1) return userNum === correctNum ? 100 : 0;
        const distance = Math.abs(userNum - correctNum);
        return Math.max(0, 100 - Math.floor((distance / (maxItems - 1)) * 100));
    };

    // --- Main Logic ---
    const correctParts = parseReference(correctReferenceStr);
    const userParts = parseReference(userGuessStr);

    if (!userParts) {
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
                score: 0,
                stars: { book: false, chapter: false, verse: false },
                message: "Invalid format. Please use 'Book Chapter:Verse'.",
                correct_answer: correctReferenceStr,
                correct_text: correctText
            }
        };
        return;
    }

    const { book: userBookName, chapter: userChapterNum, verse: userVerseNum } = userParts;
    const { book: correctBookName, chapter: correctChapterNum, verse: correctVerseNum } = correctParts;

    const stars = { book: false, chapter: false, verse: false };
    let score = 0;
    let message = "";

    // --- Component-based Checking & Scoring ---
    const correctBookObj = findBook(correctBookName);
    const userBookObj = findBook(userBookName);

    if (!userBookObj) {
        message = `The book '${userBookName}' was not found.`;
    } else if (userBookObj.book === correctBookObj.book) { // Correct Book
        stars.book = true;
        score += 34;

        const correctChapterObj = correctBookObj.chapters.find(c => c.chapter === correctChapterNum);
        const userChapterObj = userBookObj.chapters.find(c => c.chapter === userChapterNum);

        if (!userChapterObj) {
            message = `Chapter ${userChapterNum} does not exist in the book of ${userBookName}.`;
            score += getProximityScore(userChapterNum, correctChapterNum, correctBookObj.chapters.length) * 0.33;
        } else if (userChapterNum === correctChapterNum) { // Correct Chapter
            stars.chapter = true;
            score += 33;

            const userVerseObj = userChapterObj.verses.find(v => v.verse === userVerseNum);
            const distance = Math.abs(userVerseNum - correctVerseNum);

            if (!userVerseObj) {
                message = `Verse ${userVerseNum} does not exist in ${userBookName} ${userChapterNum}.`;
                score += Math.max(0, 33 - distance);
            } else if (userVerseNum === correctVerseNum) { // Correct Verse
                stars.verse = true;
                score += 33;
                message = "Perfect guess!";
            } else { // Correct book and chapter, wrong verse
                message = "You have the right book and chapter, but the verse is off.";
                score += Math.max(0, 33 - distance);
            }
        } else { // Correct book, wrong chapter
            message = "You have the right book, but the chapter is off.";
            score += getProximityScore(userChapterNum, correctChapterNum, correctBookObj.chapters.length) * 0.33;
        }
    } else { // Wrong book
        message = "Your guessed book is incorrect.";
    }

    context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
            score: Math.round(score),
            stars: stars,
            message: message,
            correct_answer: correctReferenceStr,
            correct_text: correctText
        }
    };
};