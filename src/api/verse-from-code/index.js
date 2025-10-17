const { bibleData, decodeReference } = require('../shared/bible-utils');

module.exports = async function (context, req) {
    const shareCode = req.query.code;
    const contextSize = parseInt(req.query.context || '0', 10);

    if (!shareCode) {
        context.res = { status: 400, body: "Query parameter 'code' is required." };
        return;
    }

    try {
        const { bookIdx, chapterIdx, verseIdx } = decodeReference(shareCode);

        const book = bibleData[bookIdx];
        const chapter = book.chapters[chapterIdx];
        const targetVerseObj = chapter.verses[verseIdx];

        const startIndex = Math.max(0, verseIdx - contextSize);
        const endIndex = Math.min(chapter.verses.length, verseIdx + contextSize + 1);
        const contextVerses = chapter.verses.slice(startIndex, endIndex);

        const responseData = {
            reference: `${book.book} ${chapter.chapter}:${targetVerseObj.verse}`,
            target_verse_index_in_context: verseIdx - startIndex,
            context_verses: contextVerses,
            share_code: shareCode
        };

        context.res = {
            headers: { 'Content-Type': 'application/json' },
            body: responseData
        };
    } catch (error) {
        context.res = {
            status: 400,
            body: { error: "Invalid or expired share code." }
        };
    }
};