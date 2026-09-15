from abc import ABC, abstractmethod
import os
import json
import numpy as np
from typing import Dict, Any, Optional, Tuple


class DataLoaderBase(ABC):
    """Abstract base class for all data loaders in the pipeline."""
    
    @abstractmethod
    def load(self, source_path: str) -> Any:
        pass


class SARLoaderBase(DataLoaderBase):
    """Abstract SAR data loader."""
    
    @abstractmethod
    def load(self, source_path: str) -> np.ndarray:
        """
        TODO [REAL DATA INTEGRATION]:
        Implement Sentinel-1 SAFE package / GeoTIFF loader using rasterio or GDAL.
        Read VV / VH polarizations, radiometrically calibrate to sigma0 (dB).
        """
        pass


class MockSARLoader(SARLoaderBase):
    """Mock SAR loader reading pre-generated numpy arrays."""
    
    def load(self, source_path: str) -> np.ndarray:
        if not os.path.exists(source_path):
            raise FileNotFoundError(f"SAR mock file not found: {source_path}")
        return np.load(source_path)


class OpticalLoaderBase(DataLoaderBase):
    """Abstract Optical data loader."""
    
    @abstractmethod
    def load(self, source_path: str) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """
        TODO [REAL DATA INTEGRATION]:
        Implement Sentinel-2 L2A BOA product loader reading B02, B03, B04, B08 bands,
        resampling to common resolution (10m), and reading SCL (Scene Classification Layer) for cloud mask.
        """
        pass


class MockOpticalLoader(OpticalLoaderBase):
    """Mock Optical loader reading pre-generated numpy arrays."""
    
    def load(self, source_path: str) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        if not os.path.exists(source_path):
            raise FileNotFoundError(f"Optical mock file not found: {source_path}")
        optical = np.load(source_path)
        
        # Look for corresponding cloud mask file
        cloud_mask_path = source_path.replace("_optical.npy", "_cloud_mask.npy")
        cloud_mask = np.load(cloud_mask_path) if os.path.exists(cloud_mask_path) else None
        return optical, cloud_mask


class AISLoaderBase(DataLoaderBase):
    """Abstract AIS data loader."""
    
    @abstractmethod
    def load(self, source_path: str) -> list:
        """
        TODO [REAL DATA INTEGRATION]:
        Implement real-time AIS stream connector (NMEA/JSON WebSocket) or CSV/Parquet historical loader.
        """
        pass


class MockAISLoader(AISLoaderBase):
    """Mock AIS loader reading synthetic JSON records."""
    
    def load(self, source_path: str) -> list:
        if not os.path.exists(source_path):
            return []
        with open(source_path, "r", encoding="utf-8") as f:
            return json.load(f)


class OceanLoaderBase(DataLoaderBase):
    """Abstract Oceanographic loader."""
    
    @abstractmethod
    def load(self, source_path: str) -> Dict[str, Any]:
        """
        TODO [REAL DATA INTEGRATION]:
        Implement NetCDF loader for Copernicus Marine Service (CMEMS) or GFS wind/current grids via xarray.
        """
        pass


class MockOceanLoader(OceanLoaderBase):
    """Mock Oceanographic loader reading synthetic JSON records."""
    
    def load(self, source_path: str) -> Dict[str, Any]:
        if not os.path.exists(source_path):
            return {}
        with open(source_path, "r", encoding="utf-8") as f:
            return json.load(f)


class GeoLoaderBase(DataLoaderBase):
    """Abstract Geographic data loader."""
    
    @abstractmethod
    def load(self, source_path: str) -> Dict[str, Any]:
        """
        TODO [REAL DATA INTEGRATION]:
        Implement GeoPandas / Shapely loader reading ESRI Shapefiles / GeoPackage for marine reserves & coastlines.
        """
        pass


class MockGeoLoader(GeoLoaderBase):
    """Mock Geographic loader reading synthetic GeoJSON records."""
    
    def load(self, source_path: str) -> Dict[str, Any]:
        if not os.path.exists(source_path):
            return {}
        with open(source_path, "r", encoding="utf-8") as f:
            return json.load(f)
