"use client";

import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react";

// ============================================
// MovieVerse — Global Toast Notification System
// Replaces all alert() calls with elegant animated toasts
// ============================================

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isLeaving, setIsLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const duration = toast.duration || 4000;
    timerRef.current = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, duration);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, toast.duration, onDismiss]);

  const handleDismiss = () => {
    clearTimeout(timerRef.current);
    setIsLeaving(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const configs = {
    success: {
      icon: CheckCircle,
      bg: "from-emerald-500/15 to-emerald-500/5",
      border: "border-emerald-500/30",
      iconColor: "text-emerald-400",
      glow: "shadow-[0_0_20px_rgba(34,197,94,0.1)]",
    },
    error: {
      icon: AlertTriangle,
      bg: "from-rose-500/15 to-rose-500/5",
      border: "border-rose-500/30",
      iconColor: "text-rose-400",
      glow: "shadow-[0_0_20px_rgba(244,63,94,0.1)]",
    },
    info: {
      icon: Info,
      bg: "from-sky-500/15 to-sky-500/5",
      border: "border-sky-500/30",
      iconColor: "text-sky-400",
      glow: "shadow-[0_0_20px_rgba(56,189,248,0.1)]",
    },
  };

  const config = configs[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r ${config.bg} border ${config.border} ${config.glow} backdrop-blur-xl max-w-sm w-full transition-all duration-300 ${
        isLeaving ? "opacity-0 translate-x-4 scale-95" : "opacity-100 translate-x-0 scale-100"
      }`}
      style={{ animation: isLeaving ? "none" : "slideInRight 0.3s ease-out" }}
    >
      <Icon className={`w-5 h-5 ${config.iconColor} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]); // Keep max 5
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2.5 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
