import os

def combine_markdown_files(root_folder, output_file):
    md_files = []

    # Walk through all directories and collect markdown file paths
    for root, _, files in os.walk(root_folder):
        for file in files:
            if file.endswith(".md"):
                full_path = os.path.join(root, file)
                md_files.append(full_path)

    # Sort files alphabetically (by path)
    md_files.sort()

    with open(output_file, "w", encoding="utf-8") as outfile:
        for md_file in md_files:
            with open(md_file, "r", encoding="utf-8") as infile:
                outfile.write(f"# {os.path.relpath(md_file, root_folder)}\n\n")
                outfile.write(infile.read())
                outfile.write("\n\n---\n\n")  # Separator between files

    print(f"Combined {len(md_files)} markdown files into {output_file}")

# Example usage:
combine_markdown_files("./", "combined_output.md")
