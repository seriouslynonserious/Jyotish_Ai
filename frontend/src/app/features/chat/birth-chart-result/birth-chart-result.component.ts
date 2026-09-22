import { Component, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { BirthChart } from '../../../core/astrology/astrology.models';
import { ChatBirthProfile } from '../birth-profile-form/birth-profile-form.component';

@Component({
  selector: 'app-birth-chart-result',
  imports: [DecimalPipe, DatePipe],
  templateUrl: './birth-chart-result.component.html',
  styleUrl: './birth-chart-result.component.css',
})
export class BirthChartResultComponent {
  chart = input.required<BirthChart>();
  profile = input.required<ChatBirthProfile>();
  edit = output<void>();
}
