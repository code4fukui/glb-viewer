/*
module.exports = {
  AFRAME_INJECTED: 'aframe-injected',
  DEFAULT_CAMERA_HEIGHT: 1.6,
  DEFAULT_HANDEDNESS: 'right',
  keyboardevent: require('./keyboardevent')
};
*/
//module.exports = {
  // Tiny KeyboardEvent.code polyfill.
const KEYCODE_TO_CODE = {
    '38': 'ArrowUp',
    '37': 'ArrowLeft',
    '40': 'ArrowDown',
    '39': 'ArrowRight',
    '87': 'KeyW',
    '65': 'KeyA',
    '83': 'KeyS',
    '68': 'KeyD',
  }
//};

/*
let KEYCODE_TO_CODE = require('../constants').keyboardevent.KEYCODE_TO_CODE;
let registerComponent = require('../core/component').registerComponent;
let THREE = require('../lib/three');
let utils = require('../utils/');
*/

//let bind = utils.bind;

function bind (fn, ctx/* , arg1, arg2 */) {
  return (function (prependedArgs) {
    return function bound () {
      // Concat the bound function arguments with those passed to original bind
      let args = prependedArgs.concat(Array.prototype.slice.call(arguments, 0));
      return fn.apply(ctx, args);
    };
  })(Array.prototype.slice.call(arguments, 2));
};

//let shouldCaptureKeyEvent = utils.shouldCaptureKeyEvent;
const shouldCaptureKeyEvent = function (event) {
  if (event.metaKey) { return false; }
  return document.activeElement === document.body;
};

let CLAMP_VELOCITY = 0.00001;
let MAX_DELTA = 0.2;
let KEYS = [
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown',
];

/**
 * WASD component to control entities using WASD keys.
 */
AFRAME.registerComponent("drone-controls-mode2", {
  schema: {
    acceleration: { default: 65 },
    adAxis: {default: 'x', oneOf: ['x', 'y', 'z']},
    adEnabled: {default: true},
    adInverted: {default: false},
    enabled: {default: true},
    fly: { default: false },
    wsAxis: {default: 'z', oneOf: ['x', 'y', 'z']},
    wsEnabled: {default: true},
    wsInverted: {default: false},
    yAxis: {default: 'y', oneOf: ['x', 'y', 'z']},
    yEnabled: { default: true },
    yInverted: { default: false },
    //role: { default: 'z', oneOf: ['x', 'y', 'z'] },
    roleEnabled: { default: true },
    roleInverted: { default: false },
  },

  init: function () {
    // To keep track of the pressed keys.
    this.keys = {};
    this.easing = 1.1;

    this.velocity = new THREE.Vector3();
    this.rotationx = 0;

    // Bind methods and add event listeners.
    this.onBlur = bind(this.onBlur, this);
    this.onContextMenu = bind(this.onContextMenu, this);
    this.onFocus = bind(this.onFocus, this);
    this.onKeyDown = bind(this.onKeyDown, this);
    this.onKeyUp = bind(this.onKeyUp, this);
    this.onVisibilityChange = bind(this.onVisibilityChange, this);
    this.attachVisibilityEventListeners();
  },

  tick: function (time, delta) {
    let data = this.data;
    let el = this.el;
    let velocity = this.velocity;

    const nochg = !velocity[data.adAxis] && !velocity[data.wsAxis] && !velocity[data.yAxis] && !this.rotationx;
    if (nochg && isEmptyObject(this.keys)) {
      return;
    }
    
    // Update velocity.
    delta = delta / 1000;
    this.updateVelocity(delta);

    if (nochg) {
      return;
    }

    el.object3D.rotation.y -= this.rotationx / 200;
    // Get movement vector and translate position.
    el.object3D.position.add(this.getMovementVector(delta));
    //console.log(el.object3D.rotation, el.object3D)
  },

  remove: function () {
    this.removeKeyEventListeners();
    this.removeVisibilityEventListeners();
  },

  play: function () {
    this.attachKeyEventListeners();
  },

  pause: function () {
    this.keys = {};
    this.removeKeyEventListeners();
  },

  updateVelocity: function (delta) {
    let acceleration;
    let adAxis;
    let adSign;
    let data = this.data;
    let keys = this.keys;
    let velocity = this.velocity;
    let wsAxis;

    adAxis = data.adAxis;
    wsAxis = data.wsAxis;
    const yAxis = data.yAxis;
    const role = data.role;

    // If FPS too low, reset velocity.
    if (delta > MAX_DELTA) {
      velocity[adAxis] = 0;
      velocity[wsAxis] = 0;
      velocity[yAxis] = 0;
      this.rotationx = 0;
      return;
    }

    // https://gamedev.stackexchange.com/questions/151383/frame-rate-independant-movement-with-acceleration
    let scaledEasing = Math.pow(1 / this.easing, delta * 60);
    // Velocity Easing.
    if (velocity[adAxis] !== 0) {
      velocity[adAxis] = velocity[adAxis] * scaledEasing;
    }
    if (velocity[wsAxis] !== 0) {
      velocity[wsAxis] = velocity[wsAxis] * scaledEasing;
    }
    if (velocity[yAxis] !== 0) {
      velocity[yAxis] = velocity[yAxis] * scaledEasing;
    }
    if (this.rotationx !== 0) {
      this.rotationx = this.rotationx * scaledEasing;
    }

    // Clamp velocity easing.
    if (Math.abs(velocity[adAxis]) < CLAMP_VELOCITY) { velocity[adAxis] = 0; }
    if (Math.abs(velocity[wsAxis]) < CLAMP_VELOCITY) { velocity[wsAxis] = 0; }
    if (Math.abs(velocity[yAxis]) < CLAMP_VELOCITY) { velocity[yAxis] = 0; }
    if (Math.abs(this.rotationx) < CLAMP_VELOCITY) { this.rotationx = 0; }
    
    if (!data.enabled) { return; }

    const mode2 = true;

    // Update velocity using keys pressed.
    acceleration = data.acceleration;
    if (data.adEnabled) {
      adSign = data.adInverted ? -1 : 1;
      if (keys.ArrowLeft) { velocity[adAxis] -= adSign * acceleration * delta; }
      if (keys.ArrowRight) { velocity[adAxis] += adSign * acceleration * delta; }
    }
    if (data.wsEnabled) {
      if (mode2) {
        const wsSign = data.wsInverted ? -1 : 1;
        if (keys.ArrowUp) { velocity[wsAxis] -= wsSign * acceleration * delta; }
        if (keys.ArrowDown) { velocity[wsAxis] += wsSign * acceleration * delta; }
      } else {
        if (keys.KeyW) { velocity[wsAxis] -= wsSign * acceleration * delta; }
        if (keys.KeyS) { velocity[wsAxis] += wsSign * acceleration * delta; }
      }
    }
    if (data.yEnabled) {
      const ySign = data.yInverted ? -1 : 1;
      if (mode2) {
        if (keys.KeyS) { velocity[yAxis] -= ySign * acceleration * delta; }
        if (keys.KeyW) { velocity[yAxis] += ySign * acceleration * delta; }
      } else {
        if (keys.ArrowDown) { velocity[yAxis] -= ySign * acceleration * delta; }
        if (keys.ArrowUp) { velocity[yAxis] += ySign * acceleration * delta; }
      }
    }
    if (data.roleEnabled) {
      if (keys.KeyA) { this.rotationx -= adSign * acceleration * delta; }
      if (keys.KeyD) { this.rotationx += adSign * acceleration * delta; }
    }
  },

  getMovementVector: (function () {
    let directionVector = new THREE.Vector3(0, 0, 0);

    return function (delta) {
      let rotation = this.el.getAttribute('rotation');
      //rotation.x = this.rotationx;
      let velocity = this.velocity;
      let xRotation = 0;

      directionVector.copy(velocity);
      directionVector.multiplyScalar(delta);

      // Absolute.
      if (!rotation) { return directionVector; }

      xRotation = this.data.fly ? rotation.x : 0;
      //console.log(xRotation, rotation.x)

      // Transform direction relative to heading.
      const rotationEuler = new THREE.Euler(0, 0, 0, 'YXZ');
      rotationEuler.set(THREE.Math.degToRad(xRotation), THREE.Math.degToRad(rotation.y), 0);
      directionVector.applyEuler(rotationEuler);
      return directionVector;
    };
  })(),

  attachVisibilityEventListeners: function () {
    window.oncontextmenu = this.onContextMenu;
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('focus', this.onFocus);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  },

  removeVisibilityEventListeners: function () {
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('focus', this.onFocus);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  },

  attachKeyEventListeners: function () {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  },

  removeKeyEventListeners: function () {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  },

  onContextMenu: function () {
    let keys = Object.keys(this.keys);
    for (let i = 0; i < keys.length; i++) {
      delete this.keys[keys[i]];
    }
  },

  onBlur: function () {
    this.pause();
  },

  onFocus: function () {
    this.play();
  },

  onVisibilityChange: function () {
    if (document.hidden) {
      this.onBlur();
    } else {
      this.onFocus();
    }
  },

  onKeyDown: function (event) {
    if (!shouldCaptureKeyEvent(event)) {
      return;
    }
    const code = event.code || KEYCODE_TO_CODE[event.keyCode];
    if (KEYS.indexOf(code) !== -1) {
      this.keys[code] = true;
    }
  },

  onKeyUp: function (event) {
    const code = event.code || KEYCODE_TO_CODE[event.keyCode];
    delete this.keys[code];
  }
});

function isEmptyObject (keys) {
  for (const key in keys) {
    return false;
  }
  return true;
}
