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
  Upload,
} from "lucide-react";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { useCallback, useEffect, useRef, useState } from "react";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-accent",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-heading",
});

const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_HEADING = "var(--font-heading), 'Montserrat', sans-serif";
const FONT_MONO = "var(--font-mono-accent), 'SF Mono', 'Roboto Mono', monospace";

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
  "Checking for fraud indicators",
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

vec2 hash2(vec2 p){
  p=vec2(dot(p,vec2(127.1,311.7)),
         dot(p,vec2(269.5,183.3)));
  return -1.0+2.0*fract(sin(p)*43758.5453123);
}

float noise(vec2 p){
  vec2 i=floor(p);
  vec2 f=fract(p);
  vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(dot(hash2(i),f),
                 dot(hash2(i+vec2(1,0)),f-vec2(1,0)),u.x),
             mix(dot(hash2(i+vec2(0,1)),f-vec2(0,1)),
                 dot(hash2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);
}

float fbm(vec2 p){
  float v=0.0,a=0.6;
  mat2 rot=mat2(0.866,0.5,-0.5,0.866);
  for(int i=0;i<2;i++){
    v+=a*noise(p);
    p=rot*p*1.6+100.0;
    a*=0.4;
  }
  return v;
}

float heightMap(vec2 st,float t){
  float q=fbm(st+vec2(t*0.02,t*0.015));
  float r=fbm(st+q*0.5+vec2(5.2,1.3)+t*0.015);
  float s=fbm(st+r*0.4+vec2(1.7,9.2)+t*0.012);
  float h=q*0.35+r*0.4+s*0.25;
  float s2=smoothstep(-0.70,0.70,h)*2.0-1.0;
  return sign(s2)*pow(abs(s2),0.85);
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution;
  float aspect=u_resolution.x/u_resolution.y;
  vec2 st=uv*vec2(0.65*aspect,1.1);
  float t=u_time;

  float eps=0.018;
  float h =heightMap(st,t);
  float hx=heightMap(st+vec2(eps,0),t);
  float hy=heightMap(st+vec2(0,eps),t);
  vec3 N=normalize(vec3((h-hx)/eps,(h-hy)/eps,0.25));

  float ambDiff=dot(N,normalize(vec3(0.3,0.8,1.0)))*0.5+0.5;

  vec2 mA=u_mouse*vec2(aspect,1.0);
  vec2 sA=uv*vec2(aspect,1.0);
  vec2 delta=mA-sA;
  float dist=length(delta);

  vec3 L=normalize(vec3(delta,0.35));
  float diff=max(dot(N,L),0.0);
  vec3 H=normalize(L+vec3(0,0,1));
  float spec=pow(max(dot(N,H),0.0),32.0);
  float falloff=exp(-dist*dist*4.5);

  vec3 shadow  =vec3(0.16,0.045,0.045);
  vec3 midtone =vec3(0.30,0.08,0.07);
  vec3 crimson =vec3(0.42,0.10,0.09);
  vec3 warmGlow=vec3(0.58,0.16,0.14);

  float shade=smoothstep(-0.5,0.6,h);
  vec3 col=mix(shadow,midtone,shade);
  col+=midtone*ambDiff*0.38;
  vec3 lit=mix(crimson,warmGlow,diff);
  col+=lit*diff*falloff*1.5;
  col+=warmGlow*spec*falloff*0.35;

  vec2 vc=uv-0.5;
  col*=1.0-dot(vc,vc)*0.3;
  col=pow(col,vec3(0.92));

  gl_FragColor=vec4(col,1.0);
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
      smoothX += (mouseX - smoothX) * 0.07;
      smoothY += (mouseY - smoothY) * 0.07;

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
      style={{ background: "#150202" }}
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
      className="flex w-full max-w-[540px] min-h-[720px] flex-col rounded-lg bg-white shadow-2xl"
    >
      <div
        className="flex items-center justify-between border-b border-gray-100 px-7 py-2.5"
        style={{ fontFamily: FONT_MONO }}
      >
        <span className="text-[12px] font-medium tracking-[0.15em] text-gray-400 uppercase">
          {STEP_LABELS[step]}
        </span>
        <span className="text-[12px] font-medium tracking-[0.15em] text-gray-400 uppercase">
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
        className="shrink-0 rounded-full bg-[#5c0e0e] px-5 py-2 text-[13px] font-semibold tracking-widest text-white uppercase transition-colors hover:bg-[#7a1616]"
        style={{ fontFamily: FONT_MONO }}
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
      <h2 className="text-[36px] leading-tight font-semibold tracking-[-0.04em] text-gray-900" style={{ fontFamily: FONT_HEADING }}>
        Welcome to Invisible Marketplace
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
        Verify your address. We need your address to verify you&apos;re a real
        person, to collect your documents.
      </p>
      <div className="flex-1" />
      <button
        onClick={onUpload}
        className="flex w-full items-center justify-between rounded-md bg-[#5c0e0e] px-5 py-3.5 text-[13px] font-semibold tracking-[0.15em] text-white uppercase transition-colors hover:bg-[#7a1616]"
        style={{ fontFamily: FONT_MONO }}
      >
        UPLOAD DOCUMENT
        <ArrowRight className="size-4" />
      </button>
    </>
  );
}

/* ─────────────────────── Step 2: Upload Document ─────────────────────── */

function UploadStep({
  onBack,
  onFileSelect,
}: Readonly<{
  onBack: () => void;
  onFileSelect: (file: File) => void;
}>) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setTimeout(() => onFileSelect(file), 1200);
  };

  return (
    <>
      <h2 className="text-[36px] leading-tight font-semibold tracking-[-0.04em] text-gray-900" style={{ fontFamily: FONT_HEADING }}>
        Upload Document
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
        Upload your document. We&apos;ll analyze it using our document
        verification API.
      </p>

      <span
        className="mt-6 text-[11px] font-medium tracking-[0.15em] text-gray-400 uppercase"
        style={{ fontFamily: FONT_MONO }}
      >
        Document
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleChange}
      />

      {selectedFile ? (
        <div className="mt-2 flex flex-1 flex-col items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 p-8">
          <div className="relative">
            <FileText className="size-10 text-emerald-600" />
            <CheckCircle2 className="absolute -right-1 -top-1 size-4 rounded-full bg-white text-emerald-500" />
          </div>
          <p className="mt-3 text-[13px] font-medium text-gray-900">
            {selectedFile.name}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <CheckCircle2 className="size-3" /> Verified
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-200 transition-colors hover:border-gray-300 hover:bg-gray-50"
        >
          <Upload className="size-5 text-gray-400" />
          <p className="text-[13px] text-gray-600">Click to upload</p>
          <p className="text-[11px] text-gray-400">
            PDF, JPG or PNG up to 10MB
          </p>
        </button>
      )}

      <div className="mt-6">
        <button
          onClick={onBack}
          className="flex size-10 items-center justify-center rounded-md border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600"
        >
          <ArrowLeft className="size-4" />
        </button>
      </div>
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
      <h2 className="text-[36px] leading-tight font-semibold tracking-[-0.04em] text-gray-900" style={{ fontFamily: FONT_HEADING }}>
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
      <label
        className="text-[11px] font-medium tracking-[0.15em] text-gray-400 uppercase"
        style={{ fontFamily: FONT_MONO }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-b border-gray-200 bg-transparent pb-2 text-[14px] text-gray-900 outline-none transition-colors focus:border-[#5c0e0e]"
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
      <h2 className="text-[36px] leading-tight font-semibold tracking-[-0.04em] text-gray-900" style={{ fontFamily: FONT_HEADING }}>
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
          className="flex flex-1 items-center justify-between rounded-md bg-[#5c0e0e] px-5 py-3.5 text-[13px] font-semibold tracking-[0.15em] text-white uppercase transition-colors hover:bg-[#7a1616] disabled:opacity-40"
          style={{ fontFamily: FONT_MONO }}
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
      <h2 className="mt-3 text-[36px] leading-tight font-semibold tracking-[-0.04em] text-gray-900" style={{ fontFamily: FONT_HEADING }}>
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

  const handleAgreeConsent = useCallback(() => {
    setShowConsent(false);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
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
    <div
      className={`relative flex min-h-screen flex-col ${ibmPlexMono.variable} ${dmSans.variable}`}
      style={{ fontFamily: FONT_BODY }}
    >
      <FluidBackground />

      {/* Card Area */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-4">
        <div className="w-full max-w-[540px]">
          <div className="mb-2 px-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 216 80" fill="none" className="h-[32px] w-auto text-white"><path d="M70.7021 73.3765V71.7501H72.4199C72.9499 71.7501 73.224 71.6404 73.425 71.147L73.7905 70.1602L70.0259 61.1325H72.2554L74.7956 67.5834L77.1165 61.1325H79.3277L75.2342 71.8232C74.7225 73.1572 73.9001 73.3765 72.8219 73.3765H70.7021Z" fill="currentColor"/><path d="M66.2535 70.5804C65.0108 70.5804 63.9691 70.087 63.2382 69.0088V70.3428H61.1183V57.5505H63.2382V62.4482C63.896 61.443 65.0108 60.8948 66.2535 60.8948C68.3003 60.8948 70.1094 62.6857 70.1094 65.7011C70.1094 68.7529 68.3003 70.5804 66.2535 70.5804ZM63.1833 65.7193C63.1833 67.492 64.0422 68.826 65.559 68.826C67.0576 68.826 67.9348 67.492 67.9348 65.7011C67.9348 63.9284 67.0576 62.6492 65.559 62.6492C64.0422 62.6492 63.1833 63.9467 63.1833 65.7193Z" fill="currentColor"/><path fillRule="evenodd" clipRule="evenodd" d="M97.2072 79.1305C103.163 79.1305 107.991 74.2962 107.991 68.3328C107.991 62.3693 103.163 57.535 97.2072 57.535C91.2516 57.535 86.4237 62.3693 86.4237 68.3328C86.4237 74.2962 91.2516 79.1305 97.2072 79.1305ZM104.756 60.7743H89.6587V75.8912H104.756V60.7743Z" fill="currentColor"/><path d="M208.204 79.5469C203.583 79.5469 200.656 76.0608 200.656 71.3715C200.656 66.7131 203.583 63.1961 208.204 63.1961C212.271 63.1961 215.598 65.5407 215.352 72.2661H204.23C204.445 74.8267 205.647 76.7395 208.235 76.7395C209.991 76.7395 211.162 75.8756 211.655 74.2714H215.167C214.674 77.2331 212.271 79.5469 208.204 79.5469ZM204.291 69.8598H211.84C211.655 67.145 210.361 65.9727 208.204 65.9727C205.832 65.9727 204.63 67.6694 204.291 69.8598Z" fill="currentColor"/><path d="M195.591 79.1458V57.5505H199.165V79.1458H195.591Z" fill="currentColor"/><path d="M187.608 79.547C185.513 79.547 183.757 78.714 182.525 76.8938V79.1459H178.951V57.5506H182.525V65.8185C183.634 64.1218 185.513 63.1962 187.608 63.1962C191.059 63.1962 194.109 66.2196 194.109 71.3099C194.109 76.4619 191.059 79.547 187.608 79.547ZM182.432 71.3408C182.432 74.3333 183.88 76.5853 186.438 76.5853C188.964 76.5853 190.443 74.3333 190.443 71.3099C190.443 68.3174 188.964 66.1579 186.438 66.1579C183.88 66.1579 182.432 68.3483 182.432 71.3408Z" fill="currentColor"/><path d="M172.992 79.1457V63.5971H176.596V79.1457H172.992ZM172.56 59.3397C172.56 58.1057 173.546 57.1185 174.778 57.1185C176.011 57.1185 176.997 58.1057 176.997 59.3397C176.997 60.5737 176.011 61.5609 174.778 61.5609C173.546 61.5609 172.56 60.5737 172.56 59.3397Z" fill="currentColor"/><path d="M164.889 79.5469C160.638 79.5469 158.111 77.5107 157.865 74.2714H161.469C161.777 75.9991 162.979 76.8012 164.982 76.8012C166.738 76.8012 167.847 76.0299 167.847 74.8267C167.847 73.8704 167.138 73.2534 165.844 72.9757L162.733 72.3587C160.453 71.8651 158.296 70.7236 158.296 67.9471C158.296 65.1088 160.915 63.1961 164.643 63.1961C168.309 63.1961 170.897 64.7386 171.205 68.1322H167.631C167.385 66.6822 166.307 65.911 164.581 65.911C162.979 65.911 161.87 66.6822 161.87 67.762C161.87 68.8109 162.733 69.3045 163.811 69.5205L167.138 70.1683C169.233 70.5694 171.483 71.7725 171.483 74.6108C171.483 77.7267 168.679 79.5469 164.889 79.5469Z" fill="currentColor"/><path d="M152.95 79.1459V63.5973H156.555V79.1459H152.95ZM152.827 61.2835V57.5506H156.678V61.2835H152.827Z" fill="currentColor"/><path d="M142.098 79.1457L136.429 63.5971H140.28L144.223 75.4745L148.167 63.5971H152.049L146.38 79.1457H142.098Z" fill="currentColor"/><path d="M121.78 79.1458V63.5972H125.354V65.9418C126.401 64.1833 128.404 63.1961 130.499 63.1961C133.98 63.1961 136.045 65.4482 136.045 69.3971V79.1458H132.471V69.829C132.471 67.4843 131.177 66.1886 129.205 66.1886C127.017 66.1886 125.354 67.9779 125.354 70.3843V79.1458H121.78Z" fill="currentColor"/><path d="M115.467 79.1459V57.5506H119.195V79.1459H115.467Z" fill="currentColor"/><path d="M206.362 46.2V0H214.018V46.2H206.362Z" fill="currentColor"/><path d="M181.03 47.058C174.496 47.058 170.272 43.23 170.272 37.422C170.272 29.634 177.004 27.786 182.614 26.862L189.016 25.938C191.458 25.542 192.052 24.288 192.052 22.77C192.052 20.064 190.204 17.886 186.112 17.886C182.152 17.886 179.578 19.734 179.116 23.364H171.46C172.384 15.972 178.258 12.078 186.178 12.078C195.154 12.078 199.642 16.368 199.642 24.42V38.676C199.642 39.6 200.302 40.194 201.226 40.194H203.008V46.2H198.124C194.758 46.2 192.646 44.55 192.646 41.976V41.25C189.742 45.474 185.386 47.058 181.03 47.058ZM178.06 36.63C178.06 39.6 180.238 41.25 183.538 41.25C188.818 41.25 192.052 36.894 192.052 31.416V29.634C191.062 30.162 190.138 30.36 189.016 30.624L184.066 31.482C179.908 32.208 178.06 33.792 178.06 36.63Z" fill="currentColor"/><path d="M134.401 47.058C127.009 47.058 120.475 40.458 120.475 29.436C120.475 18.546 127.009 12.078 134.401 12.078C138.955 12.078 142.915 14.058 145.291 17.688V0H152.947V46.2H145.291V41.382C142.651 45.276 138.955 47.058 134.401 47.058ZM128.329 29.436C128.329 35.904 131.431 40.722 136.909 40.722C142.387 40.722 145.555 35.904 145.555 29.502C145.555 23.1 142.387 18.414 136.909 18.414C131.431 18.414 128.329 23.034 128.329 29.436Z" fill="currentColor"/><path d="M109.029 46.1999V12.936H116.751V46.1999H109.029Z" fill="currentColor"/><path d="M108.768 0.441581H116.999V8.67278H108.768V0.441581Z" fill="currentColor"/><path d="M158.305 46.1996V12.9359H166.027V46.1996H158.305Z" fill="currentColor"/><path d="M166.723 4.55718C166.723 7.07399 164.683 9.11431 162.166 9.11431C159.649 9.11431 157.609 7.07399 157.609 4.55718C157.609 2.04037 159.649 5.14984e-05 162.166 5.14984e-05C164.683 5.14984e-05 166.723 2.04037 166.723 4.55718Z" fill="currentColor"/><path d="M86.8359 46.2V12.936H94.4919V18.612C96.4059 14.586 99.5079 12.936 103.732 12.936H105.514V20.196H102.94C97.2639 20.196 94.4919 23.76 94.4919 30.096V46.2H86.8359Z" fill="currentColor"/><path d="M67.8192 47.058C57.9192 47.058 51.6492 39.6 51.6492 29.568C51.6492 19.602 57.9192 12.078 67.8192 12.078C76.5312 12.078 83.6591 17.094 83.1311 31.482H59.3051C59.7671 36.96 62.3411 41.052 67.8851 41.052C71.6471 41.052 74.1552 39.204 75.2112 35.772H82.7352C81.6792 42.108 76.5312 47.058 67.8192 47.058ZM59.4371 26.334H75.6071C75.2111 20.526 72.4392 18.018 67.8192 18.018C62.7372 18.018 60.1631 21.648 59.4371 26.334Z" fill="currentColor"/><path d="M2.43187e-05 46.2V0H11.352L23.76 36.498L35.97 0H47.256V46.2H39.798V10.296L27.39 46.2H20.064L7.52402 10.494V46.2H2.43187e-05Z" fill="currentColor"/></svg>
          </div>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepCard step={1}>
                <WelcomeStep onUpload={() => setStep(2)} />
              </StepCard>
            )}
            {step === 2 && (
              <StepCard step={2}>
                <UploadStep
                  onBack={() => setStep(1)}
                  onFileSelect={handleFileSelect}
                />
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
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-6 text-center" style={{ fontFamily: FONT_MONO }}>
        <div className="flex items-center justify-center gap-6 text-[13px] font-medium tracking-[0.15em] text-white/30 uppercase">
          <span className="cursor-pointer transition-colors hover:text-white/50">
            Privacy Policy
          </span>
          <span className="cursor-pointer transition-colors hover:text-white/50">
            Terms of Use
          </span>
        </div>
        <p className="mt-2 text-[11px] tracking-[0.12em] text-white/20 uppercase">
          All Rights Reserved &middot; Invisible Marketplace
        </p>
      </footer>

      {/* Blur overlay while cookie consent is showing */}
      <AnimatePresence>
        {showConsent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 backdrop-blur-md bg-black/10"
          />
        )}
      </AnimatePresence>

      {/* Cookie Banner */}
      <AnimatePresence>
        {showConsent && <CookieBanner onAgree={handleAgreeConsent} />}
      </AnimatePresence>
    </div>
  );
}