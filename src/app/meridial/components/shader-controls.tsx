"use client";

import { useCallback, useState } from "react";

import type { FluidParams } from "./fluid-background";
import { DEFAULT_PARAMS } from "./fluid-background";

const STORAGE_KEY = "meridial-shader-params";

interface SliderDef {
  key: keyof FluidParams;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface SliderGroup {
  title: string;
  sliders: SliderDef[];
}

const GROUPS: SliderGroup[] = [
  {
    title: "Waves",
    sliders: [
      { key: "warpStrength", label: "Warp Strength", min: 0, max: 2, step: 0.05 },
      { key: "waveFreq", label: "Wave Frequency", min: 0.1, max: 3, step: 0.05 },
      { key: "waveAmplitude", label: "Wave Amplitude", min: 0.2, max: 4, step: 0.1 },
      { key: "compression", label: "Peak Compression", min: 0.1, max: 1.5, step: 0.05 },
      { key: "foldsMix", label: "Folds Mix", min: 0, max: 1, step: 0.05 },
      { key: "normalStrength", label: "Surface Relief", min: 0.5, max: 12, step: 0.5 },
    ],
  },
  {
    title: "Lighting",
    sliders: [
      { key: "lightHeight", label: "Light Height", min: 0.05, max: 2, step: 0.05 },
      { key: "specularPower", label: "Specular Sharpness", min: 5, max: 200, step: 5 },
      { key: "lightFalloff", label: "Light Falloff", min: 0.5, max: 30, step: 0.5 },
      { key: "diffuseIntensity", label: "Diffuse Intensity", min: 0, max: 6, step: 0.1 },
      { key: "specularIntensity", label: "Specular Intensity", min: 0, max: 3, step: 0.05 },
    ],
  },
];

export function loadParams(): FluidParams {
  if (typeof globalThis.window === "undefined") return DEFAULT_PARAMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PARAMS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PARAMS;
}

function saveParams(p: FluidParams) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
}

interface ShaderControlsProps {
  readonly params: FluidParams;
  readonly onChange: (params: FluidParams) => void;
}

export function ShaderControls({ params, onChange }: ShaderControlsProps) {
  const [open, setOpen] = useState(false);

  const handleChange = useCallback(
    (key: keyof FluidParams, value: number) => {
      const next = { ...params, [key]: value };
      saveParams(next);
      onChange(next);
    },
    [params, onChange],
  );

  const handleReset = useCallback(() => {
    saveParams(DEFAULT_PARAMS);
    onChange(DEFAULT_PARAMS);
  }, [onChange]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/60 text-sm font-serif italic text-white/80 backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-black/80 hover:text-white"
      >
        i
      </button>

      {open && (
        <div className="mt-2 max-h-[80vh] w-64 overflow-y-auto rounded-xl bg-black/70 p-4 backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-white/90 uppercase">
              Shader Controls
            </span>
            <button
              onClick={handleReset}
              className="text-[10px] text-white/50 transition-colors hover:text-white"
            >
              Reset
            </button>
          </div>

          {GROUPS.map(group => (
            <div key={group.title} className="mb-4 last:mb-0">
              <div className="mb-2 border-b border-white/10 pb-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                {group.title}
              </div>
              <div className="space-y-3">
                {group.sliders.map(s => (
                  <div key={s.key}>
                    <div className="mb-0.5 flex items-center justify-between">
                      <label className="text-[11px] text-white/70">{s.label}</label>
                      <span className="text-[10px] tabular-nums text-white/50">
                        {params[s.key].toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={params[s.key]}
                      onChange={e => handleChange(s.key, Number.parseFloat(e.target.value))}
                      className="slider-input h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-red-500 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
