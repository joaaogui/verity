"use client";

import { useEffect, useRef } from "react";

export interface FluidParams {
  warpStrength: number;
  waveFreq: number;
  waveAmplitude: number;
  compression: number;
  foldsMix: number;
  normalStrength: number;
  lightHeight: number;
  specularPower: number;
  lightFalloff: number;
  diffuseIntensity: number;
  specularIntensity: number;
}

export const DEFAULT_PARAMS: FluidParams = {
  warpStrength: 2,
  waveFreq: 1.15,
  waveAmplitude: 1.8,
  compression: 0.1,
  foldsMix: 0.75,
  normalStrength: 7,
  lightHeight: 0.85,
  specularPower: 130,
  lightFalloff: 13,
  diffuseIntensity: 2.4,
  specularIntensity: 0.8,
};

const VERT_SRC = `attribute vec2 a_position;
void main(){gl_Position=vec4(a_position,0.0,1.0);}`;

const FRAG_SRC = `precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

uniform float u_warp_strength;
uniform float u_wave_freq;
uniform float u_wave_amplitude;
uniform float u_compression;
uniform float u_folds_mix;
uniform float u_normal_strength;
uniform float u_light_height;
uniform float u_specular_power;
uniform float u_light_falloff;
uniform float u_diffuse_intensity;
uniform float u_specular_intensity;

#define PI 3.14159265359

vec2 hash(vec2 p){
    p = vec2(dot(p,vec2(127.1,311.7)),
             dot(p,vec2(269.5,183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = f*f*(3.0-2.0*f);

    return mix(
        mix(dot(hash(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),
            dot(hash(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
        mix(dot(hash(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),
            dot(hash(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x),
        u.y
    );
}

float fbm(vec2 p){
    float v = 0.0;
    float a = 0.5;

    for(int i=0;i<2;i++){
        v += a * noise(p);
        p *= 2.0;
        a *= .5;
    }

    return v;
}

// Silk height field: warped waves + wrinkle detail
float silk(vec2 uv, float t){

    // Warp UVs with noise so the waves aren't uniform
    vec2 warp = vec2(
        fbm(uv*0.6 + t*0.035),
        fbm(uv*0.6 - t*0.025 + 3.7)
    );

    uv += warp * u_warp_strength;

    float f = u_wave_freq;
    float wave =
        sin(uv.x * 3.5*f + uv.y*1.8*f + t*0.2) +
        sin(uv.x * 1.8*f - uv.y*1.2*f + t*0.13) +
        sin(uv.y * 2.4*f + uv.x*0.9*f + t*0.17) * 0.5;

    // Soft-clip peaks (tanh approximation)
    float ew = exp(2.0 * wave * u_compression);
    wave = ((ew - 1.0) / (ew + 1.0)) * u_wave_amplitude;

    float folds = fbm(vec2(uv.x*0.4 + wave*0.3, uv.y*0.2));

    return wave + folds * u_folds_mix;
}

void main(){

    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;

    vec2 st = uv * vec2(aspect,1.0);
    float t = u_time;

    float h = silk(st*1.3, t);

    // Estimate surface normal from neighboring height samples
    float eps = 0.002;

    float hx = silk((st + vec2(eps,0.0))*1.3, t);
    float hy = silk((st + vec2(0.0,eps))*1.3, t);

    vec3 N = normalize(vec3((h-hx)*u_normal_strength, (h-hy)*u_normal_strength, eps));

    vec2 mouse = u_mouse * vec2(aspect,1.0);
    vec2 p = uv * vec2(aspect,1.0);

    vec2 delta = mouse - p;
    float dist = length(delta);

    vec3 L = normalize(vec3(delta,u_light_height));
    vec3 V = vec3(0.0,0.0,1.0);

    float diff = max(dot(N,L),0.0);

    vec3 H = normalize(L + V);

    float spec = pow(max(dot(N,H),0.0),u_specular_power);

    // Anisotropic highlight along vertical normals (silk sheen)
    float anisotropic = spec * smoothstep(0.0,0.7,abs(N.y));

    float falloff = 1.0 / (1.0 + dist*dist*u_light_falloff);

    vec3 shadow = vec3(0.15,0.04,0.04);
    vec3 mid = vec3(0.32,0.09,0.08);
    vec3 crimson = vec3(0.46,0.12,0.10);
    vec3 glow = vec3(0.65,0.20,0.18);

    float shade = smoothstep(-0.6,0.6,h);

    vec3 col = mix(shadow,mid,shade);

    col += mid * 0.25;

    vec3 lit = mix(crimson,glow,diff);

    col += lit * diff * falloff * u_diffuse_intensity;

    col += glow * anisotropic * falloff * u_specular_intensity;

    vec2 vc = uv - 0.5;
    col *= 1.0 - dot(vc,vc)*0.35;

    col = pow(col,vec3(0.9));

    gl_FragColor = vec4(col,1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

interface FluidBackgroundProps {
  readonly params?: FluidParams;
}

export function FluidBackground({ params = DEFAULT_PARAMS }: FluidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uWarpStrength = gl.getUniformLocation(prog, "u_warp_strength");
    const uWaveFreq = gl.getUniformLocation(prog, "u_wave_freq");
    const uWaveAmplitude = gl.getUniformLocation(prog, "u_wave_amplitude");
    const uCompression = gl.getUniformLocation(prog, "u_compression");
    const uFoldsMix = gl.getUniformLocation(prog, "u_folds_mix");
    const uNormalStrength = gl.getUniformLocation(prog, "u_normal_strength");
    const uLightHeight = gl.getUniformLocation(prog, "u_light_height");
    const uSpecularPower = gl.getUniformLocation(prog, "u_specular_power");
    const uLightFalloff = gl.getUniformLocation(prog, "u_light_falloff");
    const uDiffuseIntensity = gl.getUniformLocation(prog, "u_diffuse_intensity");
    const uSpecularIntensity = gl.getUniformLocation(prog, "u_specular_intensity");

    let mouseX = 0.5, mouseY = 0.5;
    let smoothX = 0.5, smoothY = 0.5;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX / globalThis.innerWidth;
      mouseY = 1 - e.clientY / globalThis.innerHeight;
    };
    globalThis.addEventListener("mousemove", onMove);

    const resize = () => {
      const dpr = Math.min(globalThis.devicePixelRatio, 1.5);
      canvas.width = globalThis.innerWidth * dpr;
      canvas.height = globalThis.innerHeight * dpr;
      canvas.style.width = globalThis.innerWidth + "px";
      canvas.style.height = globalThis.innerHeight + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    globalThis.addEventListener("resize", resize);

    const t0 = performance.now();
    let raf = 0;

    const draw = () => {
      smoothX += (mouseX - smoothX) * 0.07;
      smoothY += (mouseY - smoothY) * 0.07;

      const p = paramsRef.current;

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl.uniform2f(uMouse, smoothX, smoothY);
      gl.uniform1f(uWarpStrength, p.warpStrength);
      gl.uniform1f(uWaveFreq, p.waveFreq);
      gl.uniform1f(uWaveAmplitude, p.waveAmplitude);
      gl.uniform1f(uCompression, p.compression);
      gl.uniform1f(uFoldsMix, p.foldsMix);
      gl.uniform1f(uNormalStrength, p.normalStrength);
      gl.uniform1f(uLightHeight, p.lightHeight);
      gl.uniform1f(uSpecularPower, p.specularPower);
      gl.uniform1f(uLightFalloff, p.lightFalloff);
      gl.uniform1f(uDiffuseIntensity, p.diffuseIntensity);
      gl.uniform1f(uSpecularIntensity, p.specularIntensity);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      globalThis.removeEventListener("mousemove", onMove);
      globalThis.removeEventListener("resize", resize);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0"
      style={{ background: "#150202" }}
    />
  );
}
