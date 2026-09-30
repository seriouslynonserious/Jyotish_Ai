// Network chunks need not end at a JSON line or even a UTF-8 character.
export async function readChatStream(body: ReadableStream<Uint8Array>, onText: (text: string) => void): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let text = '';
  let complete = false;
  function consume(line: string): void {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (typeof event.error === 'string') throw new Error(event.error);
    if (typeof event.token === 'string') {
      text += event.token;
      if (text.length > 12000) throw new Error('AI response is too long.');
      onText(text);
    }
    if (event.done === true) complete = true;
  }
  try {
    while (!complete) {
      const { value, done } = await reader.read();
      pending += done ? decoder.decode() : decoder.decode(value, { stream: true });
      if (pending.length > 64000) throw new Error('Invalid AI stream.');
      let newline: number;
      while (!complete && (newline = pending.indexOf('\n')) !== -1) {
        consume(pending.slice(0, newline));
        pending = pending.slice(newline + 1);
      }
      if (done) { if (!complete && pending.trim()) consume(pending); break; }
    }
    if (!complete || !text.trim()) throw new Error('AI response interrupted. Please try again.');
    return text;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
