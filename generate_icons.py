from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    # Dark blue background
    img = Image.new('RGB', (size, size), color='#1a1a2e')
    draw = ImageDraw.Draw(img)
    
    # Draw simple "A" text as logo
    # For a real project we'd use a font, but here let's just draw some shapes
    # A simple shield or book
    center = size // 2
    w = size // 3
    points = [
        (center, center - w),
        (center + w, center),
        (center, center + w),
        (center - w, center)
    ]
    draw.polygon(points, fill='#4a4e69')
    
    img.save(f'icons/icon-{size}x{size}.png')

create_icon(192)
create_icon(512)
