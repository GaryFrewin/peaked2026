import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import './app/shared/aframe-components/route-hold-renderer.aframe';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
