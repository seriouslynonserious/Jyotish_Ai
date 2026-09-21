import { Component, output } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  newChat = output<void>();
  readonly recentChats = ['Career prediction', 'Marriage prediction', 'Job timing'];
}
