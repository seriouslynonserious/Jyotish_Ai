import { Injectable } from '@angular/core';

export interface PlaceMatch {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  admin1?: string;
  country?: string;
}

@Injectable({ providedIn: 'root' })
export class PlaceSearchService {
  async search(name: string, signal?: AbortSignal): Promise<PlaceMatch[]> {
    const query = new URLSearchParams({
      name: name.trim(),
      count: '8',
      language: 'en',
      format: 'json',
    });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${query}`, {
      signal,
    });
    if (!response.ok)
      throw new Error('Location search is unavailable. Try again or enter coordinates manually.');
    const data: { results?: PlaceMatch[] } = await response.json();
    return (data.results ?? []).filter(
      (place) =>
        typeof place.name === 'string' &&
        Number.isFinite(place.latitude) &&
        Math.abs(place.latitude) <= 90 &&
        Number.isFinite(place.longitude) &&
        Math.abs(place.longitude) <= 180 &&
        typeof place.timezone === 'string',
    );
  }
}
