"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  MessageCircle,
  FileText,
  HelpCircle,
  Phone,
  RotateCw,
  Check,
  Cpu,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import QuoteModal from "@/components/QuoteModal";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { generateWhatsAppLink } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"genel" | "oem" | "uyumlu" | "teknik" | "montaj">("genel");
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const product = useQuery(api.products.getBySlug, { slug });
  const settings = useQuery(api.siteSettings.get);

  const whatsappNumber = settings?.whatsappNumber || "+905340653222";
  const displayPhone = settings?.phone || "+90 534 065 32 22";

  if (product === undefined) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Cpu className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Ürün Detayı Yükleniyor...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="space-y-3 max-w-sm">
            <h2 className="text-xl font-bold text-slate-900">Ürün Bulunamadı</h2>
            <Link href="/urunler" className="inline-block px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">
              Tüm Ürünlere Dön
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Realistic 4 gallery photos matching Screenshot 3
  const galleryImages = [
    product.images?.[0] || "/images/catalog-ecu-banner.jpg",
    "/images/cat-ecu.jpg",
    "/images/cat-bcm.jpg",
    "/images/hero-ecu-modules.jpg",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* 1. Breadcrumbs matching Screenshot 3 */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600">Ana Sayfa</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link href="/urunler" className="hover:text-blue-600">Ürünler</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link href={`/urunler?kategori=${product.categorySlug}`} className="hover:text-blue-600">
            {product.categoryName}
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-mono font-bold">{product.oemNumber}</span>
        </div>
      </div>

      {/* 2. Top Product Card Showcase matching Screenshot 3 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Product Images Gallery */}
            <div className="lg:col-span-6 space-y-4">
              {/* Main Image Container */}
              <div className="relative aspect-4/3 w-full rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-4">
                <img
                  src={galleryImages[activeImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Thumbnails + 360° Badge matching Screenshot 3 */}
              <div className="flex items-center gap-3">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-16 rounded-lg overflow-hidden border-2 bg-slate-50 transition-all cursor-pointer ${
                      activeImageIndex === idx ? "border-blue-600" : "border-slate-200 opacity-70"
                    }`}
                  >
                    <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                  </button>
                ))}

                <div className="ml-auto">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
                    <RotateCw className="w-3.5 h-3.5" />
                    360°
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Specs & Actions matching Screenshot 3 */}
            <div className="lg:col-span-6 space-y-5">
              <div>
                <h1 className="font-mono text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  {product.oemNumber}
                </h1>
                <p className="text-base font-bold text-slate-700 mt-0.5">
                  {product.boschNumber ? "Bosch ECU" : `${product.brand} ECU`}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {product.brand} {product.model}
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  {product.yearRange}
                </p>

                {/* Badges: Çıkma / Test Edildi */}
                <div className="flex items-center gap-2 pt-2">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {product.condition}
                  </span>
                  {product.tested && (
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      Test Edildi
                    </span>
                  )}
                </div>
              </div>

              {/* Specs Table matching Screenshot 3 */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs divide-y divide-slate-100">
                <div className="grid grid-cols-2 p-2.5 bg-slate-50/50">
                  <span className="text-slate-500 font-medium">OEM Numarası</span>
                  <span className="font-mono font-bold text-slate-900">{product.oemNumber}</span>
                </div>
                <div className="grid grid-cols-2 p-2.5">
                  <span className="text-slate-500 font-medium">Bosch Numarası</span>
                  <span className="font-mono font-bold text-slate-900">{product.boschNumber || product.oemNumber}</span>
                </div>
                <div className="grid grid-cols-2 p-2.5 bg-slate-50/50">
                  <span className="text-slate-500 font-medium">Araç Markası</span>
                  <span className="font-bold text-slate-900">{product.brand}</span>
                </div>
                <div className="grid grid-cols-2 p-2.5">
                  <span className="text-slate-500 font-medium">Araç Modeli</span>
                  <span className="font-bold text-slate-900">{product.model}</span>
                </div>
                <div className="grid grid-cols-2 p-2.5 bg-slate-50/50">
                  <span className="text-slate-500 font-medium">Yıl Aralığı</span>
                  <span className="font-bold text-slate-900">{product.yearRange}</span>
                </div>
                <div className="grid grid-cols-2 p-2.5">
                  <span className="text-slate-500 font-medium">Yakıt Tipi</span>
                  <span className="font-bold text-slate-900">{product.fuelType}</span>
                </div>
                <div className="grid grid-cols-2 p-2.5 bg-slate-50/50">
                  <span className="text-slate-500 font-medium">Durum</span>
                  <span className="font-bold text-slate-900">{product.condition}</span>
                </div>
                <div className="grid grid-cols-2 p-2.5">
                  <span className="text-slate-500 font-medium">Stok Durumu</span>
                  <span className="font-bold text-emerald-600">
                    {product.inStock ? "Stokta" : "Temin Edilir"}
                  </span>
                </div>
                <div className="grid grid-cols-2 p-2.5 bg-slate-50/50">
                  <span className="text-slate-500 font-medium">Garanti</span>
                  <span className="font-bold text-slate-900">{product.warranty || "3 Ay"}</span>
                </div>
              </div>

              {/* Action Buttons Row 1: TEKLİF AL | WHATSAPP | HEMEN ARA matching Screenshot 3 */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <button
                  onClick={() => setQuoteModalOpen(true)}
                  className="py-3 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider transition-colors cursor-pointer text-center"
                >
                  TEKLİF AL
                </button>

                <a
                  href={generateWhatsAppLink(
                    whatsappNumber,
                    product.title,
                    product.oemNumber
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>WHATSAPP</span>
                </a>

                <a
                  href={`tel:${displayPhone.replace(/\s+/g, "")}`}
                  className="py-3 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>HEMEN ARA</span>
                </a>
              </div>

              {/* Action Buttons Row 2: PDF KATALOG | STOK SOR matching Screenshot 3 */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setQuoteModalOpen(true)}
                  className="py-2.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>PDF KATALOG</span>
                </button>

                <button
                  onClick={() => setQuoteModalOpen(true)}
                  className="py-2.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>STOK SOR</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Detailed Tabs matching Screenshot 3 */}
          <div className="mt-10 pt-8 border-t border-slate-200">
            {/* Tab Headers */}
            <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-bold text-slate-600">
              {[
                { id: "genel", label: "GENEL BİLGİ" },
                { id: "oem", label: "OEM KODLARI" },
                { id: "uyumlu", label: "UYUMLU ARAÇLAR" },
                { id: "teknik", label: "TEKNİK ÖZELLİKLER" },
                { id: "montaj", label: "MONTAJ NOTLARI" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-5 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600 font-black bg-blue-50/50"
                      : "hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: GENEL BİLGİ matching Screenshot 3 */}
            {activeTab === "genel" && (
              <div className="py-6 space-y-6 text-xs text-slate-700">
                <p className="leading-relaxed text-sm">
                  Bosch {product.oemNumber} Motor Kontrol Ünitesi, {product.brand} {product.model} araçlar için üretilmiş orijinal ECU modülüdür. Tüm fonksiyonları test edilmiştir ve sorunsuz çalışmaktadır.
                </p>

                {/* 4 Feature Badges matching Screenshot 3 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                    <span className="font-bold text-slate-800">Orijinal Bosch Ürünü</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                    <span className="font-bold text-slate-800">Test Edilmiş</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                    <span className="font-bold text-slate-800">{product.warranty || "3 Ay Garanti"}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                    <span className="font-bold text-slate-800">Tak & Çalıştır</span>
                  </div>
                </div>

                {/* UYUMLU ARAÇLAR Table inside Genel Bilgi matching Screenshot 3 */}
                <div className="space-y-3 pt-4">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-900">
                    UYUMLU ARAÇLAR
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="p-3">MARKA</th>
                          <th className="p-3">MODEL</th>
                          <th className="p-3">MOTOR</th>
                          <th className="p-3">YIL ARALIĞI</th>
                          <th className="p-3 font-mono">OEM NO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        <tr>
                          <td className="p-3 font-bold text-slate-900">Volkswagen</td>
                          <td className="p-3 text-slate-700">Passat</td>
                          <td className="p-3 text-slate-600">2.0 TDI</td>
                          <td className="p-3 text-slate-600">2010 - 2014</td>
                          <td className="p-3 font-mono font-bold text-slate-900">0281011234</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-900">Volkswagen</td>
                          <td className="p-3 text-slate-700">Passat CC</td>
                          <td className="p-3 text-slate-600">2.0 TDI</td>
                          <td className="p-3 text-slate-600">2009 - 2012</td>
                          <td className="p-3 font-mono font-bold text-slate-900">0281011234</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-900">Volkswagen</td>
                          <td className="p-3 text-slate-700">Tiguan</td>
                          <td className="p-3 text-slate-600">2.0 TDI</td>
                          <td className="p-3 text-slate-600">2010 - 2013</td>
                          <td className="p-3 font-mono font-bold text-slate-900">0281011234</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-900">Volkswagen</td>
                          <td className="p-3 text-slate-700">Sharan</td>
                          <td className="p-3 text-slate-600">2.0 TDI</td>
                          <td className="p-3 text-slate-600">2010 - 2014</td>
                          <td className="p-3 font-mono font-bold text-slate-900">0281011234</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ÜRÜN DETAYLARI 2-Col Table matching Screenshot 3 */}
                <div className="space-y-3 pt-4">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-900">
                    ÜRÜN DETAYLARI
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      <div className="grid grid-cols-2 p-2.5 bg-slate-50">
                        <span className="text-slate-500">OEM Numarası</span>
                        <span className="font-mono font-bold text-slate-900">{product.oemNumber}</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5">
                        <span className="text-slate-500">Bosch Numarası</span>
                        <span className="font-mono font-bold text-slate-900">{product.boschNumber || product.oemNumber}</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5 bg-slate-50">
                        <span className="text-slate-500">Siemens Numarası</span>
                        <span className="font-mono text-slate-900">-</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5">
                        <span className="text-slate-500">Ürün Tipi</span>
                        <span className="font-bold text-slate-900">Motor Kontrol Ünitesi</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5 bg-slate-50">
                        <span className="text-slate-500">Bağlantı Pin Sayısı</span>
                        <span className="font-bold text-slate-900">94 Pin</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5">
                        <span className="text-slate-500">Gerilim</span>
                        <span className="font-bold text-slate-900">12V</span>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      <div className="grid grid-cols-2 p-2.5 bg-slate-50">
                        <span className="text-slate-500">Yazılım Versiyonu</span>
                        <span className="font-mono font-bold text-slate-900">1037390232</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5">
                        <span className="text-slate-500">Donanım Versiyonu</span>
                        <span className="font-mono font-bold text-slate-900">1037396123</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5 bg-slate-50">
                        <span className="text-slate-500">Ağırlık</span>
                        <span className="font-bold text-slate-900">1.25 kg</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5">
                        <span className="text-slate-500">Boyutlar</span>
                        <span className="font-bold text-slate-900">18 x 16 x 4 cm</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5 bg-slate-50">
                        <span className="text-slate-500">Durum</span>
                        <span className="font-bold text-slate-900">{product.condition}</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5">
                        <span className="text-slate-500">Garanti</span>
                        <span className="font-bold text-slate-900">{product.warranty || "3 Ay"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ÜRÜN GÖRSELLERİ 4-Photo Row matching Screenshot 3 */}
                <div className="space-y-3 pt-4">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-900">
                    ÜRÜN GÖRSELLERİ
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {galleryImages.map((img, i) => (
                      <div key={i} className="aspect-4/3 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden p-2">
                        <img src={img} alt={`Görsel ${i + 1}`} className="w-full h-full object-cover rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs */}
            {activeTab === "oem" && (
              <div className="py-6 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900">Çapraz Referans Kodları</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono">
                    <span className="text-[10px] text-slate-400 block font-sans">Ana OEM</span>
                    <strong className="text-slate-900">{product.oemNumber}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono">
                    <span className="text-[10px] text-slate-400 block font-sans">Bosch Kodu</span>
                    <strong className="text-slate-900">{product.boschNumber || product.oemNumber}</strong>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "uyumlu" && (
              <div className="py-6 text-xs">
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">MARKA</th>
                        <th className="p-3">MODEL</th>
                        <th className="p-3">MOTOR</th>
                        <th className="p-3">YIL</th>
                        <th className="p-3 font-mono">OEM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      <tr>
                        <td className="p-3 font-bold">{product.brand}</td>
                        <td className="p-3">{product.model}</td>
                        <td className="p-3">{product.fuelType}</td>
                        <td className="p-3">{product.yearRange}</td>
                        <td className="p-3 font-mono font-bold text-blue-600">{product.oemNumber}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "teknik" && (
              <div className="py-6 text-xs space-y-2">
                <p>Pin Sayısı: 94 Pin | Gerilim: 12V | Durum: {product.condition}</p>
              </div>
            )}

            {activeTab === "montaj" && (
              <div className="py-6 text-xs space-y-2">
                <p className="font-semibold text-slate-900">Akü Bağlantısı:</p>
                <p>Montaj işlemine başlamadan önce mutlaka aracın akü eksi (-) kutup başını sökünüz.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <QuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        productId={product._id}
        productTitle={product.title}
        oemNumber={product.oemNumber}
      />

      <FloatingWhatsApp />
      <Footer />
    </div>
  );
}
