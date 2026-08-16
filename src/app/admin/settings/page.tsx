"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Check,
  Building,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSettingsPage() {
  const settings = useQuery(api.siteSettings.get);
  const updateSettings = useMutation(api.siteSettings.update);

  const [siteName, setSiteName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappDisplay, setWhatsappDisplay] = useState("");

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setSiteName(settings.siteName || "TMS İthalat");
      setSlogan(settings.slogan || "Oto elektronik parçalar konusunda güvenilir çözüm ortağınız.");
      setPhone(settings.phone || "(0212) 861 32 72");
      setEmail(settings.email || "info@tmsithalat.com");
      setAddress(settings.address || "Hürriyet, İstiklal Cd. No:102, 34537 Büyükçekmece/İstanbul");
      setWorkingHours(settings.workingHours || "Pzt - Cmt: 08:30 - 18:30");
      setWhatsappNumber(settings.whatsappNumber || "+905340653222");
      setWhatsappDisplay(settings.whatsappDisplay || "0534 065 32 22");
    }
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateSettings({
        siteName,
        slogan,
        phone,
        email,
        address,
        workingHours,
        whatsappNumber,
        whatsappDisplay,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Ayarlar kaydedilemedi:", err);
      alert("Ayarlar kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Kurumsal &amp; İletişim Ayarları</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Firma iletişim bilgilerinizi, telefon, e-posta, adres ve WhatsApp numaralarınızı yönetin.
          </p>
        </div>

        {saveSuccess && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Ayarlar Kaydedildi</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
        {/* Kurumsal Bilgiler */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 text-slate-900 font-bold text-xs sm:text-sm">
            <Building className="w-4 h-4 text-slate-500" />
            <span>Kurumsal &amp; İletişim Bilgileri</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Şirket Adı</label>
              <Input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="bg-white border-slate-200"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Slogan</label>
              <Input
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="bg-white border-slate-200"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Sabit Telefon</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-white border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">E-Posta</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-slate-200"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">WhatsApp Numarası (API)</label>
              <Input
                placeholder="+905340653222"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="bg-white border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">WhatsApp Görünür Metin</label>
              <Input
                placeholder="0534 065 32 22"
                value={whatsappDisplay}
                onChange={(e) => setWhatsappDisplay(e.target.value)}
                className="bg-white border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Çalışma Saatleri</label>
              <Input
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                className="bg-white border-slate-200"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Adres</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-white border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-7 h-10 rounded-lg shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4 mr-1.5" />
            <span>{saving ? "Kaydediliyor..." : "Ayarları Kaydet"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
