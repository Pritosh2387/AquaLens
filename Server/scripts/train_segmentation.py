import sys
import os

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.oil_spill_detection.train import train_unet_model

if __name__ == "__main__":
    config_path = sys.argv[1] if len(sys.argv) > 1 else "configs/config.yaml"
    train_unet_model(config_path)
