# How to use Jyotish AI

## Get your kundli

Enter your birth date and local birth time. Search for your town and select the correct result. Check the country or region so you do not choose a town with the same name elsewhere.

You can edit latitude, longitude, and timezone manually. Click **Calculate positions**. Review your kundli, then click **Explore my reading**.

## Chat with Tara

Click a topic button to send its question immediately. You can also type questions such as:

- What does my Moon sign mean?
- What does my chart suggest about career?
- Can you explain that in simple language?

Enter sends a message. Shift+Enter starts a new line. The moving bot and loading indicator show when the AI is working. The first words can take a while on a CPU. **Stop response** cancels the request; unfinished replies are not saved or reused as answers.

The AI receives your calculated chart and recent messages. It can still misunderstand or invent claims, so compare its answer with the displayed chart. It does not have calculated transits. Interpretations are not guaranteed future events.

## Explore space

Click **Explore Solar System**. Your chat is hidden temporarily, not deleted.

- Click a planet, or select its name below, to fly toward it and follow it.
- Drag to rotate the camera. Right-drag to pan. Scroll to zoom.
- On a phone, drag with one finger; use two fingers to pan or pinch to zoom.
- **Reset View** shows the whole system. **Focus on Sun** visits the Sun.
- **Hide info** hides planet facts. **Pause motion** stops orbital and spin animation.
- **Return to Chat**, or Escape, brings back your chat and draft.

Sizes, distances, and speeds are adjusted for viewing. This is not a live astronomical simulation. Moon counts are a dated NASA source snapshot and may lag new discoveries. Reduced-motion preferences pause movement by default.

## Saving and privacy

Enable **Save birth details and chat on this browser** if you want to resume after refreshing. The latest 20 messages and birth profile are saved, unencrypted, in browser storage.

Use the same address each time: `localhost` and `127.0.0.1` have separate storage. Different ports, browsers, devices, and private windows also have separate storage.

**New reading** starts over. If saving is on, it replaces the saved session. **Delete saved data** removes the saved profile and messages and clears the current screen. Turning saving off removes the stored session while keeping the current screen.

City search sends only the place name to Open-Meteo. Sending an AI question sends your calculated chart and recent chat to the locally configured backend and Ollama.

## If something is wrong

- Page does not open: run `./start-local.sh` and leave that terminal open.
- Old design appears: refresh the page; if needed run `./start-local.sh --restart`.
- AI unavailable: check that Ollama is running and `llama3.2:3b` is downloaded.
- AI is slow: give it time to read the chart. Other CPU-heavy apps can slow it down.
- Chart fails: check the date, time, coordinates, and timezone. Supported years are 1700–2100. Ambiguous daylight-saving times are rejected.
- Space cannot load: chat still works; try a WebGL-capable browser with graphics acceleration.
