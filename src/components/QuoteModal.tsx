"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, CheckCircle2, ShieldAlert } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { generateWhatsAppLink } from "@/lib/utils";

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle?: string;
  oemNumber?: string;
  productId?: any;
}

export default function QuoteModal({
  isOpen,
  onClose,
  productTitle,
  oemNumber,
  productId,
}: QuoteModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [message, setMessage] = useState(
    productTitle ? `${productTitle} (OEM: ${oemNumber || ""}) için fiyat ve temin bilgisi almak istiyorum.` : ""
  );
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const createInquiry = useMutation(api.inquiries.create);
  const settings = useQuery(api.siteSettings.get);
  const whatsappNumber = settings?.whatsappNumber || "+905340653222";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setLoading(true);

    try {
      await createInquiry({
        name,
        phone,
        productId,
        productTitle,
        oemNumber,
        vehicleInfo,
        message,
        type: "quote_request",
      });

      setSubmitted(true);

      // Open WhatsApp as well for instant chat
      const whatsappMsg = `Merhaba TMS İthalat,\n\nBen ${name} (${phone}).\nTalep Ettiğim Parça: ${productTitle || "Belirtilmedi"} (OEM: ${oemNumber || "Yok"})\nAraç Bilgisi: ${vehicleInfo || "Yok"}\nMesajım: ${message}`;
      const waUrl = generateWhatsAppLink(whatsappNumber, undefined, undefined, whatsappMsg);
      window.open(waUrl, "_blank");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-900">
            <span>Hızlı Teklif & Fiyat Talebi</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {productTitle
              ? `${productTitle} için stok ve fiyat durumunu hemen öğrenin.`
              : "Aradığınız parça için formu doldurun, dakikalar içinde yanıt verelim."}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Talebiniz Alındı!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Satış ve teknik ekibimiz WhatsApp ve telefon üzerinden sizinle en kısa sürede iletişime geçecektir.
            </p>
            <Button
              variant="default"
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-2"
            >
              Tamam
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
            {productTitle && (
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 text-xs">
                <span className="font-bold text-slate-900 block">{productTitle}</span>
                {oemNumber && (
                  <span className="font-mono text-blue-700 font-semibold block mt-0.5">
                    OEM NO: {oemNumber}
                  </span>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Adınız Soyadınız *
              </label>
              <Input
                required
                placeholder="Örn: Ahmet Yılmaz"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Telefon Numaranız (WhatsApp) *
              </label>
              <Input
                required
                type="tel"
                placeholder="Örn: 0534 000 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Araç Bilgisi (Marka / Model / Yıl / Motor)
              </label>
              <Input
                placeholder="Örn: VW Passat 2012 2.0 TDI 140 HP"
                value={vehicleInfo}
                onChange={(e) => setVehicleInfo(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Notunuz / İstekleriniz
              </label>
              <Textarea
                placeholder="Montaj, kodlama veya parça durumu hakkında sormak istedikleriniz..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="submit"
                variant="whatsapp"
                disabled={loading}
                className="w-full font-bold h-11 justify-center shadow-md shadow-emerald-500/20"
              >
                <MessageCircle className="w-4 h-4 mr-2 fill-white" />
                <span>{loading ? "Gönderiliyor..." : "WhatsApp ile Fiyat Al"}</span>
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
