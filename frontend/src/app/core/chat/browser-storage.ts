import { BirthData, BirthProfile } from '../astrology/astrology.models';
import { birthTimeToUtc } from '../astrology/birth-time.util';
import { ChatMessage } from '../models/chat-message.model';

export const STORAGE_KEY = 'jyotish-ai.session.v1';
export interface SavedSession {
  version: 1;
  profile: (BirthData & BirthProfile) | null;
  messages: ChatMessage[];
}

// Treat browser storage as untrusted: old/corrupt values must never break startup.
export function parseSavedSession(raw: string | null): SavedSession | null {
  try {
    if (!raw || raw.length > 250000) return null;
    const data = JSON.parse(raw);
    if (data.version !== 1 || !Array.isArray(data.messages) || data.messages.length > 50) return null;
    if (data.profile !== null) {
      if (!data.profile || typeof data.profile.placeOfBirth !== 'string' || data.profile.placeOfBirth.length > 200) return null;
      birthTimeToUtc(data.profile);
    }
    if (!data.messages.every((m: ChatMessage) => m && ['user', 'assistant'].includes(m.role)
        && typeof m.content === 'string' && m.content.length <= 12000)) return null;
    return { version: 1, profile: data.profile, messages: data.messages.map((m: ChatMessage, i: number) => ({ id: i + 1, role: m.role, content: m.content })) };
  } catch { return null; }
}
