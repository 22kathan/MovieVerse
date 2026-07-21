"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Server, Terminal, Copy, Check, ExternalLink, X, Cpu, Zap, Globe, Play } from "lucide-react";

interface ServerStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServerStatusModal({ isOpen, onClose }: ServerStatusModalProps) {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  if (!isOpen || typeof window === "undefined") return null;

  const steps = [
    { title: "1. Clone Repository", cmd: "git clone https://github.com/22kathan/MovieVerse.git" },
    { title: "2. Install Dependencies", cmd: "cd MovieVerse && npm install" },
    { title: "3. Start Node.js Server", cmd: "npm run dev" },
    { title: "4. (Optional) Public Tunnel", cmd: "npm run tunnel" },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(index);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 w-full h-full overflow-y-auto bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-lg"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl bg-[#12141d] rounded-2xl border border-amber-500/40 overflow-hidden shadow-2xl z-10 space-y-0 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500/20 via-black to-black border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base sm:text-lg flex items-center gap-2">
                  Node.js Backend Server
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active Mode
                  </span>
                </h3>
                <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1.5 mt-0.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" /> Install & Run Node.js Server on Your Device
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-[var(--text-secondary)] hover:text-white transition-colors border border-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 text-xs sm:text-sm text-[var(--text-secondary)]">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 leading-relaxed text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-400">
                <Zap className="w-4 h-4 shrink-0" />
                Want to run full Node.js Server on your local machine?
              </div>
              <p>
                Follow the 3 commands below to launch the backend server locally on port 2000 (<code className="bg-black/60 px-1.5 py-0.5 rounded font-mono text-amber-300">http://localhost:2000</code>).
              </p>
            </div>

            {/* Terminal Commands */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-amber-400" /> Command Line Terminal Instructions
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono">Shell / PowerShell</span>
              </div>

              <div className="space-y-2 font-mono">
                {steps.map((step, idx) => (
                  <div key={idx} className="bg-black/80 rounded-xl p-3 border border-white/10 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-amber-400 font-sans font-semibold">
                      <span>{step.title}</span>
                      <button
                        onClick={() => handleCopy(step.cmd, idx)}
                        className="inline-flex items-center gap-1 text-[10px] text-white/70 hover:text-white px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition cursor-pointer"
                      >
                        {copiedStep === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-emerald-400 text-xs overflow-x-auto whitespace-nowrap pt-1">
                      $ {step.cmd}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Local Server Link */}
            <div className="pt-2 border-t border-white/10 flex flex-col space-y-2">
              <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Connect from any device on your local Wi-Fi:
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <a
                  href="http://localhost:2000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs transition-all shadow-lg cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-black text-black" />
                  Localhost (localhost:2000)
                </a>

                <a
                  href="http://192.168.31.7:2000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs border border-emerald-500/40 transition-all cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-emerald-400" />
                  Wi-Fi (192.168.31.7:2000)
                </a>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer"
              >
                Continue Live Web Demo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
