import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly email = signal(environment.production ? '' : environment.devEmail);
  protected readonly password = signal(environment.production ? '' : environment.devPassword);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isLoading = signal(false);

  onSubmit(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.email(), this.password()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.errorMessage.set('Login failed. Please check your credentials.');
        this.isLoading.set(false);
      },
    });
  }
}
