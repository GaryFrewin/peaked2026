import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ClimbsResponse,
  ClimbResponse,
  CreateClimbRequest,
} from '../data-contracts/climb.model';

/**
 * CLIMB API SERVICE
 *
 * Handles HTTP requests for climb log data.
 * Pure data access layer - no state management (that's in ClimbStore).
 *
 * Endpoints:
 * - GET    /peaked/climbs           - Get climbs (with optional date filter)
 * - POST   /peaked/climbs           - Create a new climb
 * - DELETE /peaked/climbs/:id       - Delete a climb
 */
@Injectable({ providedIn: 'root' })
export class ClimbApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/peaked/climbs`;

  /**
   * Load climbs, optionally filtered by date range
   * Defaults to 1 year ago to capture all climbing history
   */
  loadClimbs(startDate?: string, endDate?: string): Observable<ClimbsResponse> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('start_date', startDate);
    }
    if (endDate) {
      params = params.set('end_date', endDate);
    }

    return this.http.get<ClimbsResponse>(this.baseUrl, { params });
  }

  /**
   * Create a new climb log entry
   */
  createClimb(climb: CreateClimbRequest): Observable<ClimbResponse> {
    return this.http.post<ClimbResponse>(this.baseUrl, climb);
  }

  /**
   * Delete a climb log entry
   */
  deleteClimb(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/${id}`
    );
  }
}
