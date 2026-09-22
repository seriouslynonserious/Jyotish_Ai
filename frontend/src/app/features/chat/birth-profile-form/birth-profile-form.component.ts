import { Component, input, output, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BirthData, BirthProfile } from '../../../core/astrology/astrology.models';
import { birthTimeToUtc } from '../../../core/astrology/birth-time.util';

import { PlaceSearchService, PlaceMatch } from '../../../core/location/place-search.service';

export type ChatBirthProfile = BirthData & BirthProfile;

@Component({
  selector: 'app-birth-profile-form',
  imports: [ReactiveFormsModule],
  templateUrl: './birth-profile-form.component.html',
  styleUrl: './birth-profile-form.component.css',
})
export class BirthProfileFormComponent implements OnInit, OnDestroy {
  initial = input<ChatBirthProfile | null>(null);
  calculationError = input('');
  busy = input(false);
  save = output<ChatBirthProfile>();
  cancel = output<void>();
  error = '';
  matches = signal<PlaceMatch[]>([]);
  searching = signal(false);
  searchMessage = signal('');
  private places = inject(PlaceSearchService);
  private request?: AbortController;

  placeChanged(): void {
    this.request?.abort();
    this.request = undefined;
    this.searching.set(false);
    this.matches.set([]);
    this.searchMessage.set('');
    this.form.patchValue({ latitude: null, longitude: null, timezone: '' });
  }

  async searchPlaces(): Promise<void> {
    const name = this.form.controls.placeOfBirth.value.trim();
    if (name.length < 2) {
      this.searchMessage.set('Enter at least two letters of the city or town.');
      return;
    }
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    this.searching.set(true);
    this.matches.set([]);
    this.searchMessage.set('');
    const timeout = setTimeout(() => request.abort(), 10000);
    try {
      const matches = await this.places.search(name, request.signal);
      if (this.request !== request) return;
      this.matches.set(matches);
      this.searchMessage.set(
        matches.length
          ? 'Choose your birthplace below.'
          : 'No matches found. Try a nearby city or enter coordinates manually.',
      );
    } catch {
      if (this.request === request)
        this.searchMessage.set('Location search failed. Try again or enter coordinates manually.');
    } finally {
      clearTimeout(timeout);
      if (this.request === request) this.searching.set(false);
    }
  }

  choosePlace(place: PlaceMatch): void {
    this.form.patchValue({
      placeOfBirth: [place.name, place.admin1, place.country].filter(Boolean).join(', '),
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: place.timezone,
    });
    this.matches.set([]);
    this.searchMessage.set('Coordinates and timezone filled. You can adjust them below.');
  }

  ngOnDestroy(): void {
    this.request?.abort();
  }

  form = new FormGroup({
    dateOfBirth: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    timeOfBirth: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    placeOfBirth: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
    latitude: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(-90),
      Validators.max(90),
    ]),
    longitude: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(-180),
      Validators.max(180),
    ]),
    timezone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    const profile = this.initial();
    if (profile) this.form.patchValue(profile);
  }

  submit(): void {
    if (this.busy()) return;
    this.error = '';
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error = 'Complete all fields. Latitude must be −90 to 90; longitude −180 to 180.';
      return;
    }
    const value = this.form.getRawValue();
    if (value.latitude === null || value.longitude === null) return;
    const profile: ChatBirthProfile = {
      ...value,
      latitude: value.latitude,
      longitude: value.longitude,
      placeOfBirth: value.placeOfBirth.trim(),
      timezone: value.timezone.trim(),
    };
    try {
      birthTimeToUtc(profile);
      this.save.emit(profile);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Please check your birth details.';
    }
  }
}
