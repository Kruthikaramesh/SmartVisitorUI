import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AppInitService } from './core/services/app-init.service';

// FIX: original file was missing provideHttpClient entirely — every HTTP call
// would silently fail with "NullInjectorError: No provider for HttpClient".
// Also wires the JWT interceptor so all requests carry the Bearer token.
// Added APP_INITIALIZER to validate authentication on app startup before rendering.

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: (appInitService: AppInitService) => () => appInitService.initialize(),
      deps: [AppInitService],
      multi: true
    }
  ]
};
