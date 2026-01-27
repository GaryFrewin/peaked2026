import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Route, RoutesResponse, RouteResponse, Style } from '../data-contracts/route.model';

/**
 * API response for styles/tags
 */
export interface StylesResponse {
  success: boolean;
  message?: string;
  data: Style[];
}

/**
 * API response for delete operations
 */
export interface DeleteResponse {
  success: boolean;
  message?: string;
}

/**
 * ROUTE API SERVICE
 *
 * Handles HTTP requests for climbing route data.
 * Pure data access layer - no state management (that's in RouteStore).
 *
 * Endpoints:
 * - GET /peaked/walls/{wallId}/versions/{versionId}/routes - Returns routes for a wall version
 * - GET /peaked/route-tags - Returns all route styles/tags
 * - POST /peaked/walls/{wallId}/versions/{versionId}/routes - Create a new route
 * - PUT /peaked/walls/{wallId}/versions/{versionId}/routes - Update an existing route
 * - DELETE /peaked/walls/{wallId}/versions/{versionId}/routes/{routeId} - Delete a route
 */
@Injectable({ providedIn: 'root' })
export class RouteApi {
  private readonly http = inject(HttpClient);

  /**
   * Load all routes for a wall version
   *
   * @param wallId - The wall ID
   * @param versionId - The wall version ID
   * @returns Observable of routes response
   */
  loadRoutes(wallId: number, versionId: number): Observable<RoutesResponse> {
    const url = `${environment.apiUrl}/peaked/walls/${wallId}/versions/${versionId}/routes`;
    return this.http.get<RoutesResponse>(url);
  }

  /**
   * Load all route styles/tags
   *
   * @returns Observable of styles response
   */
  loadStyles(): Observable<StylesResponse> {
    const url = `${environment.apiUrl}/peaked/route-tags`;
    return this.http.get<StylesResponse>(url);
  }

  /**
   * Create a new route
   *
   * @param wallId - The wall ID
   * @param versionId - The wall version ID
   * @param route - The route data to save
   * @returns Observable of the created route
   */
  saveRoute(wallId: number, versionId: number, route: Route): Observable<RouteResponse> {
    const url = `${environment.apiUrl}/peaked/walls/${wallId}/versions/${versionId}/routes`;
    return this.http.post<RouteResponse>(url, route);
  }

  /**
   * Update an existing route
   *
   * @param wallId - The wall ID
   * @param versionId - The wall version ID
   * @param route - The route data to update (must include id)
   * @returns Observable of the updated route
   */
  updateRoute(wallId: number, versionId: number, route: Route): Observable<RouteResponse> {
    const url = `${environment.apiUrl}/peaked/walls/${wallId}/versions/${versionId}/routes`;
    return this.http.put<RouteResponse>(url, route);
  }

  /**
   * Delete a route
   *
   * @param wallId - The wall ID
   * @param versionId - The wall version ID
   * @param routeId - The route ID to delete
   * @returns Observable of delete response
   */
  deleteRoute(wallId: number, versionId: number, routeId: number): Observable<DeleteResponse> {
    const url = `${environment.apiUrl}/peaked/walls/${wallId}/versions/${versionId}/routes/${routeId}`;
    return this.http.delete<DeleteResponse>(url);
  }
}
