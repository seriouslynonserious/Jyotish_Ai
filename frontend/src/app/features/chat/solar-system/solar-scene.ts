import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLANETS } from './planet-data';

// Visual simulation only: compressed distances, enlarged planets, accelerated motion.
export class SolarScene {
  private renderer: T.WebGLRenderer;
  private scene = new T.Scene();
  private camera = new T.PerspectiveCamera(45, 1, .05, 1800);
  private controls: OrbitControls;
  private bodies: { group: T.Group; surface: T.Mesh; position: T.Vector3 }[] = [];
  private textures: T.Texture[] = [];
  private resize: ResizeObserver;
  private light = new T.PointLight(0xfff2da, 3, 0, 0);
  private disposed = false;
  private frame = 0;
  private lastFrame = 0;
  private elapsed = 0;
  private explore = false;
  private selection: number | null = null;
  private flying = false;
  private flightAge = 0;
  private followPosition = new T.Vector3();
  private flightOffset = new T.Vector3();
  private target = new T.Vector3();
  private destination = new T.Vector3();
  private delta = new T.Vector3();
  private pointer = new T.Vector2();
  private down = new T.Vector2();
  private raycaster = new T.Raycaster();
  private abort = new AbortController();
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');
  paused = this.reduced.matches;

  constructor(private host: HTMLElement, private onPick: (index: number) => void, private onError: (message: string) => void, private onPause: (paused: boolean) => void) {
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1 : 1.5));
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setClearColor('#02050e');
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    host.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = .07;
    this.controls.maxDistance = 350;
    this.controls.minDistance = 3;
    this.controls.enabled = false;
    this.controls.addEventListener('start', () => { this.flying = false; });
    this.scene.add(new T.AmbientLight(0x8cabc9, .22));
    this.light.castShadow = true;
    this.light.shadow.mapSize.set(512, 512);
    this.light.shadow.camera.near = .5;
    this.light.shadow.camera.far = 80;
    this.light.shadow.bias = -.002;
    this.scene.add(this.light);
    PLANETS.forEach((planet, index) => this.addPlanet(index));
    this.addSpace();
    this.reset(true);
    this.resize = new ResizeObserver(() => {
      this.camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1);
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(host.clientWidth, host.clientHeight, false);
      if (this.selection === null) this.reset();
      else this.focus(this.selection);
    });
    this.resize.observe(host);
    const canvas = this.renderer.domElement;
    const options = { signal: this.abort.signal };
    canvas.addEventListener('pointerdown', event => this.down.set(event.clientX, event.clientY), options);
    canvas.addEventListener('pointerup', event => {
      if (!this.explore || Math.hypot(event.clientX - this.down.x, event.clientY - this.down.y) > 5) return;
      const rect = canvas.getBoundingClientRect();
      this.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.raycaster.intersectObjects(this.bodies.map(body => body.surface), false)[0];
      if (hit) this.onPick(hit.object.userData['planet']);
    }, options);
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); this.dispose(); this.onError('3D paused: graphics context lost. Reload to try again.');
    }, options);
    this.reduced.addEventListener('change', () => { this.paused = this.reduced.matches; this.onPause(this.paused); }, options);
    this.frame = requestAnimationFrame(this.draw);
  }

  private texture(file: string): T.Texture {
    const texture = new T.TextureLoader().load('textures/' + file, loaded => {
      if (this.disposed) loaded.dispose();
    }, undefined, () => { if (!this.disposed) this.onError('Some textures could not load. Basic planet surfaces remain available.'); });
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    this.textures.push(texture);
    return texture;
  }

  private addPlanet(index: number): void {
    const planet = PLANETS[index];
    const group = new T.Group();
    const tilt = new T.Group();
    tilt.rotation.z = T.MathUtils.degToRad(planet.tilt);
    group.add(tilt);
    const map = this.texture(planet.texture);
    const material = index === 0 ? new T.MeshBasicMaterial({ map, color: '#fff0ce' }) : new T.MeshStandardMaterial({ map, roughness: .92, metalness: 0 });
    const surface = new T.Mesh(new T.SphereGeometry(planet.radius, 48, 32), material);
    surface.castShadow = index !== 0;
    surface.receiveShadow = index !== 0;
    surface.userData['planet'] = index;
    tilt.add(surface);
    if (planet.name === 'Saturn') {
      const inner = planet.radius * 1.25, outer = planet.radius * 2.35;
      const geometry = new T.RingGeometry(inner, outer, 160);
      const position = geometry.attributes['position'];
      const uv = geometry.attributes['uv'];
      for (let i = 0; i < position.count; i++) {
        uv.setXY(i, (Math.hypot(position.getX(i), position.getY(i)) - inner) / (outer - inner), .5);
      }
      const ringMap = this.texture('2k_saturn_ring_alpha.png');
      // A little transmitted light keeps the unlit side of the thin rings visible.
      const ring = new T.Mesh(geometry, new T.MeshStandardMaterial({ map: ringMap, emissiveMap: ringMap, emissive: '#c4b599', emissiveIntensity: .45, side: T.DoubleSide, transparent: true, alphaTest: .05, roughness: 1 }));
      ring.rotation.x = -Math.PI / 2;
      ring.castShadow = true; ring.receiveShadow = true;
      tilt.add(ring);
    }
    if (planet.name === 'Earth') {
      const atmosphere = new T.Mesh(new T.SphereGeometry(planet.radius * 1.045, 40, 24), new T.ShaderMaterial({
        transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        vertexShader: 'varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.0); n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
        fragmentShader: 'varying vec3 n; varying vec3 v;void main(){float rim=pow(1.0-max(dot(normalize(n),normalize(v)),0.0),3.0);gl_FragColor=vec4(0.18,0.55,1.0,rim*0.55);}',
      }));
      tilt.add(atmosphere);
    }
    this.scene.add(group);
    this.bodies.push({ group, surface, position: group.position });
  }

  private addSpace(): void {
    const sky = new T.Mesh(new T.SphereGeometry(700, 32, 20), new T.MeshBasicMaterial({ map: this.texture('2k_stars_milky_way.jpg'), side: T.BackSide, color: '#667088', depthWrite: false }));
    this.scene.add(sky);
    const stars: number[] = [];
    for (let i = 0; i < 1800; i++) {
      const azimuth = i * 2.39996;
      const y = 1 - 2 * (i + .5) / 1800;
      const radius = 200 + 100 * (Math.sin(i * 87.31) * .5 + .5);
      stars.push(Math.cos(azimuth) * Math.sqrt(1-y*y) * radius, y * radius, Math.sin(azimuth) * Math.sqrt(1-y*y) * radius);
    }
    this.scene.add(new T.Points(new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute(stars, 3)), new T.PointsMaterial({ size: .32, color: '#d8e8ff', sizeAttenuation: true })));
    // A soft additive corona avoids a costly full-screen bloom pass.
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d')!;
    const glow = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    glow.addColorStop(0, '#fff5ddee'); glow.addColorStop(.25, '#ffc66388'); glow.addColorStop(.5, '#ff951e22'); glow.addColorStop(1, '#ff951e00');
    context.fillStyle = glow; context.fillRect(0, 0, 128, 128);
    const texture = new T.CanvasTexture(canvas); this.textures.push(texture);
    const sprite = new T.Sprite(new T.SpriteMaterial({ map: texture, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    sprite.scale.set(17, 17, 1); this.scene.add(sprite);
  }

  setExplore(value: boolean): void {
    this.explore = value;
    this.controls.enabled = value;
    this.renderer.shadowMap.enabled = value && innerWidth > 700;
    this.reset();
  }

  focus(index: number): void {
    this.selection = index;
    const radius = PLANETS[index].radius;
    this.controls.minDistance = radius * (index === 6 ? 2.5 : 1.3);
    // Approach from the sunlit side and above the rings, not edge-on.
    this.flightOffset.copy(this.bodies[index].position).multiplyScalar(-1).normalize().multiplyScalar(radius * (index === 6 ? 7 : 5));
    if (index === 0) this.flightOffset.set(radius * 3, 0, radius * 5);
    this.flightOffset.y = radius * (index === 6 ? 5 : 2.5);
    this.flightOffset.multiplyScalar(Math.max(1, .9 / this.camera.aspect));
    this.followPosition.copy(this.bodies[index].position);
    this.flying = true; this.flightAge = 0;
  }

  reset(immediate = false): void {
    this.selection = null;
    this.controls.minDistance = 3;
    const distance = 78 / Math.min(1, this.camera.aspect);
    this.flightOffset.set(0, distance * .55, distance);
    this.flying = true; this.flightAge = 0;
    if (immediate) { this.camera.position.copy(this.flightOffset); this.controls.target.set(0, 0, 0); this.controls.update(); }
  }

  private draw = (now: number): void => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.draw);
    if (document.hidden) { this.lastFrame = now; return; }
    const minimum = this.explore ? 16 : 32; // Chat: 30 fps, leaving time for typing and streaming.
    if (now - this.lastFrame < minimum) return;
    const dt = Math.min((now - this.lastFrame) / 1000, .05); this.lastFrame = now;
    if (!this.paused) this.elapsed += dt;
    this.bodies.forEach(({ group, surface }, i) => {
      const data = PLANETS[i];
      const angle = i * 2.399 + this.elapsed * .11 / Math.sqrt(i || 1);
      group.position.set(Math.cos(angle) * data.orbit, 0, Math.sin(angle) * data.orbit);
      // Spin about the tilted local axis. Tilt >90° gives Venus/Uranus retrograde rotation.
      if (!this.paused) surface.rotation.y += dt * (i === 0 ? .025 : .12 + i * .012);
    });
    if (this.selection !== null) {
      this.target.copy(this.bodies[this.selection].position);
      if (!this.flying) {
        this.delta.copy(this.target).sub(this.followPosition);
        this.camera.position.add(this.delta); this.controls.target.add(this.delta);
      }
      this.followPosition.copy(this.target);
    } else this.target.set(0, 0, 0);
    if (this.flying) {
      this.flightAge += dt;
      const blend = this.reduced.matches ? 1 : 1 - Math.exp(-dt * 3);
      this.destination.copy(this.target).add(this.flightOffset);
      this.camera.position.lerp(this.destination, blend);
      this.controls.target.lerp(this.target, blend);
      if (this.flightAge > 2.5 || this.camera.position.distanceTo(this.destination) < .05) this.flying = false;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; cancelAnimationFrame(this.frame); this.abort.abort();
    this.resize?.disconnect(); this.controls.dispose();
    this.scene.traverse(object => {
      const mesh = object as T.Mesh;
      mesh.geometry?.dispose();
      if (mesh.material) for (const material of [mesh.material].flat()) material.dispose();
    });
    this.textures.forEach(texture => texture.dispose());
    this.light.shadow.dispose(); this.renderer.dispose(); this.renderer.domElement.remove();
  }
}
