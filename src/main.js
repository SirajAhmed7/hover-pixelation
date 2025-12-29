import "./style.css";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import vertex from "./shaders/vertex.glsl";
import fragment from "./shaders/fragment.glsl";

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Textures
 */
let imgAspectRatio = 1;

const textureLoader = new THREE.TextureLoader();

const bgImgTexture = await textureLoader.loadAsync("/images/bg.jpg");

bgImgTexture.magFilter = THREE.NearestFilter;
bgImgTexture.minFilter = THREE.NearestFilter;
bgImgTexture.colorSpace = THREE.SRGBColorSpace;

/**
 * Materials
 */

const mouse = {
  x: 0.5,
  y: 0.5,
};

// Trail system
const TRAIL_LENGTH = 15; // Number of trail points
const trailPositions = [];
const trailStrengths = [];

// Initialize trail arrays with default values
for (let i = 0; i < TRAIL_LENGTH; i++) {
  trailPositions.push(0.5, 0.5); // x, y pairs
  trailStrengths.push(0.0);
}

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTexture: { value: bgImgTexture },
    uImgAspectRatio: {
      value: bgImgTexture.image.width / bgImgTexture.image.height,
    },
    uCanvasAspectRatio: {
      value:
        canvas.getBoundingClientRect().width /
        canvas.getBoundingClientRect().height,
    },
    uCanvasSize: {
      value: new THREE.Vector2(
        canvas.getBoundingClientRect().width,
        canvas.getBoundingClientRect().height
      ),
    },
    uGridSize: { value: 28 },
    uMouse: { value: new THREE.Vector2(mouse.x, mouse.y) },
    uTrailPositions: { value: trailPositions },
    uTrailStrengths: { value: trailStrengths },
    uTrailLength: { value: TRAIL_LENGTH },
    uPixelationRadius: { value: 0.125 },
    uTrailDecay: { value: 0.9 }, // How fast the trail fades (0.9-0.98 works well)
    uTime: { value: 0 },
  },
  vertexShader: vertex,
  fragmentShader: fragment,
});

gui
  .add(material.uniforms.uGridSize, "value")
  .min(1)
  .max(100)
  .step(1)
  .name("GridSize");

gui
  .add(material.uniforms.uPixelationRadius, "value")
  .min(0.05)
  .max(0.3)
  .step(0.005)
  .name("Pixelation Radius");

gui
  .add(material.uniforms.uTrailDecay, "value")
  .min(0.85)
  .max(0.99)
  .step(0.01)
  .name("Trail Decay");

gui.hide();

/**
 * Objects
 */

const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
scene.add(plane);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update canvas aspect ratio
  material.uniforms.uCanvasAspectRatio.value = sizes.width / sizes.height;
});

window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX / sizes.width;
  mouse.y = 1 - e.clientY / sizes.height;
});

/**
 * Camera
 */
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 1000);
camera.position.z = 0.5;
scene.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let lastMouseX = mouse.x;
let lastMouseY = mouse.y;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update time
  material.uniforms.uTime.value = elapsedTime;

  // Calculate mouse movement
  const deltaX = mouse.x - lastMouseX;
  const deltaY = mouse.y - lastMouseY;
  const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // Update trail
  // Shift trail positions
  for (let i = TRAIL_LENGTH - 1; i > 0; i--) {
    trailPositions[i * 2] = trailPositions[(i - 1) * 2];
    trailPositions[i * 2 + 1] = trailPositions[(i - 1) * 2 + 1];

    // Decay strength
    trailStrengths[i] =
      trailStrengths[i - 1] * material.uniforms.uTrailDecay.value;
  }

  // Add new position at the front
  trailPositions[0] = mouse.x;
  trailPositions[1] = mouse.y;

  // Set strength based on movement (higher movement = stronger effect)
  trailStrengths[0] = Math.min(movement * 50, 1.0); // Scale factor to make movement more visible

  // Update uniforms
  material.uniforms.uMouse.value.set(mouse.x, mouse.y);
  material.uniforms.uTrailPositions.value = trailPositions;
  material.uniforms.uTrailStrengths.value = trailStrengths;

  lastMouseX = mouse.x;
  lastMouseY = mouse.y;

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
