import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WallsResponse } from '../data-contracts/wall.model';

// Re-export models for backward compatibility
export type { Wall, WallVersion, WallsResponse } from '../data-contracts/wall.model';

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
