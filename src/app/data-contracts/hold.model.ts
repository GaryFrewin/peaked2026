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
 * Data for creating a new hold (id is assigned by server)
 */
export interface CreateHoldRequest {
  x: number;
  y: number;
  z: number;
}

/**
 * Data for updating an existing hold position
 */
export interface UpdateHoldRequest {
  x?: number;
  y?: number;
  z?: number;
}

/**
 * API response for holds endpoint
 */
export interface HoldsResponse {
  data: Hold[];
  message: string;
  success: boolean;
}

/**
 * API response for single hold operations
 */
export interface HoldResponse {
  data: Hold;
  message: string;
  success: boolean;
}

/**
 * API response for delete operations
 */
export interface DeleteResponse {
  message: string;
  success: boolean;
}
