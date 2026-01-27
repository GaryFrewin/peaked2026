/**
 * Climbing hold with position and usage statistics
 */
export interface Hold {
  id: number;
  wall_version_id: number;
  x: number;
  y: number;
  z: number;
  usage_count: number;
  date_created: string;
  date_modified: string;
}

/**
 * API response for holds endpoint
 */
export interface HoldsResponse {
  data: Hold[];
  message: string;
  success: boolean;
}
