# Jyotish AI — Phase 1

A simple Angular frontend with local demo chat. No backend, APIs, astrology calculations, accounts, payments, or storage.

## Run

```bash
npm install
npm start
```

Open http://localhost:4200. Build for production with `npm run build`.

## Read the code

- `src/app/core/models/chat-message.model.ts`: typed message shape.
- `src/app/features/chat/chat-layout/`: messages, simulated reply, reset, responsive layout.
- `src/app/features/chat/sidebar/`: navigation and static demo history.
- `src/app/features/chat/chat-input/`: draft, keyboard handling, send, suggestions.
- `src/app/features/chat/message/`: user and assistant rendering.
- `src/app/app.routes.ts`: root route.
- `src/styles.css`: shared colors, interactions, reduced-motion support.

Enter sends, Shift+Enter adds a newline. While a reply is pending, sending is disabled. New Chat cancels a pending reply and clears the conversation. Chats are lost on refresh. Recent entries are illustrative labels. Settings explains the preview behavior.

Angular disk caching is disabled to avoid a native cache crash on this machine. The dev server uses polling to avoid file-watcher limits.
