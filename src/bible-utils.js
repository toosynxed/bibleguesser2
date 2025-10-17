const fs = require('fs');
const path = require('path');

// Load the Bible data once when the module is loaded
const bibleData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../bible.json'), 'utf-8'));

// --- Share Code Obfuscation Logic ---

// Using generous upper bounds for chapters in a book and verses in a chapter
const MAX_CHAPTERS = 200;
const MAX_VERSES = 250;

/**
 * Encodes numeric bible reference into a single obfuscated base36 string.
 */
function encodeReference(bookIdx, chapterIdx, verseIdx) {
    // Combine indices into one unique integer
    const uniqueId = (bookIdx * MAX_CHAPTERS * MAX_VERSES) + (chapterIdx * MAX_VERSES) + verseIdx;
    // Convert the integer to a base36 string for obfuscation
    return uniqueId.toString(36);
}

/**
 * Decodes an obfuscated share code back into (book, chapter, verse) indices.
 */
function decodeReference(shareCode) {
    // Convert base36 string back to an integer
    const uniqueId = parseInt(shareCode, 36);

    const verseIdx = uniqueId % MAX_VERSES;
    const temp = Math.floor(uniqueId / MAX_VERSES);
    const chapterIdx = temp % MAX_CHAPTERS;
    const bookIdx = Math.floor(temp / MAX_CHAPTERS);
    return { bookIdx, chapterIdx, verseIdx };
}

/**
 * Finds a book in bible_data, ignoring case and spaces.
 */
function findBook(bookName) {
    const bookNameNorm = bookName.toLowerCase().replace(/\s/g, "");
    return bibleData.find(book => book.book.toLowerCase().replace(/\s/g, "") === bookNameNorm);
}

module.exports = {
    bibleData,
    encodeReference,
    decodeReference,
    findBook
};