import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface Hold {
  id: number;
  position: { x: number; y: number; z: number };
  scale: number;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class HoldApiService {
  private readonly http = inject(HttpClient);

  readonly holds = signal<Hold[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  loadHolds(wallId: string, versionId: string): void {
    // Guard: Skip if already loading
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);

    const url = `${environment.apiUrl}/peaked/walls/${wallId}/versions/${versionId}/holds-plus`;

    this.http.get<{ holds: Hold[] }>(url).subscribe({
      next: (response) => {
        this.holds.set(response.holds);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(`Failed to load holds: ${err.statusText || err.message}`);
        this.isLoading.set(false);
      }
    });
  }

  clear(): void {
    this.holds.set([]);
    this.isLoading.set(false);
    this.error.set(null);
  }
}
