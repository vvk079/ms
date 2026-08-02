import os
from PIL import Image

def optimize_images(directory):
    print(f"Optimizing images in {directory}...")
    
    # Create optimized directory if it doesn't exist
    # Actually, let's keep them in the same folder but with different extension for simplicity in this case, 
    # or overwriting if we really wanted to (but webp is safer non-destructive to originals).
    
    files = [f for f in os.listdir(directory) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    for filename in files:
        filepath = os.path.join(directory, filename)
        file_name_without_ext = os.path.splitext(filename)[0]
        new_filename = f"{file_name_without_ext}.webp"
        new_filepath = os.path.join(directory, new_filename)
        
        # skip if webp already exists (avoid re-processing if ran twice)
        if os.path.exists(new_filepath):
            continue
            
        try:
            with Image.open(filepath) as img:
                # Calculate new size
                width, height = img.size
                
                # Logic: Banner vs Product
                # If filename implies banner/hero, keep larger resolution
                if 'banner' in filename.lower() or 'image' in filename.lower():
                    max_width = 1920
                else:
                    max_width = 800 # Sufficient for product grid
                
                if width > max_width:
                    ratio = max_width / width
                    new_height = int(height * ratio)
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                
                # Save as WebP
                img.save(new_filepath, 'WEBP', quality=80)
                
                original_size = os.path.getsize(filepath) / 1024 # KB
                new_size = os.path.getsize(new_filepath) / 1024 # KB
                
                print(f"Converted {filename}: {original_size:.2f}KB -> {new_size:.2f}KB (Saved {original_size - new_size:.2f}KB)")
                
        except Exception as e:
            print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    optimize_images("c:/Users/Vivek/OneDrive/Desktop/ms/img")
