from datetime import datetime, timezone
from typing import List, Dict, Any, Optional


def parse_timestamp(ts_str: str) -> datetime:
    """Parses ISO 8601 timestamp string into UTC datetime object."""
    try:
        # Handle trailing Z
        clean_ts = ts_str.replace("Z", "+00:00")
        return datetime.fromisoformat(clean_ts).astimezone(timezone.utc)
    except Exception:
        return datetime.now(timezone.utc)


def match_temporal_window(
    satellite_timestamp: str,
    observations: List[Dict[str, Any]],
    tolerance_minutes: float = 30.0
) -> List[Dict[str, Any]]:
    """
    Synchronizes satellite observations with AIS or oceanographic data.
    Filters observations to those within satellite_timestamp ± tolerance_minutes.
    """
    sat_dt = parse_timestamp(satellite_timestamp)
    matched = []

    for obs in observations:
        obs_ts = obs.get("timestamp")
        if not obs_ts:
            matched.append(obs)
            continue

        obs_dt = parse_timestamp(obs_ts)
        diff_minutes = abs((sat_dt - obs_dt).total_seconds()) / 60.0

        if diff_minutes <= tolerance_minutes:
            obs_copy = obs.copy()
            obs_copy["time_delta_minutes"] = round(diff_minutes, 2)
            matched.append(obs_copy)

    return matched
