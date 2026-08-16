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
  ShieldCheck,
  Zap,
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
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const product = useQuery(api.products.getBySlug, { slug });
  const settings = useQuery(api.siteSettings.get);

  const whatsappNumber = settings?.whatsappNumber || "+905340653222";
  const displayPhone = settings?.phone || "+90 534 065 32 22";

  // Dynamic SEO Title and Meta Description
  if (typeof document !== "undefined" && product) {
    document.title = product.metaTitle || `${product.oemNumber} ${product.title} | TMS İthalat`;
  }

  if (product === undefined) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Cpu className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Ürün Yükleniyor...</p>
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

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : [
          "/images/catalog-ecu-banner.jpg",
          "/images/cat-ecu.jpg",
          "/images/hero-ecu-modules.jpg",
        ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* 1. Breadcrumbs */}
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

      {/* 2. Top Product Card Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Product Images Gallery */}
            <div className="lg:col-span-6 space-y-4">
              {/* Main Image Container */}
              <div className="relative aspect-4/3 w-full rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-4">
                <img
                  src={galleryImages[activeImageIndex] || galleryImages[0]}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Thumbnails + 360° Badge */}
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

            {/* Right: Specs & Actions */}
            <div className="lg:col-span-6 space-y-5">
              <div>
                <h1 className="font-mono text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  {product.oemNumber}
                </h1>
                <p className="text-base font-bold text-slate-800 mt-1">
                  {product.title}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {product.brand} • {product.model}
                </p>

                {/* Badges */}
                <div className="flex items-center gap-2 pt-2.5">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {product.condition}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {product.inStock ? "Stokta Var" : "Temin Edilir"}
                  </span>
                </div>
              </div>

              {/* Sade Özet Tablo (Temel ve Önemli Bilgiler) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs divide-y divide-slate-100">
                <div className="grid grid-cols-2 p-2.5 bg-slate-50/50">
                  <span className="text-slate-500 font-medium">OEM / Parça No</span>
                  <span className="font-mono font-bold text-slate-900">{product.oemNumber}</span>
                </div>
                <div className="grid grid-cols-2 p-2.5">
                  <span className="text-slate-500 font-medium">Araç Markası</span>
                  <span className="font-bold text-slate-900">{product.brand}</span>
                </div>
                {product.model && (
                  <div className="grid grid-cols-2 p-2.5">
                    <span className="text-slate-500 font-medium">Model / Uyumluluk</span>
                    <span className="font-bold text-slate-900">{product.model}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 p-2.5 bg-slate-50/50">
                  <span className="text-slate-500 font-medium">Kategori / Parça Türü</span>
                  <span className="font-semibold text-slate-900">{product.categoryName}</span>
                </div>
                <div className="grid grid-cols-2 p-2.5">
                  <span className="text-slate-500 font-medium">Durum</span>
                  <span className="font-bold text-slate-900">{product.condition}</span>
                </div>
                {product.shelfCode && (
                  <div className="grid grid-cols-2 p-2.5 bg-slate-50/50">
                    <span className="text-slate-500 font-medium">Depo Raf Kodu</span>
                    <span className="font-mono font-bold text-amber-900">{product.shelfCode}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 p-2.5">
                  <span className="text-slate-500 font-medium">Stok Durumu</span>
                  <span className="font-bold text-emerald-600">
                    {product.inStock ? "Stokta Var" : "Temin Edilir"}
                  </span>
                </div>
              </div>

              {/* Ürün Etiketleri (Tags) */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {product.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-[10px]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons Row 1: TEKLİF AL | WHATSAPP | HEMEN ARA */}
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

              {/* Action Buttons Row 2 */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setQuoteModalOpen(true)}
                  className="py-2.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>FİYAT TEKLİFİ İSTE</span>
                </button>

                <button
                  onClick={() => setQuoteModalOpen(true)}
                  className="py-2.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>STOK VE UYUMLULUK SOR</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Ürün Açıklaması ve Bilgiler */}
          <div className="mt-10 pt-8 border-t border-slate-200 space-y-6">
            <div className="space-y-3">
              <h3 className="font-extrabold text-base text-slate-900">
                Ürün Detayı ve Açıklaması
              </h3>
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line">
                {product.description}
              </div>
            </div>

            {/* 4 Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold text-xs text-slate-800">Orijinal Parça</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                <span className="font-bold text-xs text-slate-800">Test Edilmiş</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold text-xs text-slate-800">Garantili Ürün</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-bold text-xs text-slate-800">Hızlı Kargo</span>
              </div>
            </div>

            {/* Ürün Görselleri */}
            {galleryImages.length > 1 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                  ÜRÜN GÖRSELLERİ
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {galleryImages.map((img, i) => (
                    <div key={i} className="aspect-4/3 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden p-2">
                      <img src={img} alt={`Görsel ${i + 1}`} className="w-full h-full object-contain rounded-lg" />
                    </div>
                  ))}
                </div>
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
