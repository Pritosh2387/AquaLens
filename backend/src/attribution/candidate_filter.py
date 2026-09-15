from typing import List, Dict, Any, Tuple
from src.ais.matcher import calculate_geodesic_distance_km
from src.data_processing.temporal_alignment import parse_timestamp


def filter_candidate_vessels(
    ais_records: List[Dict[str, Any]],
    origin_result: Dict[str, Any],
    max_distance_km: float = 15.0
) -> List[Dict[str, Any]]:
    """
    Filters all AIS records to candidate vessels that passed near the estimated spill origin
    around the estimated release interval.
    """
    origin_centroid = origin_result.get("origin_centroid", [12.40, 72.40])
    origin_lat, origin_lon = origin_centroid[0], origin_centroid[1]

    # Group AIS records by MMSI
    vessels_by_mmsi = {}
    for r in ais_records:
        mmsi = r.get("mmsi")
        if not mmsi:
            continue
        vessels_by_mmsi.setdefault(mmsi, []).append(r)

    candidates = []

    for mmsi, records in vessels_by_mmsi.items():
        # Find minimum distance of vessel trajectory to origin centroid
        min_dist_km = float("inf")
        closest_record = None

        for rec in records:
            r_lat = rec.get("lat")
            r_lon = rec.get("lon")
            if r_lat is not None and r_lon is not None:
                d = calculate_geodesic_distance_km((origin_lat, origin_lon), (r_lat, r_lon))
                if d < min_dist_km:
                    min_dist_km = d
                    closest_record = rec

        if min_dist_km <= max_distance_km and closest_record is not None:
            candidates.append({
                "mmsi": mmsi,
                "vessel_name": closest_record.get("vessel_name", "UNKNOWN"),
                "min_origin_distance_km": round(min_dist_km, 3),
                "closest_record": closest_record,
                "all_records": records
            })

    return candidates
