/**
 * Individual climb log entry
 */
export interface ClimbLog {
  id: number;
  climber_id: number;
  date: string; // YYYY-MM-DD or ISO datetime
  distance: number; // meters
  grade: string; // e.g. "6a+", "7b"
  difficulty: number; // 1-10
  notes?: string;
  date_created?: string;
  date_modified?: string;
}

/**
 * API response wrapper for climb endpoints
 */
export interface ClimbsResponse {
  success: boolean;
  message: string;
  data: ClimbLog[];
}

/**
 * API response for single climb
 */
export interface ClimbResponse {
  success: boolean;
  message: string;
  data: ClimbLog;
}

/**
 * Request body for creating a new climb
 */
export interface CreateClimbRequest {
  date: string; // YYYY-MM-DD
  distance: number;
  grade: string;
  difficulty: number;
  notes?: string;
}
