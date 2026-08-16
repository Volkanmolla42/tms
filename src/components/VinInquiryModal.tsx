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
import { MessageCircle, FileSearch, CheckCircle2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { generateWhatsAppLink } from "@/lib/utils";

interface VinInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VinInquiryModal({ isOpen, onClose }: VinInquiryModalProps) {
  const [vin, setVin] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [partName, setPartName] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const createInquiry = useMutation(api.inquiries.create);
  const settings = useQuery(api.siteSettings.get);
  const whatsappNumber = settings?.whatsappNumber || "+905340653222";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vin || !phone) return;
    setLoading(true);

    try {
      await createInquiry({
        name: name || "Şasi No Sorgusu",
        phone,
        vehicleInfo: `ŞASİ (VIN): ${vin.toUpperCase()}`,
        message: `Aranan Parça: ${partName}. Ek Not: ${message}`,
        type: "vin_search",
      });

      setSubmitted(true);

      // Forward to WhatsApp with pre-formatted VIN inquiry
      const whatsappMsg = `Merhaba TMS İthalat,\n\nAraç Şasi Numaram (VIN): ${vin.toUpperCase()}\nİstediğim Parça: ${partName || "Motor Beyni / Elektronik Modül"}\nİletişim: ${name} (${phone})\n\nAracıma uygun orijinal parçanın stok ve fiyat bilgisini öğrenebilir miyim?`;
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
            <FileSearch className="w-5 h-5 text-blue-600" />
            <span>Şasi Numarası (VIN) İle Parça Bul</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Ruhsatınızdaki 17 haneli şasi numarasını girin, orijinal kataloglarımızdan aracınıza %100 uyumlu parçayı bulup iletelim.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Şasi Sorgusu Alındı!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Katalog uzmanlarımız şasi numaranızı inceleyip WhatsApp üzerinden parça kodunu ve fiyatını gönderecektir.
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
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                17 Haneli Şasi Numarası (VIN) *
              </label>
              <Input
                required
                maxLength={17}
                placeholder="Örn: WVWZZZ3CZBE123456"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                className="font-mono tracking-widest uppercase font-bold text-sm bg-slate-50"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Ruhsatınızın &quot;E&quot; maddesinde yer alır.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Aradığınız Parça Nedir? *
              </label>
              <Input
                required
                placeholder="Örn: Motor Beyni, ABS Beyni, BCM Modülü..."
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Adınız Soyadınız
                </label>
                <Input
                  placeholder="Ahmet Yılmaz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Telefon Numaranız *
                </label>
                <Input
                  required
                  type="tel"
                  placeholder="0534 000 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Ek Bilgi veya Sorunuz
              </label>
              <Textarea
                placeholder="Arıza belirtileri veya parça üzerindeki diğer numaralar..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="whatsapp"
                disabled={loading}
                className="w-full font-bold h-11 justify-center shadow-md shadow-emerald-500/20"
              >
                <MessageCircle className="w-4 h-4 mr-2 fill-white" />
                <span>{loading ? "Sorgulanıyor..." : "Şasi No ile WhatsApp'tan Sor"}</span>
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
