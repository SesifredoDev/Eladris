import os
import re

def count_words(text):
    # Strip Markdown formatting and count words
    text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)  # remove code blocks
    text = re.sub(r'`[^`]+`', '', text)                     # remove inline code
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)             # remove images
    text = re.sub(r'\[.*?\]\(.*?\)', '', text)              # remove links
    text = re.sub(r'[^\w\s]', '', text)                     # remove punctuation
    words = re.findall(r'\b\w+\b', text)
    return len(words)

def count_words_in_markdown_files(root_dir):
    total_words = 0
    results = []

    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.lower().endswith('.md'):
                path = os.path.join(dirpath, filename)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    word_count = count_words(content)
                    results.append((path, word_count))
                    total_words += word_count

    return results, total_words

if __name__ == "__main__":
    import sys
    folder = sys.argv[1] if len(sys.argv) > 1 else "."
    results, total = count_words_in_markdown_files(folder)

    print("\nWord counts by file:")
    for path, count in results:
        print(f"{path}: {count} words")

    print(f"\nTotal word count: {total} words")
