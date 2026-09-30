# Jyotish AI

A local astrology chat app with a moving 3D solar system behind it.

## What you can do

1. Enter your birth date, time, and place. City search fills in coordinates and timezone.
2. See your calculated kundli: planets, Lagna, houses, Moon nakshatra, and dasha periods.
3. Choose Career, Job Timing, Next 3 Months, Marriage, or Money. Or type your own question.
4. Tara replies through your local Ollama model. Replies appear gradually. You can stop a reply.
5. Click **Explore Solar System** to visit planets. Return to Chat keeps your current work.

Saving birth details and chat is optional. Saved information stays in that browser, not across devices. The solar animation is illustrative and does not calculate your kundli. AI astrology readings can be wrong and are not reliable predictions.

## Start on this Mac

Open a terminal in this repository folder:

```bash
./start-local.sh
```

Open **http://127.0.0.1:4204/**. Keep the terminal open. After code changes, rebuild the backend if needed and use `./start-local.sh --restart`.

If the backend has not been built yet:

```bash
mvn -f backend/pom.xml package
```

## Set up another computer

You need Node.js 22.12 or newer compatible with Angular 21, Java 21, Maven 3.9+, and Ollama. The launcher is for macOS/Linux.

```bash
git clone https://github.com/seriouslynonserious/Jyotish_Ai.git
cd Jyotish_Ai
npm --prefix frontend ci
mvn -f backend/pom.xml package
ollama pull llama3.2:3b
OLLAMA_BIN="$(command -v ollama)" ./start-local.sh
```

Run the Ollama application before `ollama pull`. The launcher starts a separate local instance on port 11435 using the same downloaded models. On a new computer, Ollama and model weights must be installed separately; they are not included in GitHub.

## Simple documentation

- [How to use the app](docs/USER_GUIDE.md)
- [How the code works and how to test it](docs/DEVELOPER_GUIDE.md)
- [Frontend calculation details](frontend/README.md)
- [Backend and Ollama details](backend/README.md)
- [Public hosting preparation](deploy/README.md) — not deployed yet

## License and credits

Application: AGPL-3.0-or-later. See [license](frontend/LICENSE) and [third-party notices](frontend/THIRD_PARTY_NOTICES.md). Keep the corresponding-source links when sharing or hosting it.

Three.js: MIT. Planet textures: Solar System Scope / INOVE, CC BY 4.0. See [texture credits](frontend/public/textures/ATTRIBUTION.md). The project logo was supplied by the project owner.
