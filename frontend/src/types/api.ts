
export interface HealthResponse {
  status: string;
  service: string;
  mode: string;
  version: string;
  modules: Record<string, string>;
}

export interface SceneRequest {
  scene_id?: string;
  config_path?: string;
}

export interface PipelineRequest extends SceneRequest {
  include_modules_11_15?: boolean;
}

export interface PipelineRequestExtended extends SceneRequest {
  include_modules_11_15?: boolean;
  include_modules_16_17?: boolean;
}

export interface ResourceOverride {
  type: string;
  count?: number;
  speed_knots?: number | null;
  capacity_tons?: number | null;
  range_km?: number | null;
  home_lat?: number | null;
  home_lon?: number | null;
}

export interface AlternativeAllocation {
  resource_type: string;
  target_asset: string;
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // [lon, lat]
}

export type Module1Request = SceneRequest;
export type Module2Request = SceneRequest;
export type Module3Request = SceneRequest;
export type Module4Request = SceneRequest;
export type Module5Request = SceneRequest;
export type Module6Request = SceneRequest;
export type Module7Request = SceneRequest;
export type Module8Request = SceneRequest;
export type Module9Request = SceneRequest;
export type Module10Request = SceneRequest;
export type Module11Request = SceneRequest;
export type Module12Request = SceneRequest;

export interface Module13Request extends SceneRequest {
  resource_override?: ResourceOverride[] | null;
}

export interface Module14Request extends SceneRequest {
  delay_hours?: number;
  additional_resource_type?: string;
  additional_resource_count?: number;
  alternative_allocation?: AlternativeAllocation[] | null;
}

export interface Module15Request {
  predicted_polygon: GeoJSONPolygon;
  observed_polygon: GeoJSONPolygon;
  predicted_horizon_hours?: number | null;
  prediction_made_timestamp?: string | null;
  observation_timestamp?: string | null;
  spill_origin?: number[] | null;
}

export type Module16Request = SceneRequest;
export type Module17Request = SceneRequest;

export interface ApiError {
  error: string;
  message: string;
  detail?: any;
}
