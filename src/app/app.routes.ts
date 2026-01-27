import { Routes } from '@angular/router';
import { AuthGuard } from './shared/services/auth/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./desktop/pages/home-page/home-page.component').then(
        (m) => m.HomePageComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./desktop/pages/login-page/login-page.component').then(
        (m) => m.LoginPageComponent
      ),
  },
  {
    path: 'vr/basic',
    loadComponent: () =>
      import('./vr/playgrounds/basic-scene/basic-scene.component').then(
        (m) => m.BasicSceneComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'vr/gltf-loader',
    loadComponent: () =>
      import('./vr/playgrounds/gltf-loader/gltf-loader-page.component').then(
        (m) => m.GltfLoaderPageComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'vr/hold-loader',
    loadComponent: () =>
      import('./vr/playgrounds/hold-loader/hold-loader-page.component').then(
        (m) => m.HoldLoaderPageComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'desktop/viewer',
    loadComponent: () =>
      import('./desktop/pages/wall-viewer/wall-viewer').then(
        (m) => m.WallViewerComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'vr/viewer',
    loadComponent: () =>
      import('./vr/pages/vr-climbing/vr-climbing').then(
        (m) => m.VrClimbingComponent
      ),
    canActivate: [AuthGuard],
  },
];
