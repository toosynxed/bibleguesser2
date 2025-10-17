import re
import json
import sys

def create_bible_json(input_filename='pg10.txt', output_filename='bible.json'):
    """
    Parses a plaintext Bible file and converts it into a structured JSON format.

    This function handles:
    - Identifying book titles, including alternate names.
    - Parsing chapter and verse numbers.
    - Correctly assembling multi-line verses.
    - Handling multiple verses that appear on a single line.
    """
    try:
        with open(input_filename, 'r', encoding='utf-8') as f:
            content = f.read()
        # Normalize line endings and remove BOM if present
        content = content.replace('\r\n', '\n').lstrip('\ufeff')
    except FileNotFoundError:
        print(f"Error: Input file '{input_filename}' not found.")
        return

    bible_data = []

    # Regex to find book titles. This looks for lines that are clearly titles,
    # like "The First Book of Moses: Called Genesis" or just "THE BOOK OF HAGGAI".
    # It looks for "Book of" or lines in all caps followed by a blank line.
    book_pattern = re.compile(r'^(The (First|Second|Third|Fourth|Fifth) Book of .+|The Book of .+|The Gospel According to.+|The Acts of the Apostles|The Revelation of Saint John the Divine|[A-Z][a-z]{2,}(\s[A-Z][a-z]+)*)(?=\n\n)', re.MULTILINE | re.IGNORECASE)

    # Regex to find verse references like "1:1", "10:23", etc. at the start of a line.
    verse_pattern = re.compile(r'^(\d+:\d+)\s(.+)', re.MULTILINE)
    
    print("Starting Bible parsing...")

    # Find all book titles and their starting positions
    book_matches = list(book_pattern.finditer(content))

    if not book_matches:
        print("Error: No book titles found. Check the regex pattern and input file format.")
        return

    for i, current_match in enumerate(book_matches):
        # --- Book Detection and Cleaning ---
        raw_title = current_match.group(0).strip()

        # Comprehensive cleaning and mapping
        # 1. Remove common prefixes and suffixes
        cleaned_title = re.sub(r'^(The|the)\s+', '', raw_title)
        cleaned_title = re.sub(r'^(Book of the Prophet|Book of the|The Book of|Book of|Gospel According to|General Epistle of|Epistle General of|The Epistle of Paul the Apostle to)\s+', '', cleaned_title, flags=re.IGNORECASE)
        cleaned_title = re.sub(r'\s+of the Apostles', '', cleaned_title, flags=re.IGNORECASE)
        cleaned_title = re.sub(r': Called', '', cleaned_title, flags=re.IGNORECASE)
        cleaned_title = re.sub(r'(Saint| of Jeremiah)\s*', '', cleaned_title, flags=re.IGNORECASE)

        # 2. Handle numbered books
        cleaned_title = cleaned_title.replace("First", "1").replace("Second", "2").replace("Third", "3")

        # 3. Specific common name variations from text files
        corrections = {
            "1 Moses Genesis": "Genesis",
            "2 Book of Moses Exodus": "Exodus",
            "3 Book of Moses Leviticus": "Leviticus",
            "Fourth Moses Numbers": "Numbers",
            "Fifth Moses Deuteronomy": "Deuteronomy",
            "1 Samuel Otherwise The First Kings": "1 Samuel",
            "2 Samuel Otherwise The Second Kings": "2 Samuel",
            "1 Kings Commonly The Third Kings": "1 Kings",
            "2 Kings Commonly The Fourth Kings": "2 Kings",
            "1 Book of the Kings": "1 Kings",
            "2 Book of the Kings": "2 Kings",
            "3 Book of the Kings": "1 Kings", # Common error in some texts
            "4 Book of the Kings": "2 Kings", # Common error in some texts
            "1 Book of the Chronicles": "1 Chronicles",
            "2 Book of the Chronicles": "2 Chronicles",
            "Lamentations": "Lamentations",
            "Revelation of Saint John the Divine": "Revelation",
            "Song of Solomon": "Song of Songs",
            "Ecclesiastes or The Preacher": "Ecclesiastes",
            "Preacher": "Ecclesiastes",
            "Acts": "Acts of the Apostles"
        }

        # Apply corrections if a match is found, otherwise use the cleaned title
        book_name = corrections.get(cleaned_title, cleaned_title).strip()

        # Skip processing for non-book titles that might be caught
        # Also skip the "***" separator between testaments
        if not book_name or len(book_name) > 50 or "***" in book_name:
            continue

        print(f"Processing book: {book_name}")
        current_book = {"book": book_name, "chapters": []}
        bible_data.append(current_book)
        
        # --- Verse and Chapter Parsing ---
        start_pos = current_match.end()
        # The content of the book is from the end of its title to the start of the next title
        end_pos = book_matches[i+1].start() if i + 1 < len(book_matches) else len(content)
        book_content = content[start_pos:end_pos]

        verses = verse_pattern.finditer(book_content or "")
        current_chapter_num = -1
        current_chapter_obj = None

        for match in verses:
            ref, text = match.groups()
            text = text.replace('\n', ' ').strip()

            try:
                chapter_num, verse_num = map(int, ref.split(':'))
            except ValueError:
                continue # Skip malformed verse lines

            # If it's a new chapter, create a new chapter object
            if chapter_num != current_chapter_num:
                current_chapter_obj = {"chapter": chapter_num, "verses": []}
                current_book['chapters'].append(current_chapter_obj)
                current_chapter_num = chapter_num

            # Handle cases where multiple verses are on one line (e.g., "text... 3:11 text...")
            # We split the text by any subsequent verse markers
            sub_verses = re.split(r'(\d+:\d+)', text)
            
            # The first part is always the text for the current verse
            verse_obj = {
                "verse": verse_num,
                "text": sub_verses[0].strip(),
                "reference": f"{current_book['book']} {chapter_num}:{verse_num}"
            }
            current_chapter_obj['verses'].append(verse_obj)

            # If there were other verse markers, process them too
            if len(sub_verses) > 1:
                for j in range(1, len(sub_verses), 2):
                    try:
                        next_ref, next_text = sub_verses[j], sub_verses[j+1]
                        next_chap, next_verse = map(int, next_ref.split(':'))
                        verse_obj = {
                            "verse": next_verse,
                            "text": next_text.strip(),
                            "reference": f"{current_book['book']} {next_chap}:{next_verse}"
                        }
                        current_chapter_obj['verses'].append(verse_obj)
                    except (ValueError, IndexError):
                        continue # Ignore malformed parts        

    print(f"Parsing complete. Found {len(bible_data)} books.")

    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(bible_data, f, indent=2)
        print(f"Successfully created '{output_filename}'.")
    except IOError as e:
        print(f"Error writing to file '{output_filename}': {e}")

if __name__ == '__main__':
    # Allows specifying files from command line, e.g., python format_bible.py my_bible.txt my_bible.json
    create_bible_json(*sys.argv[1:])