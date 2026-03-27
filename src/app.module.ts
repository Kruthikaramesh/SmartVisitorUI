//import { NgModule } from '@angular/core';
//import { BrowserModule } from '@angular/platform-browser';
//import { RouterModule, Routes } from '@angular/router';   // ✅ import RouterModule directly
//import { AppComponent } from './app.component';

//// ✅ Define all routes here since there is no app-routing.module.ts
//const routes: Routes = [

//  // Welcome page — loads at root '/'
//  {
//    path: '',
//    loadChildren: () =>
//      import('./features/welcome/welcome.module').then(m => m.WelcomeModule)
//  },

//  // Check In card → login page
//  {
//    path: 'check-in',
//    loadChildren: () =>
//      import('./features/auth/auth-module').then(m => m.AuthModule)
//  },

//  // Check Out card → login page
//  {
//    path: 'check-out',
//    loadChildren: () =>
//      import('./features/auth/auth-module').then(m => m.AuthModule)
//  },

//  // Fallback — any unknown URL goes back to welcome
//  {
//    path: '**',
//    redirectTo: ''
//  }

//];

//@NgModule({
//  declarations: [
//    AppComponent
//  ],
//  imports: [
//    BrowserModule,
//    RouterModule.forRoot(routes)   // ✅ routes registered directly here
//  ],
//  providers: [],
//  bootstrap: [AppComponent]
//})
//export class AppModule { }
