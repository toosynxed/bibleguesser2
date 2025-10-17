import re

def format_bible_text(input_filename, output_filename):
    """
    Reads a plain text Bible file (like from Project Gutenberg) and formats it
    for the importer.py script.
    """
    try:
        with open(input_filename, 'r', encoding='utf-8') as f_in:
            lines = f_in.readlines()
    except FileNotFoundError:
        print(f"Error: Input file '{input_filename}' not found.")
        return

    # A mapping to get the correct book names
    book_name_map = {
        "The First Book of Moses: Called Genesis": "Genesis",
        "The Second Book of Moses: Called Exodus": "Exodus",
        "The Third Book of Moses: Called Leviticus": "Leviticus",
        "The Fourth Book of Moses: Called Numbers": "Numbers",
        "The Fifth Book of Moses: Called Deuteronomy": "Deuteronomy",
        "The Book of Joshua": "Joshua",
        "The Book of Judges": "Judges",
        "The Book of Ruth": "Ruth",
        "The First Book of Samuel": "1 Samuel",
        "The Second Book of Samuel": "2 Samuel",
        "The First Book of the Kings": "1 Kings",
        "The Second Book of the Kings": "2 Kings",
        "The First Book of the Chronicles": "1 Chronicles",
        "The Second Book of the Chronicles": "2 Chronicles",
        "Ezra": "Ezra",
        "The Book of Nehemiah": "Nehemiah",
        "The Book of Esther": "Esther",
        "The Book of Job": "Job",
        "The Book of Psalms": "Psalm",
        "The Proverbs": "Proverbs",
        "Ecclesiastes": "Ecclesiastes",
        "The Song of Solomon": "Song of Solomon",
        "The Book of the Prophet Isaiah": "Isaiah",
        "The Book of the Prophet Jeremiah": "Jeremiah",
        "The Lamentations of Jeremiah": "Lamentations",
        "The Book of the Prophet Ezekiel": "Ezekiel",
        "The Book of Daniel": "Daniel",
        "Hosea": "Hosea",
        "Joel": "Joel",
        "Amos": "Amos",
        "Obadiah": "Obadiah",
        "Jonah": "Jonah",
        "Micah": "Micah",
        "Nahum": "Nahum",
        "Habakkuk": "Habakkuk",
        "Zephaniah": "Zephaniah",
        "Haggai": "Haggai",
        "Zechariah": "Zechariah",
        "Malachi": "Malachi",
        "The Gospel According to Saint Matthew": "Matthew",
        "The Gospel According to Saint Mark": "Mark",
        "The Gospel According to Saint Luke": "Luke",
    }

    current_book = ""
    formatted_lines = []

    # Regex to find verse references like "1:23" or "12:4"
    verse_ref_regex = re.compile(r'(\d+:\d+)\s')

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Check if the line is a book title
        if line in book_name_map:
            current_book = book_name_map[line]
            print(f"Processing book: {current_book}")
            continue
        
        # Skip lines that are not part of the scripture text
        if not verse_ref_regex.match(line):
            continue

        # Handle lines that might contain multiple verses
        # Split the line by verse references
        parts = verse_ref_regex.split(line)
        # parts will be like ['', '1:1', 'text...', '1:2', 'text...']
        
        i = 1
        while i < len(parts):
            reference = parts[i].strip()
            text = parts[i+1].strip().replace('\n', ' ')
            
            # Combine with the next part if it's a continuation of the text
            if i + 2 < len(parts) and not verse_ref_regex.match(parts[i+2]):
                 text += " " + parts[i+2].strip().replace('\n', ' ')

            formatted_lines.append(f"{current_book} {reference} {text}")
            i += 2

    with open(output_filename, 'w', encoding='utf-8') as f_out:
        for line in formatted_lines:
            f_out.write(line + '\n')

    print(f"\nFormatting complete. Output saved to '{output_filename}'.")

if __name__ == '__main__':
    format_bible_text('pg10.txt', 'bible_import_ready.txt')