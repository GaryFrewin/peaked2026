/**
 * A version of a climbing wall with its 3D model
 */
export interface WallVersion {
  id: number;
  wall_id: number;
  name: string;
  model_path: string | null;
  date_created: string;
  date_modified: string;
}

/**
 * A climbing wall with its versions
 */
export interface Wall {
  id: number;
  name: string;
  created_by: number;
  date_created: string;
  date_modified: string;
  wall_versions: WallVersion[];
}

/**
 * API response wrapper for walls
 */
export interface WallsResponse {
  success: boolean;
  message: string;
  data: Wall[];
}
