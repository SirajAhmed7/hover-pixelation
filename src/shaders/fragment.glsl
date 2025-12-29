uniform sampler2D uTexture;
uniform float uCanvasAspectRatio; 
uniform float uImgAspectRatio;
uniform vec2 uCanvasSize;
uniform float uGridSize;
uniform vec2 uMouse;
uniform float uTrailPositions[30]; // x,y pairs for 15 positions
uniform float uTrailStrengths[15];
uniform int uTrailLength;
uniform float uPixelationRadius;
uniform float uTime;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  
  // Adjust UVs for cover effect
  if (uCanvasAspectRatio > uImgAspectRatio) {
    float scale = uImgAspectRatio / uCanvasAspectRatio;
    uv.y = uv.y * scale + (1.0 - scale) * 0.5;
  } else {
    float scale = uCanvasAspectRatio / uImgAspectRatio;
    uv.x = uv.x * scale + (1.0 - scale) * 0.5;
  }
  
  // Adjust grid for square pixels
  vec2 grid = vec2(uGridSize * uImgAspectRatio, uGridSize);
  vec2 pixelatedUV = floor(uv * grid) / grid;
  
  // Calculate combined pixelation strength from all trail points
  float totalStrength = 0.0;
  
  for (int i = 0; i < 15; i++) {
    if (i >= uTrailLength) break;
    
    // Get trail position
    vec2 trailPos = vec2(uTrailPositions[i * 2], uTrailPositions[i * 2 + 1]);
    
    // Adjust trail position for aspect ratio
    if (uCanvasAspectRatio > uImgAspectRatio) {
      float scale = uImgAspectRatio / uCanvasAspectRatio;
      trailPos.y = trailPos.y * scale + (1.0 - scale) * 0.5;
    } else {
      float scale = uCanvasAspectRatio / uImgAspectRatio;
      trailPos.x = trailPos.x * scale + (1.0 - scale) * 0.5;
    }
    
    // Calculate distance from current pixel to trail point
    float dist = distance(trailPos, pixelatedUV);
    
    // Create falloff based on distance
    float falloff = 1.0 - smoothstep(0.0, uPixelationRadius, dist);
    
    // Combine with trail strength (which decays over time)
    totalStrength += falloff * uTrailStrengths[i];
  }
  
  // Clamp strength to 0-1 and use step function to decide whether to use pixelated or normal UV
  totalStrength = step(0.8, clamp(totalStrength, 0.0, 1.0));
  
  // Mix between normal UV and pixelated UV based on strength
  vec2 finalUV = mix(uv, pixelatedUV, totalStrength);
  
  vec4 color = texture2D(uTexture, finalUV);
  
  gl_FragColor = vec4(vec3(color * 1.35), 1.0);
}