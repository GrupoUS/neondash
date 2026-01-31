import json
import argparse
import sys
from typing import List, Dict, Any

def rich_text_to_md(rich_text_array: List[Dict[str, Any]]) -> str:
    """Convert Notion rich text array to Markdown string."""
    md_text = ""
    for segment in rich_text_array:
        content = segment.get("plain_text", "")
        annotations = segment.get("annotations", {})

        # Apply link first
        href = segment.get("href")
        if href:
            content = f"[{content}]({href})"

        # Apply styles (order matters for nesting, though simple nesting is tricky)
        if annotations.get("code"):
            content = f"`{content}`"
        if annotations.get("bold"):
            content = f"**{content}**"
        if annotations.get("italic"):
            content = f"*{content}*"
        if annotations.get("strikethrough"):
            content = f"~~{content}~~"

        md_text += content
    return md_text

def block_to_md(block: Dict[str, Any], depth=0) -> str:
    """Convert a single Notion block to Markdown."""
    btype = block.get("type")
    content = block.get(btype, {})
    rich_text = content.get("rich_text", [])
    text = rich_text_to_md(rich_text)

    indent = "  " * depth
    md = ""

    if btype == "paragraph":
        md = f"{indent}{text}\n\n"
    elif btype == "heading_1":
        md = f"{indent}# {text}\n\n"
    elif btype == "heading_2":
        md = f"{indent}## {text}\n\n"
    elif btype == "heading_3":
        md = f"{indent}### {text}\n\n"
    elif btype == "bulleted_list_item":
        md = f"{indent}- {text}\n"
    elif btype == "numbered_list_item":
        md = f"{indent}1. {text}\n"
    elif btype == "to_do":
        checked = "x" if content.get("checked") else " "
        md = f"{indent}- [{checked}] {text}\n"
    elif btype == "toggle":
        md = f"{indent}<details><summary>{text}</summary>\n"
    elif btype == "code":
        lang = content.get("language", "")
        md = f"{indent}```{lang}\n{text}\n{indent}```\n\n"
    elif btype == "quote":
        md = f"{indent}> {text}\n\n"
    elif btype == "callout":
        emoji = content.get("icon", {}).get("emoji", "💡")
        md = f"{indent}> {emoji} **{text}**\n\n"
    elif btype == "image":
        url = content.get("file", {}).get("url") or content.get("external", {}).get("url")
        caption_arr = content.get("caption", [])
        caption = rich_text_to_md(caption_arr)
        md = f"{indent}![{caption}]({url})\n\n"
    elif btype == "divider":
        md = f"{indent}---\n\n"
    else:
        # Fallback for unsupported types
        pass

    # Recursion for children (if included in the JSON structure usually as 'children' key)
    # Note: Standard Notion API doesn't nest children in the block object by default,
    # but our Agent workflow might construct a nested JSON.
    # This script assumes 'results' or 'children' might contain nested blocks.
    children = block.get("children", [])
    # Or specifically for our manual construction logic:
    if "results" in block: # Sometimes passed as a list of blocks
        pass

    return md

def convert_json_to_md(input_file: str, output_file: str, frontmatter: str = None):
    try:
        with open(input_file, 'r') as f:
            data = json.load(f)

        md_output = ""

        # Identify if data is a list of blocks or a wrapper
        blocks = []
        if isinstance(data, list):
            blocks = data
        elif isinstance(data, dict):
            if "results" in data:
                blocks = data["results"]
            elif "object" in data and data["object"] == "list":
                 blocks = data["results"]
            else:
                # Single block or page object?
                # If page object, ignore page props here (handled via frontmatter)
                pass

        # Frontmatter
        if frontmatter:
            try:
                fm_dict = json.loads(frontmatter)
                md_output += "---\n"
                for k, v in fm_dict.items():
                    md_output += f"{k}: {v}\n"
                md_output += "---\n\n"
            except json.JSONDecodeError:
                print(f"Warning: Invalid frontmatter JSON: {frontmatter}")

        # Convert blocks
        for block in blocks:
            md_output += block_to_md(block)

        # Output
        if output_file:
            with open(output_file, 'w') as f:
                f.write(md_output)
            print(f"✅ Successfully wrote markdown to {output_file}")
        else:
            print(md_output)

    except Exception as e:
        print(f"Error converting JSON to Markdown: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert Notion Block JSON to Markdown")
    parser.add_argument("input", help="Input JSON file containing Notion blocks")
    parser.add_argument("--output", "-o", help="Output Markdown file path")
    parser.add_argument("--frontmatter", "-f", help="JSON string of frontmatter key-values")

    args = parser.parse_args()
    convert_json_to_md(args.input, args.output, args.frontmatter)
