from typing import List, Dict, Any, Tuple

from src.data_processing.temporal_alignment import parse_timestamp


def detect_ais_gaps(
    vessel_ais_records: List[Dict[str, Any]],
    gap_threshold_minutes: float = 30.0
) -> Tuple[bool, float, List[Dict[str, Any]]]:
    """
    Sorts AIS records by timestamp and checks for signal gaps > gap_threshold_minutes.
    
    Returns:
        has_gap: bool
        max_gap_duration_minutes: float
        gap_details: List of gap dicts with start, end, and duration
    """
    if not vessel_ais_records or len(vessel_ais_records) < 2:
        return False, 0.0, []

    # Sort records chronologically
    sorted_records = sorted(
        vessel_ais_records,
        key=lambda r: parse_timestamp(r.get("timestamp", "2026-01-01T00:00:00Z"))
    )

    gaps = []
    max_gap_duration = 0.0

    for i in range(len(sorted_records) - 1):
        t1_dt = parse_timestamp(sorted_records[i]["timestamp"])
        t2_dt = parse_timestamp(sorted_records[i+1]["timestamp"])

        gap_minutes = (t2_dt - t1_dt).total_seconds() / 60.0

        if gap_minutes > gap_threshold_minutes:
            gaps.append({
                "gap_start": sorted_records[i]["timestamp"],
                "gap_end": sorted_records[i+1]["timestamp"],
                "gap_duration_minutes": round(gap_minutes, 1)
            })
            if gap_minutes > max_gap_duration:
                max_gap_duration = gap_minutes

    has_gap = len(gaps) > 0
    return has_gap, round(max_gap_duration, 1), gaps
