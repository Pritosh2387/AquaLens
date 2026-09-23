import numpy as np
import cv2
from typing import Tuple, List, Dict, Any


def generate_synthetic_slick_mask(
    shape: Tuple[int, int] = (256, 256),
    num_slicks: int = 2,
    include_lookalikes: bool = True,
    seed: int = None
) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
    """
    Generates a 2D segmentation mask with synthetic oil spills and look-alikes.
    
    Classes:
    0: Water/Background
    1: Oil Spill
    2: Look-alike (e.g. low wind area, algal bloom)
    """
    if seed is not None:
        np.random.seed(seed)

    h, w = shape
    mask = np.zeros((h, w), dtype=np.uint8)
    spill_metadata = []

    # 1. Generate Oil Slicks (Class 1)
    for i in range(num_slicks):
        cx = np.random.randint(int(w * 0.2), int(w * 0.8))
        cy = np.random.randint(int(h * 0.2), int(h * 0.8))
        
        # Elongated / curved slick shape using ellipse or random contour
        axes = (np.random.randint(15, int(w * 0.25)), np.random.randint(4, int(h * 0.08)))
        angle = np.random.randint(0, 180)
        
        slick_canvas = np.zeros((h, w), dtype=np.uint8)
        cv2.ellipse(slick_canvas, (cx, cy), axes, angle, 0, 360, 1, -1)
        
        # Add shape variation / distortion via Gaussian blur + threshold
        ksize = np.random.choice([15, 21, 25])
        blurred = cv2.GaussianBlur(slick_canvas.astype(np.float32), (ksize, ksize), 0)
        distorted_slick = (blurred > 0.3).astype(np.uint8)
        
        # Overlay onto main mask
        mask[distorted_slick == 1] = 1
        
        spill_metadata.append({
            "id": f"spill_{i+1}",
            "center": (cy, cx),
            "axes": axes,
            "angle": angle,
            "type": "oil_spill",
            "class_id": 1
        })

    # 2. Generate Look-Alike Regions (Class 2) if requested
    if include_lookalikes and np.random.rand() > 0.3:
        num_lookalikes = np.random.randint(1, 3)
        for j in range(num_lookalikes):
            cx = np.random.randint(int(w * 0.1), int(w * 0.9))
            cy = np.random.randint(int(h * 0.1), int(h * 0.9))
            
            # Look-alikes are often larger, diffuse, or irregular
            axes = (np.random.randint(20, int(w * 0.3)), np.random.randint(10, int(h * 0.2)))
            angle = np.random.randint(0, 180)
            
            lookalike_canvas = np.zeros((h, w), dtype=np.uint8)
            cv2.ellipse(lookalike_canvas, (cx, cy), axes, angle, 0, 360, 1, -1)
            
            blurred = cv2.GaussianBlur(lookalike_canvas.astype(np.float32), (31, 31), 0)
            distorted_lookalike = (blurred > 0.4).astype(np.uint8)
            
            # Avoid overwriting actual oil spill
            mask[(distorted_lookalike == 1) & (mask == 0)] = 2
            
            spill_metadata.append({
                "id": f"lookalike_{j+1}",
                "center": (cy, cx),
                "axes": axes,
                "angle": angle,
                "type": "lookalike",
                "class_id": 2
            })

    return mask, spill_metadata
