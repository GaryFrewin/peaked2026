import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WallVersion {
  id: number;
  wall_id: number;
  name: string;
  model_path: string | null;
  date_created: string;
  date_modified: string;
}

export interface Wall {
  id: number;
  name: string;
  created_by: number;
  date_created: string;
  date_modified: string;
  wall_versions: WallVersion[];
}

export interface WallsResponse {
  success: boolean;
  message: string;
  data: Wall[];
}

/**
 * WALL API SERVICE
 *
 * Handles HTTP requests for climbing wall data.
 * Pure data access layer - no state management (that's in WallStore).
 *
 * Endpoints:
 * - GET /peaked/walls - Returns all walls for authenticated user
 */
@Injectable({ providedIn: 'root' })
export class WallApi {
  private readonly http = inject(HttpClient);

  /**
   * Load all walls for authenticated user
   *
   * @returns Observable of walls response
   */
  loadWalls(): Observable<WallsResponse> {
    const url = `${environment.apiUrl}/peaked/walls`;
    return this.http.get<WallsResponse>(url);
  }
}
