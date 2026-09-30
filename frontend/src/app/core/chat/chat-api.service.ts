import { readChatStream } from './chat-stream';
import { chartContext } from './chart-context';
import { Injectable } from '@angular/core';
import { BirthChart } from '../astrology/astrology.models';
import { ChatMessage } from '../models/chat-message.model';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  async reply(chart: BirthChart, messages: ChatMessage[], signal: AbortSignal, onText: (text: string) => void): Promise<string> {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        chart: JSON.stringify(chartContext(chart)),
        messages: messages.slice(-12).map(({ role, content }) => ({ role, content: content.slice(0, 2000) })),
      }),
    });
    if (!response.ok) {
      throw new Error(response.status === 429
        ? 'Chat is busy. Please wait a minute and try again.'
        : 'AI is unavailable. Check that the backend and Ollama model are running, then try again.');
    }
    if (!response.body) throw new Error('Streaming is unavailable. Please try another browser.');
    return readChatStream(response.body, onText);
  }
}
