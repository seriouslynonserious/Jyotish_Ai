import { SolarSystemComponent } from '../solar-system/solar-system.component';
import { CosmicWelcomeComponent } from '../solar-system/cosmic-welcome.component';
import { BotAvatarComponent } from '../bot-avatar/bot-avatar.component';
import { ChatApiService } from '../../../core/chat/chat-api.service';
import { parseSavedSession, STORAGE_KEY } from '../../../core/chat/browser-storage';
import { Component, ElementRef, afterEveryRender, effect, OnDestroy, signal, viewChild } from '@angular/core';
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
    CosmicWelcomeComponent,
    SolarSystemComponent,
    BotAvatarComponent,
    MessageComponent,
    ChatInputComponent,
    BirthProfileFormComponent,
    BirthChartResultComponent,
  ],
  templateUrl: './chat-layout.component.html',
  styleUrl: './chat-layout.component.css',
})
export class ChatLayoutComponent implements OnDestroy {
  private api = inject(ChatApiService);
  private request?: AbortController;
  aiBusy = signal(false);
  replyDraft = signal('');
  aiError = signal('');
  remember = signal(false);
  storageError = signal('');
  messages = signal<ChatMessage[]>([]);
  profile = signal<ChatBirthProfile | null>(null);
  chart = signal<BirthChart | null>(null);
  showForm = signal(false);
  reviewingChart = signal(false);
  calculationError = signal('');
  calculating = signal(false);
  private calculationId = 0;
  private engine = inject(AstrologyEngineService);
  sidebarOpen = false;
  exploring = signal(false);
  private exploreButton = viewChild<ElementRef<HTMLButtonElement>>('exploreButton');

  enterSpace(): void { this.sidebarOpen = false; this.exploring.set(true); }
  leaveSpace(): void {
    this.exploring.set(false);
    requestAnimationFrame(() => this.exploreButton()?.nativeElement.focus());
  }
  private nextId = 1;
  private needsScroll = false;
  private conversation = viewChild<ElementRef<HTMLElement>>('conversation');

  constructor() {
    try {
      const saved = parseSavedSession(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        this.remember.set(true);
        this.messages.set(saved.messages);
        this.nextId = saved.messages.length + 1;
        if (saved.profile) {
          this.profile.set(saved.profile);
          if (!saved.messages.length) this.addMessage('assistant', 'Restoring your saved chart.');
          void this.calculate(saved.profile, true);
        }
      }
    } catch { this.storageError.set('Browser storage is unavailable.'); }
    if (!this.profile()) this.enterBirthDetails();
    effect(() => {
      const enabled = this.remember();
      const profile = this.profile();
      const messages = this.messages();
      try {
        if (enabled) localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, profile, messages: messages.slice(-20) }));
        else localStorage.removeItem(STORAGE_KEY);
      } catch { this.storageError.set('Could not save data in this browser.'); }
    });
    // Wait for Angular to paint new messages before scrolling.
    afterEveryRender(() => {
      if (!this.needsScroll) return;
      const area = this.conversation()?.nativeElement;
      if (area) area.scrollTop = (this.reviewingChart() || (this.showForm() && !this.profile())) ? 0 : area.scrollHeight;
      this.needsScroll = false;
    });
  }

  private addMessage(role: 'user' | 'assistant', content: string): void {
    this.messages.update((messages) => [...messages, { id: this.nextId++, role, content }]);
    this.needsScroll = true;
  }

  enterBirthDetails(): void {
    this.cancelReply();
    this.showForm.set(true);
    this.calculationError.set('');
    if (!this.messages().length)
      this.addMessage(
        'assistant',
        'Welcome! Please fill in your birth date, time, and place below. Then choose a topic for your astrology reading.',
      );
  }

  async sendMessage(content: string): Promise<void> {
    if (!content.trim() || this.aiBusy() || this.calculating()) return;
    if (content.length > 2000) { this.aiError.set('Please keep messages under 2,000 characters.'); return; }
    this.aiError.set('');
    this.replyDraft.set('');
    this.addMessage('user', content.trim());
    const chart = this.chart();
    if (!chart) {
      this.addMessage('assistant', 'Please enter your birth details to calculate a chart before asking for an interpretation.');
      this.enterBirthDetails();
      return;
    }
    const request = new AbortController();
    this.request = request;
    this.aiBusy.set(true);
    const timeout = setTimeout(() => request.abort(), 100000);
    try {
      const reply = await this.api.reply(chart, this.messages(), request.signal, text => {
        if (this.request !== request) return;
        this.replyDraft.set(text);
        this.needsScroll = true;
      });
      if (this.request === request) { this.replyDraft.set(''); this.addMessage('assistant', reply); }
    } catch (error) {
      if (this.request === request) this.aiError.set(request.signal.aborted
        ? 'AI response timed out. Please try again.'
        : error instanceof Error ? error.message : 'Could not reach the AI server.');
    } finally {
      clearTimeout(timeout);
      if (this.request === request) { this.request = undefined; this.aiBusy.set(false); }
    }
  }

  stopReply(): void {
    this.request?.abort();
    this.request = undefined;
    this.aiBusy.set(false);
    this.aiError.set('Stopped. This unfinished reply is not saved or used in follow-ups.');
  }

  private cancelReply(): void {
    this.replyDraft.set('');
    this.request?.abort();
    this.request = undefined;
    this.aiBusy.set(false);
    this.aiError.set('');
  }

  deleteSavedData(): void {
    this.remember.set(false);
    this.newChat();
    try { localStorage.removeItem(STORAGE_KEY); }
    catch { this.storageError.set('Could not delete saved data. Clear this site’s data in browser settings.'); }
  }

  ngOnDestroy(): void { this.cancelReply(); this.calculationId++; }

  async calculate(profile: ChatBirthProfile, restoring = false): Promise<void> {
    if (this.calculating()) return;
    this.cancelReply();
    const id = ++this.calculationId;
    this.calculating.set(true);
    this.calculationError.set('');
    try {
      const chart = await this.engine.calculateBirthChart(profile);
      if (id !== this.calculationId) return;
      if (!restoring && this.profile() && JSON.stringify(this.profile()) !== JSON.stringify(profile)) {
        this.messages.set([]); // A different birth chart starts a fresh reading.
      }
      this.profile.set(profile);
      this.chart.set(chart);
      this.reviewingChart.set(!restoring);
      this.needsScroll = true;
      this.showForm.set(false);
      if (!restoring) this.addMessage('assistant', 'Your kundli is ready. Review your calculated positions, Lagna, houses, and dasha periods above, then choose what you would like to explore.');
    } catch (error) {
      if (id !== this.calculationId) return;
      this.showForm.set(true);
      this.calculationError.set(
        error instanceof Error
          ? error.message
          : 'Calculation failed. Please check your birth details.',
      );
    } finally {
      if (id === this.calculationId) this.calculating.set(false);
    }
  }

  exploreTopics(): void {
    this.reviewingChart.set(false);
    this.needsScroll = true;
  }

  newChat(): void {
    this.cancelReply();
    this.calculationId++;
    this.calculating.set(false);
    this.messages.set([]);
    this.profile.set(null);
    this.chart.set(null);
    this.reviewingChart.set(false);
    this.showForm.set(false);
    this.calculationError.set('');
    this.sidebarOpen = false;
    this.enterBirthDetails();
  }
}
