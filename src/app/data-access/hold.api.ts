import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Hold, HoldsResponse } from '../data-contracts/hold.model';

/**
 * HOLD API SERVICE
 *
 * Handles HTTP requests for climbing hold data.
 * Pure data access layer - no state management (that's in HoldStore).
 *
 * Endpoints:
 * - GET /peaked/walls/{wallId}/versions/{versionId}/holds-plus - Returns climbing holds for a wall version
 */
@Injectable({ providedIn: 'root' })
export class HoldApi {
  private readonly http = inject(HttpClient);

  /**
   * Load holds for a specific wall version
   *
   * @param wallId - Wall identifier
   * @param versionId - Wall version identifier
   * @returns Observable of holds response
   */
  loadHolds(wallId: string, versionId: string): Observable<HoldsResponse> {
    const url = `${environment.apiUrl}/peaked/walls/${wallId}/versions/${versionId}/holds-plus`;
    return this.http.get<HoldsResponse>(url);
  }
}
