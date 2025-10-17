import json
import re
import os

BIBLE_JSON_PATH = 'bible.json'
NEW_VERSES_PATH = 'bible_import_ready.txt'

def parse_verse_line(line):
    """Parses a line like 'Book Chapter:Verse Text' into components."""
    # Regex to capture Book name (can include a number like '1 John'), chapter, verse, and text
    match = re.match(r'^(\d?\s?[a-zA-Z\s]+?)\s(\d+):(\d+)\s(.+)', line.strip())
    if match:
        book_name = match.group(1).strip()
        chapter_num = int(match.group(2))
        verse_num = int(match.group(3))
        text = match.group(4).strip()
        return book_name, chapter_num, verse_num, text
    return None

def add_verse_to_data(bible_data, book_name, chapter_num, verse_num, text):
    """Adds a verse to the bible data structure, creating book/chapter if needed."""
    # Find book
    book_obj = next((b for b in bible_data if b['book'].lower() == book_name.lower()), None)
    if not book_obj:
        book_obj = {"book": book_name, "chapters": []}
        bible_data.append(book_obj)
        print(f"Created new book: {book_name}")

    # Find chapter
    chapter_obj = next((c for c in book_obj['chapters'] if c['chapter'] == chapter_num), None)
    if not chapter_obj:
        chapter_obj = {"chapter": chapter_num, "verses": []}
        book_obj['chapters'].append(chapter_obj)
        print(f"Created new chapter: {book_name} {chapter_num}")

    # Check if verse already exists
    if not any(v['verse'] == verse_num for v in chapter_obj['verses']):
        chapter_obj['verses'].append({"verse": verse_num, "text": text})
        print(f"  Added: {book_name} {chapter_num}:{verse_num}")
    else:
        print(f"  Skipped (already exists): {book_name} {chapter_num}:{verse_num}")

def main():
    """Main function to run the importer."""
    if not os.path.exists(NEW_VERSES_PATH):
        print(f"Error: '{NEW_VERSES_PATH}' not found. Please create it.")
        return

    # Load existing bible data
    try:
        with open(BIBLE_JSON_PATH, 'r', encoding='utf-8') as f:
            bible_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        bible_data = []

    # Read and process new verses
    with open(NEW_VERSES_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            if parsed := parse_verse_line(line):
                add_verse_to_data(bible_data, *parsed)

    # Write updated data back to bible.json
    with open(BIBLE_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(bible_data, f, indent=4, ensure_ascii=False)

    print("\nBible import complete!")

if __name__ == '__main__':
    main()