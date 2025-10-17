const { bibleData, encodeReference } = require('../shared/bible-utils');

const getSingleRandomVerse = (contextSize) => {
    let suitableChapterFound = false;
    let bookIndex, chapterIndex, verseIndex, randomBook, randomChapter;

    while (!suitableChapterFound) {
        bookIndex = Math.floor(Math.random() * bibleData.length);
        randomBook = bibleData[bookIndex];

        if (!randomBook.chapters || randomBook.chapters.length === 0) continue;

        chapterIndex = Math.floor(Math.random() * randomBook.chapters.length);
        randomChapter = randomBook.chapters[chapterIndex];

        if (randomChapter.verses.length > contextSize * 2) {
            suitableChapterFound = true;
        }
    }

    const minIndex = contextSize;
    const maxIndex = Math.max(minIndex, randomChapter.verses.length - 1 - contextSize);
    verseIndex = minIndex + Math.floor(Math.random() * (maxIndex - minIndex + 1));

    const targetVerseObj = randomChapter.verses[verseIndex];
    const startIndex = Math.max(0, verseIndex - contextSize);
    const endIndex = Math.min(randomChapter.verses.length, verseIndex + contextSize + 1);
    const contextVerses = randomChapter.verses.slice(startIndex, endIndex);

    const shareCode = encodeReference(bookIndex, chapterIndex, verseIndex);

    return {
        reference: `${randomBook.book} ${randomChapter.chapter}:${targetVerseObj.verse}`,
        target_verse_index_in_context: verseIndex - startIndex,
        context_verses: contextVerses,
        share_code: shareCode
    };
};

module.exports = async function (context, req) {
    const verses = Array.from({ length: 5 }, () => getSingleRandomVerse(2));
    const marathonShareCode = verses.map(v => v.share_code).join('.');

    context.res = {
        headers: { 'Content-Type': 'application/json' },
        body: {
            verses: verses,
            marathon_share_code: marathonShareCode
        }
    };
};