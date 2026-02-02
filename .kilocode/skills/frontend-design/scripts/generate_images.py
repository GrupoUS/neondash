# To run this code you need to install the following dependencies:
# pip install google-genai>=1.52.0

import mimetypes
import os
import sys
from google import genai
from google.genai import types

# API Key will be loaded from environment
API_KEY = os.environ.get("GEMINI_API_KEY")

def load_env():
    """Simple helper to load GEMINI_API_KEY from .env.local if not in environment."""
    if os.environ.get("GEMINI_API_KEY"):
        return

    # Try to find .env.local relative to script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.abspath(os.path.join(script_dir, "../../../../.env.local"))

    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("GEMINI_API_KEY="):
                    key = line.split("=", 1)[1].strip()
                    os.environ["GEMINI_API_KEY"] = key
                    break

def save_binary_file(file_name, data):
    with open(file_name, "wb") as f:
        f.write(data)
    print(f"File saved to: {file_name}")

def generate(prompt, output_file_base="generated_image", aspect_ratio="16:9"):
    """
    Generate images using Nano Banana Pro (gemini-3-pro-image-preview).
    
    Args:
        prompt: Text description of the image to generate
        output_file_base: Base filename for output (without extension)
        aspect_ratio: Image aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4)
    """
    load_env()
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    # Nano Banana Pro - Google's most advanced image generation model
    # https://ai.google.dev/gemini-api/docs/image-generation
    model = "gemini-3-pro-image-preview"
    
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["Text", "Image"],
            image_config=types.ImageConfig(
                aspect_ratio=aspect_ratio,
            ),
        ),
    )

    file_index = 0
    for part in response.parts:
        if part.text is not None:
            print(part.text)
        elif hasattr(part, 'inline_data') and part.inline_data and part.inline_data.data:
            inline_data = part.inline_data
            data_buffer = inline_data.data
            file_extension = mimetypes.guess_extension(inline_data.mime_type) or ".png"
            file_name = f"{output_file_base}_{file_index}{file_extension}"
            save_binary_file(file_name, data_buffer)
            file_index += 1

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_images.py \"your prompt here\" [output_file_base] [aspect_ratio]")
        print("Model: gemini-3-pro-image-preview (Nano Banana Pro)")
        print("Aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4")
        sys.exit(1)

    user_prompt = sys.argv[1]
    output_base = sys.argv[2] if len(sys.argv) > 2 else "generated_image"
    ratio = sys.argv[3] if len(sys.argv) > 3 else "16:9"
    generate(user_prompt, output_base, ratio)
