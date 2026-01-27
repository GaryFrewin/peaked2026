import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'vr/basic',
    pathMatch: 'full',
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
];
