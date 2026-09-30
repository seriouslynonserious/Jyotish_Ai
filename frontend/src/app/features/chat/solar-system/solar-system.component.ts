import { Component, ElementRef, afterNextRender, effect, input, output, signal, viewChild, OnDestroy } from '@angular/core';
import { FACT_SOURCE, PLANETS } from './planet-data';
import type { SolarScene } from './solar-scene';

@Component({
  selector: 'app-solar-system',
  templateUrl: './solar-system.component.html',
  styleUrl: './solar-system.component.css',
  host: { '[class.exploring]': 'exploring()', '(window:keydown.escape)': 'leave()' },
})
export class SolarSystemComponent implements OnDestroy {
  exploring = input(false);
  returnToChat = output<void>();
  readonly planets = PLANETS;
  readonly source = FACT_SOURCE;
  selected = signal<number | null>(null);
  showInfo = signal(true);
  paused = signal(false);
  ready = signal(false);
  notice = signal('Loading your space…');
  private viewport = viewChild.required<ElementRef<HTMLDivElement>>('viewport');
  private returnButton = viewChild<ElementRef<HTMLButtonElement>>('returnButton');
  private scene?: SolarScene;
  private disposed = false;

  constructor() {
    afterNextRender(() => { void this.start(); });
    effect(() => {
      const explore = this.exploring();
      this.scene?.setExplore(explore);
      this.selected.set(null);
      if (explore) requestAnimationFrame(() => this.returnButton()?.nativeElement.focus());
    });
  }
  private async start(): Promise<void> {
    try {
      const { SolarScene } = await import('./solar-scene');
      if (this.disposed) return;
      this.scene = new SolarScene(this.viewport().nativeElement, index => this.focus(index), message => this.notice.set(message), paused => this.paused.set(paused));
      this.scene.setExplore(this.exploring());
      this.paused.set(this.scene.paused);
      this.ready.set(true); this.notice.set('');
    } catch { this.notice.set('3D is unavailable on this device. Your chat still works.'); }
  }
  focus(index: number): void { this.selected.set(index); this.showInfo.set(true); this.scene?.focus(index); }
  reset(): void { this.selected.set(null); this.scene?.reset(); }
  togglePause(): void { this.paused.update(value => !value); if (this.scene) this.scene.paused = this.paused(); }
  leave(): void { if (this.exploring()) this.returnToChat.emit(); }
  ngOnDestroy(): void { this.disposed = true; this.scene?.dispose(); }
}
