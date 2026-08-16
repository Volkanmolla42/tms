"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { generateWhatsAppLink } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function FloatingWhatsApp() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const settings = useQuery(api.siteSettings.get);
  const whatsappNumber = settings?.whatsappNumber || "+905340653222";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const url = generateWhatsAppLink(
      whatsappNumber,
      undefined,
      undefined,
      message || "Merhaba TMS İthalat, parça danışmak istiyorum."
    );
    window.open(url, "_blank");
    setOpen(false);
    setMessage("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* WhatsApp Popup Card */}
      {open && (
        <div className="mb-3 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 fill-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm">TMS İthalat Müşteri Destek</h4>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping inline-block" />
                  Genellikle birkaç dakika içinde yanıt verir
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Body */}
          <div className="p-4 bg-slate-50 space-y-3">
            <div className="bg-white p-3 rounded-xl rounded-tl-none border border-slate-200/80 shadow-xs max-w-[85%] text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-slate-900">
                👋 Merhaba! TMS İthalat&apos;a hoş geldiniz.
              </p>
              <p>
                Aradığınız OEM no veya araç bilgilerinizi (Marka, Model, Yıl, Motor) yazarak anında fiyat ve stok bilgisi alabilirsiniz!
              </p>
              <span className="text-[10px] text-slate-400 block text-right">Şimdi</span>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              placeholder="Mesajınızı veya OEM no yazın..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 bg-slate-100 border-none rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3.5 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(!open)}
        className="group relative flex items-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white p-4 sm:px-5 sm:py-3.5 rounded-full shadow-2xl hover:shadow-emerald-500/40 transition-all hover:scale-105 cursor-pointer"
        aria-label="WhatsApp Canlı Destek"
      >
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
        <MessageCircle className="w-7 h-7 fill-white shrink-0" />
        <span className="hidden sm:inline font-bold text-sm tracking-wide">
          WhatsApp Sipariş & Bilgi
        </span>
      </button>
    </div>
  );
}
