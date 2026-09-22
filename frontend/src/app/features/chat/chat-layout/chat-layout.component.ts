import { Component, ElementRef, afterEveryRender, signal, viewChild } from '@angular/core';
import { inject } from '@angular/core';
import { AstrologyEngineService } from '../../../core/astrology/astrology-engine.service';
import { BirthChart } from '../../../core/astrology/astrology.models';
import {
  BirthProfileFormComponent,
  ChatBirthProfile,
} from '../birth-profile-form/birth-profile-form.component';
import { BirthChartResultComponent } from '../birth-chart-result/birth-chart-result.component';
import { ChatMessage } from '../../../core/models/chat-message.model';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MessageComponent } from '../message/message.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';

@Component({
  selector: 'app-chat-layout',
  imports: [
    SidebarComponent,
    MessageComponent,
    ChatInputComponent,
    BirthProfileFormComponent,
    BirthChartResultComponent,
  ],
  templateUrl: './chat-layout.component.html',
  styleUrl: './chat-layout.component.css',
})
export class ChatLayoutComponent {
  messages = signal<ChatMessage[]>([]);
  profile = signal<ChatBirthProfile | null>(null);
  chart = signal<BirthChart | null>(null);
  showForm = signal(false);
  calculationError = signal('');
  calculating = signal(false);
  private calculationId = 0;
  private engine = inject(AstrologyEngineService);
  sidebarOpen = false;
  darkMode = signal(false);
  private nextId = 1;
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

  private addMessage(role: 'user' | 'assistant', content: string): void {
    this.messages.update((messages) => [...messages, { id: this.nextId++, role, content }]);
    this.needsScroll = true;
  }

  enterBirthDetails(): void {
    this.showForm.set(true);
    this.calculationError.set('');
    if (!this.messages().length)
      this.addMessage(
        'assistant',
        'Please enter your birth date, time, place, coordinates, and timezone to calculate astronomical positions.',
      );
  }

  sendMessage(content: string): void {
    if (!content.trim()) return;
    this.addMessage('user', content.trim());
    if (!this.profile()) {
      this.addMessage(
        'assistant',
        'Please enter your birth details below. I can calculate astronomical positions; predictions are not available yet.',
      );
      this.enterBirthDetails();
    } else {
      this.addMessage(
        'assistant',
        'These are calculated astronomical positions. Vedic chart interpretation and predictions are not available yet.',
      );
    }
  }

  async calculate(profile: ChatBirthProfile): Promise<void> {
    if (this.calculating()) return;
    const id = ++this.calculationId;
    this.calculating.set(true);
    this.calculationError.set('');
    try {
      const chart = await this.engine.calculateBirthChart(profile);
      if (id !== this.calculationId) return;
      this.profile.set(profile);
      this.chart.set(chart);
      this.showForm.set(false);
      this.addMessage(
        'assistant',
        'Your astronomical positions are ready below. Vedic chart interpretation and predictions are not available yet.',
      );
    } catch (error) {
      if (id !== this.calculationId) return;
      this.calculationError.set(
        error instanceof Error
          ? error.message
          : 'Calculation failed. Please check your birth details.',
      );
    } finally {
      if (id === this.calculationId) this.calculating.set(false);
    }
  }

  newChat(): void {
    this.calculationId++;
    this.calculating.set(false);
    this.messages.set([]);
    this.profile.set(null);
    this.chart.set(null);
    this.showForm.set(false);
    this.calculationError.set('');
    this.sidebarOpen = false;
  }
}
