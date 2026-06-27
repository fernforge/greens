// Unified input: keyboard, mouse, and touch with a virtual-key abstraction.

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'use', Enter: 'confirm', NumpadEnter: 'confirm',
  KeyE: 'interact', KeyF: 'interact',
  Escape: 'menu', KeyP: 'menu',
  KeyI: 'inventory', Tab: 'inventory',
  KeyJ: 'journal',
  KeyM: 'map',
  ShiftLeft: 'run', ShiftRight: 'run',
  Digit1: 'slot1', Digit2: 'slot2', Digit3: 'slot3', Digit4: 'slot4', Digit5: 'slot5',
  Digit6: 'slot6', Digit7: 'slot7', Digit8: 'slot8', Digit9: 'slot9', Digit0: 'slot10',
  KeyQ: 'prevTool', KeyR: 'nextTool',
};

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = new Set();        // virtual keys currently held
    this.pressed = new Set();     // pressed this frame
    this.released = new Set();    // released this frame
    this.rawDown = new Set();     // physical codes held
    this.mouse = { x: 0, y: 0, down: false, pressed: false, released: false, wheel: 0 };
    this.anyKeyPressed = false;
    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      if (e.repeat) return;
      this.rawDown.add(e.code);
      const v = KEYMAP[e.code];
      if (v && !this.down.has(v)) { this.down.add(v); this.pressed.add(v); }
      this.anyKeyPressed = true;
    });
    window.addEventListener('keyup', (e) => {
      this.rawDown.delete(e.code);
      const v = KEYMAP[e.code];
      if (v) { this.down.delete(v); this.released.add(v); }
    });
    window.addEventListener('blur', () => { this.down.clear(); this.rawDown.clear(); this.mouse.down = false; });

    const setMouse = (e) => {
      const r = this.canvas.getBoundingClientRect();
      const sx = this.canvas.width / r.width, sy = this.canvas.height / r.height;
      const cx = (e.touches ? e.touches[0].clientX : e.clientX);
      const cy = (e.touches ? e.touches[0].clientY : e.clientY);
      this.mouse.x = (cx - r.left) * sx;
      this.mouse.y = (cy - r.top) * sy;
    };
    this.canvas.addEventListener('mousemove', setMouse);
    this.canvas.addEventListener('mousedown', (e) => { setMouse(e); if (!this.mouse.down) { this.mouse.pressed = true; } this.mouse.down = true; this.anyKeyPressed = true; });
    window.addEventListener('mouseup', () => { if (this.mouse.down) this.mouse.released = true; this.mouse.down = false; });
    this.canvas.addEventListener('wheel', (e) => { this.mouse.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch as mouse
    this.canvas.addEventListener('touchstart', (e) => { setMouse(e); this.mouse.pressed = true; this.mouse.down = true; this.anyKeyPressed = true; e.preventDefault(); }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => { setMouse(e); e.preventDefault(); }, { passive: false });
    this.canvas.addEventListener('touchend', (e) => { this.mouse.released = true; this.mouse.down = false; e.preventDefault(); }, { passive: false });
  }

  held(v) { return this.down.has(v); }
  justPressed(v) { return this.pressed.has(v); }
  justReleased(v) { return this.released.has(v); }
  rawHeld(code) { return this.rawDown.has(code); }

  // Movement axis vector (-1..1) from held keys.
  axis() {
    let x = 0, y = 0;
    if (this.down.has('left')) x -= 1;
    if (this.down.has('right')) x += 1;
    if (this.down.has('up')) y -= 1;
    if (this.down.has('down')) y += 1;
    return { x, y };
  }

  // Call at end of each frame.
  endFrame() {
    this.pressed.clear();
    this.released.clear();
    this.mouse.pressed = false;
    this.mouse.released = false;
    this.mouse.wheel = 0;
    this.anyKeyPressed = false;
  }
}
