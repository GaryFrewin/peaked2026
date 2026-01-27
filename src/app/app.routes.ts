import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'vr/basic',
    pathMatch: 'full',
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
  },
  {
    path: 'vr/gltf-loader',
    loadComponent: () =>
      import('./vr/playgrounds/gltf-loader/gltf-loader-page.component').then(
        (m) => m.GltfLoaderPageComponent
      ),
  },
  {
    path: 'vr/hold-loader',
    loadComponent: () =>
      import('./vr/playgrounds/hold-loader/hold-loader-page.component').then(
        (m) => m.HoldLoaderPageComponent
      ),
  },
];
