import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import './app/shared/aframe-components/route-hold-renderer.aframe';
import './app/shared/aframe-components/drag-hold.aframe';
import './app/vr/behaviours/selected-hold';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
