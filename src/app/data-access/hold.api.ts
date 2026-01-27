import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateHoldRequest,
  DeleteResponse,
  Hold,
  HoldResponse,
  HoldsResponse,
  UpdateHoldRequest,
} from '../data-contracts/hold.model';

/**
 * HOLD API SERVICE
 *
 * Handles HTTP requests for climbing hold data.
 * Pure data access layer - no state management (that's in HoldStore).
 *
 * Endpoints:
 * - GET    /peaked/walls/{wallId}/versions/{versionId}/holds-plus  - Load holds with usage stats
 * - POST   /peaked/walls/{wallId}/versions/{versionId}/holds       - Create hold
 * - PUT    /peaked/walls/{wallId}/versions/{versionId}/holds/{id}  - Update hold position
 * - DELETE /peaked/walls/{wallId}/versions/{versionId}/holds/{id}  - Delete hold
 */
@Injectable({ providedIn: 'root' })
export class HoldApi {
  private readonly http = inject(HttpClient);

  /**
   * Build base URL for hold endpoints
   */
  private baseUrl(wallId: number, versionId: number): string {
    return `${environment.apiUrl}/peaked/walls/${wallId}/versions/${versionId}/holds`;
  }

  /**
   * Load holds for a specific wall version (with usage statistics)
   */
  loadHolds(wallId: string, versionId: string): Observable<HoldsResponse> {
    const url = `${environment.apiUrl}/peaked/walls/${wallId}/versions/${versionId}/holds-plus`;
    return this.http.get<HoldsResponse>(url);
  }

  /**
   * Create a new hold
   */
  createHold(wallId: number, versionId: number, data: CreateHoldRequest): Observable<HoldResponse> {
    return this.http.post<HoldResponse>(this.baseUrl(wallId, versionId), data);
  }

  /**
   * Update an existing hold's position
   */
  updateHold(
    wallId: number,
    versionId: number,
    holdId: number,
    data: UpdateHoldRequest
  ): Observable<HoldResponse> {
    return this.http.put<HoldResponse>(`${this.baseUrl(wallId, versionId)}/${holdId}`, data);
  }

  /**
   * Delete a hold
   */
  deleteHold(wallId: number, versionId: number, holdId: number): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(`${this.baseUrl(wallId, versionId)}/${holdId}`);
  }
}
