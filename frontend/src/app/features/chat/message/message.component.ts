import { BotAvatarComponent } from '../bot-avatar/bot-avatar.component';
import { Component, input } from '@angular/core';
import { ChatMessage } from '../../../core/models/chat-message.model';

@Component({
  selector: 'app-message',
  imports: [BotAvatarComponent],
  template: `<article [class.user]="message().role === 'user'">
    <h2>@if (message().role !== 'user') { <app-bot-avatar /> } {{ message().role === 'user' ? 'YOU' : 'TARA · JYOTISH AI' }}</h2>
    <p>{{ message().content }}</p>
  </article>`,
  styles: `
    article {
      padding: 22px 0;
      animation: rise-in 0.35s ease both;
    }
    h2 {
      display: flex; align-items: center; gap: 12px;
      font-size: 11px;
      letter-spacing: 1.5px;
      color: var(--accent);
      margin: 0 0 12px;
    }
    p {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      line-height: 1.85;
      font-size: 15px;
      margin: 0;
    }
    .user {
      margin-left: auto;
      max-width: 85%;
      text-align: right;
    }
    .user h2 {
      justify-content: flex-end;
      color: var(--muted);
    }
    .user p {
      display: inline-block;
      text-align: left;
      background: var(--bubble);
      padding: 14px 20px;
      border-radius: 18px;
    }
  `,
})
export class MessageComponent {
  message = input.required<ChatMessage>();
}
