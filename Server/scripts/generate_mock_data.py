import sys
import os

# Add root directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.mock_data.generate_dataset import generate_mock_dataset

if __name__ == "__main__":
    config_path = sys.argv[1] if len(sys.argv) > 1 else "configs/config.yaml"
    generate_mock_dataset(config_path)
