import { Component, input } from '@angular/core';

@Component({
  selector: 'app-bot-avatar',
  template: `<span class="bot" [class.thinking]="thinking()" aria-hidden="true"><span class="antenna"></span><span class="face"><i></i><i></i><b></b></span></span>`,
  styles: `
    :host{display:inline-flex;flex-shrink:0}.bot{width:42px;height:42px;border-radius:15px;background:linear-gradient(140deg,#194b66,#0b243c);display:grid;place-items:center;position:relative;box-shadow:0 4px 12px #092a4520;border:1px solid #529ba866}.antenna{position:absolute;width:2px;height:6px;top:-5px;background:#d5b96c}.antenna:before{content:'';position:absolute;width:5px;height:5px;border-radius:50%;background:#e9ce85;top:-3px;left:-1.5px}.face{width:28px;height:21px;border:1px solid #67d4df80;border-radius:8px;display:flex;gap:7px;align-items:center;justify-content:center;position:relative}.face i{width:4px;height:5px;border-radius:4px;background:#9af3eb;animation:blink 6s infinite}.face b{position:absolute;width:7px;height:3px;border-bottom:1px solid #9af3eb;border-radius:50%;bottom:3px}.thinking{animation:bob 1.5s ease-in-out infinite}.thinking .face i{animation:blink .8s infinite}@keyframes blink{0%,90%,100%{transform:scaleY(1)}95%{transform:scaleY(.15)}}@keyframes bob{50%{transform:translateY(-4px);box-shadow:0 5px 20px #39c4d644}}
  `,
})
export class BotAvatarComponent { thinking = input(false); }
