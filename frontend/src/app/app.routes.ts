import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/chat/chat-layout/chat-layout.component').then(
        (module) => module.ChatLayoutComponent,
      ),
  },
];
