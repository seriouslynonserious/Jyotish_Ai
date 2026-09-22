# Licensing and corresponding source

Jyotish AI is licensed under AGPL-3.0-or-later, as authorized by its owner. See LICENSE. Preserve existing third-party copyrights and license notices.

Swiss Ephemeris WASM: @kuntay/swisseph 0.2.2, AGPL-3.0-or-later.
Original Swiss Ephemeris: Copyright Astrodienst AG; authors Dieter Koch and Alois Treindl. Wrapper notices are retained in public/source/SWISS-NOTICE.txt and in the deployed vendor/swisseph directory.

The unchanged wrapper, C sources, and build scripts are provided at public/source/swisseph-0.2.2-source.tar.gz, from https://github.com/kuntayerkus/swisseph-wasm/tree/4c4b0f48b15d1795b44ed068e8532fd20d1e145c . Follow that archive's README and build scripts to rebuild WASM (Emscripten or Docker). We serve the package's ESM/WASM unmodified and do not load any .se1 data files.

The app footer offers the complete application source archive, including configuration, lockfile, test fixtures, source-packaging script, license, and the upstream source archive. `npm run source:archive` refreshes it; npm start/build run it automatically. A deploy must publish the newly built public/source files with the matching application build. Do not publish stale source archives.

Other retained dependencies: Angular/RxJS/TypeScript/tslib (permissive licenses), Temporal polyfill (ISC), JSBI (Apache-2.0), and toolchain packages with their original licenses. npm's pinned dependency packages retain their notices. Older opposition reference fixtures originated in Astronomy Engine (MIT); see tests/fixtures/README.md.

Location data: Open-Meteo Geocoding API / GeoNames. The free hosted API is for non-commercial use; its service terms are separate from this application's software license.
