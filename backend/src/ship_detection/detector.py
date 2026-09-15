from abc import ABC, abstractmethod
import numpy as np
from typing import List, Dict, Any, Tuple


class ShipDetectorBase(ABC):
    """
    Abstract interface for satellite physical ship detectors.
    Allows swapping YOLOv8, RT-DETR, or CFAR models.
    """
    @abstractmethod
    def detect_ships(
        self,
        sar_raw: np.ndarray,
        bbox_geo: Tuple[float, float, float, float]
    ) -> List[Dict[str, Any]]:
        """
        Detects physical vessels directly from satellite imagery.
        Must answer: 'Is there a physical vessel visible in the satellite image?'
        Independent of AIS.
        """
        pass
