import {
  Component,
  ElementRef,
  OnDestroy,
  afterEveryRender,
  signal,
  viewChild,
} from '@angular/core';
import { ChatMessage } from '../../../core/models/chat-message.model';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MessageComponent } from '../message/message.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';

@Component({
  selector: 'app-chat-layout',
  imports: [SidebarComponent, MessageComponent, ChatInputComponent],
  templateUrl: './chat-layout.component.html',
  styleUrl: './chat-layout.component.css',
})
export class ChatLayoutComponent implements OnDestroy {
  messages = signal<ChatMessage[]>([]);
  waiting = signal(false);
  sidebarOpen = false;
  darkMode = signal(false);
  private nextId = 1;
  private replyTimer?: ReturnType<typeof setTimeout>;
  private needsScroll = false;
  private conversation = viewChild<ElementRef<HTMLElement>>('conversation');

  constructor() {
    // Wait for Angular to paint new messages before scrolling.
    afterEveryRender(() => {
      if (!this.needsScroll) return;
      const area = this.conversation()?.nativeElement;
      if (area) area.scrollTop = area.scrollHeight;
      this.needsScroll = false;
    });
  }

  sendMessage(content: string): void {
    if (!content.trim() || this.waiting()) return;
    this.messages.set([
      ...this.messages(),
      { id: this.nextId++, role: 'user', content: content.trim() },
    ]);
    this.waiting.set(true);
    this.needsScroll = true;
    this.replyTimer = setTimeout(() => {
      this.messages.set([
        ...this.messages(),
        {
          id: this.nextId++,
          role: 'assistant',
          content:
            "I can help you explore that using Vedic astrology. This is a demo response.\n\nIn the next phase, I'll use your birth date, birth time and birthplace to calculate your chart and provide a personalised interpretation.",
        },
      ]);
      this.waiting.set(false);
      this.needsScroll = true;
    }, 850);
  }

  newChat(): void {
    clearTimeout(this.replyTimer);
    this.messages.set([]);
    this.waiting.set(false);
    this.sidebarOpen = false;
  }

  ngOnDestroy(): void {
    clearTimeout(this.replyTimer);
  }
}
