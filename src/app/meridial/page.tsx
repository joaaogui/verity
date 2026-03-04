"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  Loader2,
  Shield,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Step = 1 | 2 | 3 | 4 | 5;

interface AddressData {
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const STEP_LABELS: Record<Step, string> = {
  1: "GETTING STARTED",
  2: "DOCUMENT UPLOAD",
  3: "DOCUMENT UPLOAD",
  4: "ADDRESS VERIFICATION",
  5: "COMPLETE",
};

const STATUS_MESSAGES = [
  "Extracting document data",
  "Running OCR analysis",
  "Validating information",
  "Verifying document authenticity",
  "Almost done",
];

const emptyAddress: AddressData = {
  fullName: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
};

/* ─────────────────────── Background ─────────────────────── */

const VERT_SRC = `attribute vec2 a_position;
void main(){gl_Position=vec4(a_position,0.0,1.0);}`;

const FRAG_SRC = `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

// Smooth value noise
vec3 hash(vec3 p){
  p=vec3(dot(p,vec3(127.1,311.7,74.7)),
         dot(p,vec3(269.5,183.3,246.1)),
         dot(p,vec3(113.5,271.9,124.6)));
  return -1.0+2.0*fract(sin(p)*43758.5453123);
}

float noise(vec3 p){
  vec3 i=floor(p);
  vec3 f=fract(p);
  vec3 u=f*f*(3.0-2.0*f);

  return mix(mix(mix(dot(hash(i+vec3(0,0,0)),f-vec3(0,0,0)),
                     dot(hash(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),
                 mix(dot(hash(i+vec3(0,1,0)),f-vec3(0,1,0)),
                     dot(hash(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
             mix(mix(dot(hash(i+vec3(0,0,1)),f-vec3(0,0,1)),
                     dot(hash(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),
                 mix(dot(hash(i+vec3(0,1,1)),f-vec3(0,1,1)),
                     dot(hash(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);
}

// Layered noise for smooth flowing surface
float fbm(vec3 p){
  float v=0.0;
  float a=0.55;
  vec3 shift=vec3(100.0);
  for(int i=0;i<2;i++){
    v+=a*noise(p);
    p=p*1.8+shift;
    a*=0.45;
  }
  return v;
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution;
  vec2 aspect=vec2(u_resolution.x/u_resolution.y,1.0);
  vec2 p=uv*aspect;

  float t=u_time*0.16;

  // Stretched noise for long flowing folds
  vec2 st=p*vec2(0.6, 1.4);

  vec3 q=vec3(st, t*0.4);
  float n1=fbm(q+vec3(0.0, 0.0, t*0.3));
  float n2=fbm(q+vec3(5.2, 1.3, t*0.2)+n1*1.0);
  float n3=fbm(q+vec3(1.7, 9.2, t*0.25)+n2*0.8);

  // Combined height field -- sharpen with contrast curve
  float h=n1*0.3+n2*0.5+n3*0.4;
  h=smoothstep(-0.18, 0.18, h)*2.0-1.0;

  // Compute surface normal from height field gradient
  float eps=0.003;
  vec2 sta=(uv+vec2(eps,0.0))*aspect*vec2(0.6,1.4);
  vec2 stb=(uv+vec2(0.0,eps))*aspect*vec2(0.6,1.4);

  vec3 qa=vec3(sta, t*0.4);
  float na1=fbm(qa+vec3(0.0,0.0,t*0.3));
  float na2=fbm(qa+vec3(5.2,1.3,t*0.2)+na1*1.0);
  float na3=fbm(qa+vec3(1.7,9.2,t*0.25)+na2*0.8);
  float ha=na1*0.3+na2*0.5+na3*0.4;
  ha=smoothstep(-0.18,0.18,ha)*2.0-1.0;

  vec3 qb=vec3(stb, t*0.4);
  float nb1=fbm(qb+vec3(0.0,0.0,t*0.3));
  float nb2=fbm(qb+vec3(5.2,1.3,t*0.2)+nb1*1.0);
  float nb3=fbm(qb+vec3(1.7,9.2,t*0.25)+nb2*0.8);
  float hb=nb1*0.3+nb2*0.5+nb3*0.4;
  hb=smoothstep(-0.18,0.18,hb)*2.0-1.0;

  vec3 normal=normalize(vec3((h-ha)/eps, (h-hb)/eps, 1.0));

  // Mouse light -- localized point light
  vec2 mousePos=u_mouse*aspect;
  vec2 surfPos=uv*aspect;
  vec2 toMouse=mousePos-surfPos;
  float mouseDist=length(toMouse);

  vec3 lightDir=normalize(vec3(toMouse, 0.35));
  float diff=max(dot(normal, lightDir), 0.0);
  float wrap=diff*0.6+0.4;

  // Tight falloff from mouse position
  float falloff=exp(-mouseDist*mouseDist*4.0);

  // Palette
  vec3 darkMaroon=vec3(0.15, 0.025, 0.03);
  vec3 deepRed=vec3(0.33, 0.06, 0.055);
  vec3 crimson=vec3(0.55, 0.08, 0.06);
  vec3 warmRose=vec3(0.75, 0.18, 0.12);

  // Base color from noise depth
  float shade=smoothstep(-0.4, 0.6, h);
  vec3 baseCol=mix(darkMaroon, deepRed, shade);

  // Ambient fill so unlit areas stay visible
  float ambDiff=dot(normal, normalize(vec3(0.3, 0.8, 1.0)))*0.5+0.5;
  baseCol+=deepRed*ambDiff*0.25;

  // Mouse-driven lighting layered on top
  vec3 lit=mix(crimson, warmRose, wrap*falloff);
  baseCol+=lit*wrap*falloff*1.4;

  // Softer vignette
  vec2 vc=uv-0.5;
  float vig=1.0-dot(vc,vc)*0.45;
  baseCol*=vig;

  // Gamma
  baseCol=pow(baseCol, vec3(0.92));

  gl_FragColor=vec4(baseCol, 1.0);
}`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
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
      smoothX += (mouseX - smoothX) * 0.15;
      smoothY += (mouseY - smoothY) * 0.15;

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl.uniform2f(uMouse, smoothX, smoothY);
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
      style={{ background: "#1a0303" }}
    />
  );
}

/* ─────────────────────── Card Shell ─────────────────────── */

function StepCard({
  step,
  children,
}: Readonly<{
  step: Step;
  children: React.ReactNode;
}>) {
  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex w-full max-w-[540px] min-h-[560px] flex-col rounded-lg bg-white shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-7 py-3">
        <span className="text-[10px] font-medium tracking-[0.15em] text-gray-400 uppercase">
          {STEP_LABELS[step]}
        </span>
        <span className="text-[10px] font-medium tracking-[0.15em] text-gray-400 uppercase">
          STEP {step}/5
        </span>
      </div>
      <div className="flex flex-1 flex-col px-7 py-6">{children}</div>
    </motion.div>
  );
}

/* ─────────────────────── Cookie Banner ─────────────────────── */

function CookieBanner({ onAgree }: Readonly<{ onAgree: () => void }>) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      className="fixed bottom-6 left-1/2 z-50 flex w-[90%] max-w-[620px] -translate-x-1/2 items-center gap-4 rounded-full bg-white px-6 py-3 shadow-xl"
    >
      <Shield className="size-5 shrink-0 text-[#6b1212]" />
      <p className="flex-1 text-xs leading-relaxed text-gray-600">
        We use cookies and collect personal information to verify your identity.
        By continuing, you consent to our{" "}
        <span className="font-medium text-gray-900 underline cursor-pointer">
          Privacy Policy
        </span>{" "}
        and{" "}
        <span className="font-medium text-gray-900 underline cursor-pointer">
          Cookie Policy
        </span>.
      </p>
      <button
        onClick={onAgree}
        className="shrink-0 rounded-full bg-[#5c0e0e] px-5 py-2 text-[11px] font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#7a1616]"
      >
        I AGREE
      </button>
    </motion.div>
  );
}

/* ─────────────────────── Step 1: Welcome ─────────────────────── */

function WelcomeStep({ onUpload }: Readonly<{ onUpload: () => void }>) {
  return (
    <>
      <h2
        className="text-[28px] leading-tight font-semibold text-gray-900"
        style={{ fontFamily: "var(--font-display), sans-serif" }}
      >
        Welcome to Invisible Marketplace
      </h2>
      <p className="mt-3 text-[13px] leading-relaxed text-gray-500">
        Verify your address. We need your address to verify you&apos;re a real
        person, to collect your documents.
      </p>
      <div className="flex-1" />
      <button
        onClick={onUpload}
        className="flex w-full items-center justify-between rounded-md bg-[#5c0e0e] px-5 py-3.5 text-[11px] font-semibold tracking-[0.15em] text-white uppercase transition-colors hover:bg-[#7a1616]"
      >
        UPLOAD DOCUMENT
        <ArrowRight className="size-4" />
      </button>
    </>
  );
}

/* ─────────────────────── Step 3: Analyzing ─────────────────────── */

function AnalyzingStep() {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="mb-4">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
      <h2
        className="text-[28px] leading-tight font-semibold text-gray-900"
        style={{ fontFamily: "var(--font-display), sans-serif" }}
      >
        Analyzing document
      </h2>
      <div className="flex-1" />
      <AnimatePresence mode="wait">
        <motion.p
          key={statusIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="text-center text-[13px] text-gray-400"
        >
          {STATUS_MESSAGES[statusIndex]}
        </motion.p>
      </AnimatePresence>
    </>
  );
}

/* ─────────────────────── Step 4: Address Verification ─────────────────────── */

function AddressField({
  label,
  value,
  onChange,
}: Readonly<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9px] font-medium tracking-[0.15em] text-gray-400 uppercase">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-b border-gray-200 bg-transparent pb-2 text-[14px] text-gray-900 outline-none transition-colors focus:border-[#5c0e0e]"
        style={{ fontFamily: "var(--font-sans), sans-serif" }}
      />
    </div>
  );
}

function VerificationStep({
  address,
  onChange,
  onBack,
  onContinue,
}: Readonly<{
  address: AddressData;
  onChange: (a: AddressData) => void;
  onBack: () => void;
  onContinue: () => void;
}>) {
  const isValid = address.streetAddress.trim().length > 0;

  return (
    <>
      <h2
        className="text-[28px] leading-tight font-semibold text-gray-900"
        style={{ fontFamily: "var(--font-display), sans-serif" }}
      >
        Confirm your details{address.fullName ? `, ${address.fullName}` : ""}
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
        We&apos;ve extracted your address information from the document. Please
        take a moment to review and confirm that these details are correct.
      </p>

      <div className="mt-4 rounded-md bg-emerald-50 px-4 py-3">
        <p className="text-[13px] text-emerald-700">
          <span className="mr-1">&#10003;</span> Address information
          successfully extracted from your document
        </p>
      </div>

      <div className="mt-6 space-y-5">
        <AddressField
          label="Street Address"
          value={address.streetAddress}
          onChange={(v) => onChange({ ...address, streetAddress: v })}
        />
        <div className="grid grid-cols-2 gap-5">
          <AddressField
            label="City"
            value={address.city}
            onChange={(v) => onChange({ ...address, city: v })}
          />
          <AddressField
            label="State"
            value={address.state}
            onChange={(v) => onChange({ ...address, state: v })}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <AddressField
            label="Zip Code"
            value={address.zipCode}
            onChange={(v) => onChange({ ...address, zipCode: v })}
          />
          <AddressField
            label="Country"
            value={address.country}
            onChange={(v) => onChange({ ...address, country: v })}
          />
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex size-10 items-center justify-center rounded-md border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600"
        >
          <ArrowLeft className="size-4" />
        </button>
        <button
          onClick={onContinue}
          disabled={!isValid}
          className="flex flex-1 items-center justify-between rounded-md bg-[#5c0e0e] px-5 py-3.5 text-[11px] font-semibold tracking-[0.15em] text-white uppercase transition-colors hover:bg-[#7a1616] disabled:opacity-40"
        >
          CONTINUE
          <ArrowRight className="size-4" />
        </button>
      </div>
    </>
  );
}

/* ─────────────────────── Step 5: Complete ─────────────────────── */

function CompleteStep() {
  const [saveToBeltic, setSaveToBeltic] = useState(false);
  const [setReminder, setSetReminder] = useState(false);

  return (
    <>
      <CheckCircle2 className="size-7 text-gray-700" />
      <h2
        className="mt-3 text-[28px] leading-tight font-semibold text-gray-900"
        style={{ fontFamily: "var(--font-display), sans-serif" }}
      >
        Verification Complete
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
        Your address has been verified and your document has been analyzed. Your
        information has been saved to our database.
      </p>

      <div className="mt-6 flex items-start gap-3 border-b border-gray-100 pb-5">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-gray-400" />
        <div>
          <p className="text-[14px] font-medium text-gray-900">
            Address Verified
          </p>
          <p className="text-[12px] text-gray-400">
            Document analyzed and saved
          </p>
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 border-b border-gray-100 pb-5">
        <input
          type="checkbox"
          checked={saveToBeltic}
          onChange={(e) => setSaveToBeltic(e.target.checked)}
          className="mt-1 size-4 shrink-0 cursor-pointer rounded border-gray-300 accent-[#5c0e0e]"
        />
        <FileText className="mt-0.5 size-4 shrink-0 text-gray-400" />
        <div>
          <p className="text-[14px] font-medium text-gray-900">
            Save information to Beltic
          </p>
          <p className="text-[12px] text-gray-400">
            Store your verification data securely in your Beltic account for
            easy access
          </p>
        </div>
      </label>

      <label className="mt-5 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={setReminder}
          onChange={(e) => setSetReminder(e.target.checked)}
          className="mt-1 size-4 shrink-0 cursor-pointer rounded border-gray-300 accent-[#5c0e0e]"
        />
        <CalendarClock className="mt-0.5 size-4 shrink-0 text-gray-400" />
        <div>
          <p className="text-[14px] font-medium text-gray-900">
            Set reminder for reverification
          </p>
          <p className="text-[12px] text-gray-400">
            Get notified in 6 months to update your verification documents
          </p>
        </div>
      </label>
    </>
  );
}

/* ─────────────────────── Main Page ─────────────────────── */

export default function MeridialPage() {
  const [step, setStep] = useState<Step>(1);
  const [showConsent, setShowConsent] = useState(true);
  const [address, setAddress] = useState<AddressData>(emptyAddress);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAgreeConsent = useCallback(() => {
    setShowConsent(false);
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Immediately go to the analyzing step once a file is chosen
    setStep(3);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/meridial/extract", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Extraction failed");

      const data = await res.json();
      setAddress({
        fullName: data.fullName || "",
        streetAddress: data.streetAddress || "",
        city: data.city || "",
        state: data.state || "",
        zipCode: data.zipCode || "",
        country: data.country || "",
      });
      setStep(4);
    } catch {
      setAddress(emptyAddress);
      setStep(4);
    }
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col font-sans">
      <FluidBackground />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Header */}
      <header className="relative z-10 mx-auto w-full max-w-[540px] px-4 pt-6">
        <h1
          className="text-[26px] font-semibold tracking-wide text-white"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          Meridial
        </h1>
        <p className="mt-0.5 text-[10px] tracking-[0.12em] text-white/50">
          by Invisible
        </p>
      </header>

      {/* Card Area */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-4">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepCard step={1}>
              <WelcomeStep onUpload={handleUploadClick} />
            </StepCard>
          )}
          {step === 3 && (
            <StepCard step={3}>
              <AnalyzingStep />
            </StepCard>
          )}
          {step === 4 && (
            <StepCard step={4}>
              <VerificationStep
                address={address}
                onChange={setAddress}
                onBack={() => setStep(1)}
                onContinue={() => setStep(5)}
              />
            </StepCard>
          )}
          {step === 5 && (
            <StepCard step={5}>
              <CompleteStep />
            </StepCard>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-6 text-center">
        <div className="flex items-center justify-center gap-6 text-[9px] font-medium tracking-[0.15em] text-white/30 uppercase">
          <span className="cursor-pointer transition-colors hover:text-white/50">
            Privacy Policy
          </span>
          <span className="cursor-pointer transition-colors hover:text-white/50">
            Terms of Use
          </span>
        </div>
        <p className="mt-2 text-[8px] tracking-[0.12em] text-white/20 uppercase">
          All Rights Reserved &middot; Invisible Marketplace
        </p>
      </footer>

      {/* Cookie Banner */}
      <AnimatePresence>
        {showConsent && <CookieBanner onAgree={handleAgreeConsent} />}
      </AnimatePresence>
    </div>
  );
}