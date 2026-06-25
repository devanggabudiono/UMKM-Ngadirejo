"use client";
import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`flex items-center justify-center gap-2.5 w-full py-4 px-5 rounded-2xl font-bold text-sm sm:text-base transition-all border cursor-pointer ${
        copied
          ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
          : "bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300 text-slate-700 shadow-sm"
      }`}
    >
      {copied ? (
        <>
          <Check className="w-5 h-5 shrink-0 text-emerald-600 animate-bounce" />
          <span>Tautan Disalin!</span>
        </>
      ) : (
        <>
          <Share2 className="w-5 h-5 shrink-0 text-slate-500" />
          <span>Bagikan Profil Usaha</span>
        </>
      )}
    </button>
  );
}
