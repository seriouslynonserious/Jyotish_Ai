import { Component } from '@angular/core';
import { BotAvatarComponent } from '../bot-avatar/bot-avatar.component';

@Component({
  selector: 'app-cosmic-welcome',
  imports: [BotAvatarComponent],
  template: `<section class="welcome-grid">
  <div class="welcome-copy">
    <span class="eyebrow">YOUR PERSONAL ASTROLOGY SPACE</span>
    <h1>A sky full of possibilities.<br /> <em>A space just for you.</em></h1>
    <p>Start with your birth details. Explore your kundli, then ask the questions on your mind.</p>
    <a class="start-link" href="#birth-details">Create my kundli <span>↓</span></a>
    <div class="guide-intro"><app-bot-avatar /><span>Meet Tara<small>Your AI astrology companion</small></span></div>
  </div>

</section>`,
  styles: `.start-link { display: inline-flex; gap: 22px; color: var(--accent); text-decoration: none; border-bottom: 1px solid var(--accent); padding: 6px 0; font-size: 13px; }
.welcome-grid{
  display:grid;
  grid-template-columns:1fr;
  gap:28px;
  align-items:center;
  margin-bottom:20px
}
.eyebrow{
  font-size:9px;
  letter-spacing:1.8px;
  color:var(--accent)
}
h1{
  font-size:clamp(26px,2.6vw,37px);
  line-height:1.2;
  letter-spacing:-1.2px;
  font-weight:500;
  margin:18px 0
}
h1 em{
  font-family:Georgia,serif;
  color:var(--accent);
  font-weight:400
}
.welcome-copy>p{
  font-size:13px;
  line-height:1.8;
  color:var(--muted);
  max-width:340px
}
.guide-intro{
  display:flex;
  align-items:center;
  gap:14px;
  margin-top:24px;
  font-size:13px
}
.guide-intro small{
  display:block;
  font-size:11px;
  color:var(--muted);
  margin-top:5px
}
@media(max-width:900px){
  .welcome-grid{
    grid-template-columns:1fr
  }
  .welcome-copy>p{
    max-width:none
  }
  .guide-intro{
    margin-top:16px
  }
  .welcome-copy h1 br{
    display:none
  }
}
`,
})
export class CosmicWelcomeComponent {}
