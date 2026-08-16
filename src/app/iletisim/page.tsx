"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  CheckCircle2,
  ChevronRight,
  Home,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { generateWhatsAppLink } from "@/lib/utils";

export default function IletisimPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const createInquiry = useMutation(api.inquiries.create);
  const settings = useQuery(api.siteSettings.get);

  const whatsappNumber = settings?.whatsappNumber || "+905340653222";
  const displayPhone = settings?.phone || "+90 534 065 32 22";
  const displayEmail = settings?.email || "info@tmsithalat.com";
  const displayAddress = settings?.address || "Fevzipaşa Mh. 10121 Sk. No: 2 Karatay / KONYA";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setLoading(true);

    try {
      await createInquiry({
        name,
        phone,
        email,
        message: `Konu: ${subject}. Mesaj: ${message}`,
        type: "contact_form",
      });

      setSubmitted(true);
      setName("");
      setPhone("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span>Ana Sayfa</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-bold">İletişim</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase">
            Müşteri Hizmetleri
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            BİZE ULAŞIN
          </h1>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Oto elektronik parçalar, fiyat teklifleri veya sipariş sorularınız için bize telefon, WhatsApp veya iletişim formu üzerinden 7/24 ulaşabilirsiniz.
          </p>
        </div>
      </div>

      {/* Contact Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Contact Info Cards */}
          <div className="lg:col-span-5 space-y-5">
            {/* Phone & WhatsApp Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900 pb-2 border-b border-slate-100">
                Doğrudan İletişim Hatları
              </h3>

              <div className="space-y-4 text-xs sm:text-sm">
                <a
                  href={`tel:${displayPhone.replace(/\s+/g, "")}`}
                  className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">Telefon & Çağrı Merkezi</span>
                    <strong className="text-slate-900 text-sm sm:text-base font-bold">{displayPhone}</strong>
                  </div>
                </a>

                <a
                  href={generateWhatsAppLink(whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-950 transition-all hover:scale-[1.02] group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <span className="text-xs text-emerald-700 block font-bold">WhatsApp Hızlı Sipariş Hattı</span>
                    <strong className="text-emerald-900 text-sm sm:text-base font-black">
                      {settings?.whatsappDisplay || "+90 534 065 32 22"}
                    </strong>
                  </div>
                </a>

                <a
                  href={`mailto:${displayEmail}`}
                  className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">E-Posta Adresi</span>
                    <strong className="text-slate-900 text-sm font-bold">{displayEmail}</strong>
                  </div>
                </a>

                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">Depo & Mağaza Adresi</span>
                    <p className="text-slate-900 font-semibold text-xs leading-relaxed mt-0.5">
                      {displayAddress}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">Çalışma Saatleri</span>
                    <p className="text-slate-900 font-semibold text-xs mt-0.5">
                      {settings?.workingHours || "Pazartesi - Cumartesi: 08:30 - 19:00"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Bize Mesaj Gönderin
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Formu doldurduğunuzda talebiniz anında satış ekibimize iletilir.
                </p>
              </div>

              {submitted && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Mesajınız başarıyla iletildi! Ekibimiz en kısa sürede sizinle iletişime geçecektir.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Adınız Soyadınız *
                    </label>
                    <Input
                      required
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      E-Posta Adresiniz
                    </label>
                    <Input
                      type="email"
                      placeholder="ahmet@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Konu / Talep
                    </label>
                    <Input
                      placeholder="Örn: ECU Fiyatı, Toptan Bayilik..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Mesajınız *
                  </label>
                  <Textarea
                    required
                    placeholder="Aradığınız parça, araç marka-model veya sorunuz..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 font-bold h-12 rounded-xl text-sm justify-center cursor-pointer shadow-md shadow-blue-600/20"
                >
                  <Send className="w-4 h-4 mr-2" />
                  <span>{loading ? "Gönderiliyor..." : "Mesajı Gönder"}</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <FloatingWhatsApp />
      <Footer />
    </div>
  );
}
