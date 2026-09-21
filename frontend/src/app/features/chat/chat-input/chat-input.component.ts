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
    { label: '❤️ Marriage', prompt: 'Tell me about my marriage.' },
    { label: '💰 Money', prompt: 'Tell me about my financial future.' },
    { label: '🔮 Future', prompt: 'Predict my next 3 months.' },
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
