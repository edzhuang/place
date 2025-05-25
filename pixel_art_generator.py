'''
Script for inputting an image and generating a CSV file for the canvas database.
'''

import csv
import math
import argparse
import os # Added import
from PIL import Image

# Constants from src/constants/canvas.ts
CANVAS_WIDTH = 100
CANVAS_HEIGHT = 100
# COLORS_PALETTE = [ ... ] # Removed COLORS_PALETTE

# def color_distance(rgb1, rgb2): # Removed color_distance function
#     """Calculates the Euclidean distance between two RGB colors."""
#     return math.sqrt(
#         (rgb1[0] - rgb2["r"])**2 +
#         (rgb1[1] - rgb2["g"])**2 +
#         (rgb1[2] - rgb2["b"])**2
#     )

# def find_closest_palette_color(pixel_rgb, palette): # Removed find_closest_palette_color function
#     """Finds the closest color in the palette to the given RGB color."""
#     closest_color = palette[0]
#     min_dist = float('inf')
#     for color in palette:
#         dist = color_distance(pixel_rgb, color)
#         if dist < min_dist:
#             min_dist = dist
#             closest_color = color
#     return closest_color

def generate_csv_from_image(image_path, output_csv_path, placed_by_id):
    """
    Generates a CSV file for Supabase pixel data from an image
    and a preview image. The image is resized to CANVAS_WIDTH x CANVAS_HEIGHT.
    """
    try:
        img = Image.open(image_path)
    except FileNotFoundError:
        print(f"Error: Image file not found at {image_path}")
        return
    except (OSError, ValueError) as e:
        print(f"Error opening image: {e}")
        return

    # Ensure image is in RGB format
    img = img.convert("RGB")

    # Resize the image to canvas dimensions.
    # Use NEAREST for pixel art to avoid anti-aliasing.
    img_resized = img.resize((CANVAS_WIDTH, CANVAS_HEIGHT), Image.Resampling.NEAREST)

    pixels_data = []
    for y in range(CANVAS_HEIGHT):
        for x in range(CANVAS_WIDTH):
            r, g, b = img_resized.getpixel((x, y))
            # palette_color = find_closest_palette_color((r, g, b), COLORS_PALETTE) # Removed palette matching
            pixels_data.append({
                "x": x,
                "y": y,
                "r": r, # Use direct r value
                "g": g, # Use direct g value
                "b": b, # Use direct b value
                "placed_by": placed_by_id
            })

    try:
        with open(output_csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ["x", "y", "r", "g", "b", "placed_by"]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(pixels_data)
        print(f"Successfully generated CSV: {output_csv_path}")
    except IOError:
        print(f"Error: Could not write to CSV file {output_csv_path}")
    except (csv.Error, TypeError, ValueError) as e:
        print(f"An error occurred during CSV writing or data processing: {e}")

    # Generate and save the preview image
    output_image_path_base, _ = os.path.splitext(output_csv_path)
    output_image_path = output_image_path_base + ".png"
    try:
        img_resized.save(output_image_path)
        print(f"Successfully generated preview image: {output_image_path}")
    except IOError:
        print(f"Error: Could not write to image file {output_image_path}")
    except Exception as e: # Catch other Pillow/PIL errors during save
        print(f"An error occurred during image saving: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert an image to a CSV of pixels and generate a preview image." # Updated description
    )
    parser.add_argument(
        "image_path",
        type=str,
        help="Path to the input image file."
    )
    parser.add_argument(
        "--output_csv",
        type=str,
        default="pixels_seed.csv",
        help="Path for the output CSV file (default: pixels_seed.csv)."
    )
    parser.add_argument(
        "--placed_by",
        type=str,
        default="seed_script_import",
        help="Identifier for who placed the pixel (default: seed_script_import)."
    )

    args = parser.parse_args()

    generate_csv_from_image(args.image_path, args.output_csv, args.placed_by)
