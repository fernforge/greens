// Fixed-timestep-ish game loop with frame clamping and FPS metering.

export class Loop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.running = false;
    this.last = 0;
    this.acc = 0;
    this.fps = 0;
    this._frames = 0;
    this._fpsT = 0;
    this.timeScale = 1;
    this._raf = null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now) => {
      if (!this.running) return;
      this._raf = requestAnimationFrame(tick);
      let dt = (now - this.last) / 1000;
      this.last = now;
      // Clamp huge gaps (tab switch) so physics don't explode.
      if (dt > 0.1) dt = 0.1;
      dt *= this.timeScale;

      this.update(dt);
      this.render(dt);

      this._frames++;
      this._fpsT += dt;
      if (this._fpsT >= 0.5) {
        this.fps = Math.round(this._frames / this._fpsT);
        this._frames = 0;
        this._fpsT = 0;
      }
    };
    this._raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }
}
