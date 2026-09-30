import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  imports: [FormsModule],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.css',
})
export class ChatInputComponent {
  showSuggestions = input(true);
  busy = input(false);
  sendMessage = output<string>();
  draft = '';
  readonly suggestions = [
    { label: '💼 Career', prompt: 'Tell me about my career.' },
    { label: '🗓 Job Timing', prompt: 'Based on my calculated chart and available dasha periods, what periods may support finding or changing a job? Explain uncertainty; do not invent dates or transits.' },
    { label: '🔮 Next 3 Months', prompt: 'Give me an astrology interpretation for the next three months from today using my calculated chart and available dasha periods. Explain opportunities and challenges; do not invent transits or guarantee events.' },
    { label: '❤️ Marriage', prompt: 'Tell me about my marriage.' },
    { label: '💰 Money', prompt: 'Tell me about my financial future.' },
  ];

  send(text = this.draft): void {
    if (!text.trim() || this.busy()) return;
    this.sendMessage.emit(text.trim());
    this.draft = '';
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      this.send();
    }
  }
}
