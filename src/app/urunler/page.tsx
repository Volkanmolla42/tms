"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  MessageCircle,
  Cpu,
  Eye,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import ProductCard from "@/components/ProductCard";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { generateWhatsAppLink } from "@/lib/utils";

function ProductCatalogContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("kategori") || "motor-beyinleri-ecu";
  const brandParam = searchParams.get("marka") || "";
  const queryParam = searchParams.get("q") || "";

  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedBrand, setSelectedBrand] = useState<string>(brandParam);
  const [selectedCondition, setSelectedCondition] = useState<string>("Tümü");
  const [selectedFuel, setSelectedFuel] = useState<string>("Tümü");
  const [selectedStock, setSelectedStock] = useState<string>("Tümü");
  const [oemSearch, setOemSearch] = useState<string>(queryParam);
  const [activeSearch, setActiveSearch] = useState<string>(queryParam);

  // Exact 12 categories from Screenshot 2
  const categoryList = [
    { name: "Motor Beyinleri (ECU)", slug: "motor-beyinleri-ecu" },
    { name: "ABS / ESP Beyinleri", slug: "abs-esp-beyinleri" },
    { name: "Airbag Beyinleri", slug: "airbag-beyinleri" },
    { name: "BCM / BSI Beyinleri", slug: "bcm-bsi-sam-modulleri" },
    { name: "UCH / SAM Modülleri", slug: "uch-sam-modulleri" },
    { name: "Sigorta Kutuları", slug: "sigorta-kutulari" },
    { name: "Gösterge Panelleri", slug: "gosterge-panelleri" },
    { name: "Direksiyon Kumanda Modülleri", slug: "direksiyon-kumanda-modulleri" },
    { name: "Klima Kontrol Üniteleri", slug: "klima-kontrol-uniteleri" },
    { name: "Multimedya Üniteleri", slug: "multimedya-uniteleri" },
    { name: "Konfor Modülleri", slug: "konfor-modulleri" },
    { name: "Şanzıman Beyinleri", slug: "sanziman-beyinleri" },
  ];

  // Fetch categories from Convex
  const categories = useQuery(api.categories.list, {});

  // Fetch products from Convex
  const rawProducts = useQuery(api.products.list, {
    categorySlug: selectedCategory === "all" ? undefined : selectedCategory,
    brand: selectedBrand && selectedBrand !== "Tümü" ? selectedBrand : undefined,
    condition: selectedCondition && selectedCondition !== "Tümü" ? selectedCondition : undefined,
    inStockOnly: selectedStock === "Stokta" ? true : undefined,
    searchTerm: activeSearch || undefined,
  });

  const brands = useQuery(api.brands.list);
  const settings = useQuery(api.siteSettings.get);
  const whatsappNumber = settings?.whatsappNumber || "+905340653222";

  const activeCategoryTitle = useMemo(() => {
    const found = categoryList.find((c) => c.slug === selectedCategory);
    return found ? found.name : "MOTOR BEYİNLERİ (ECU)";
  }, [selectedCategory]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(oemSearch);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* 1. Breadcrumbs matching Screenshot 2 */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600">Ana Sayfa</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link href="/urunler" className="hover:text-blue-600">Ürünler</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-semibold">{activeCategoryTitle}</span>
        </div>
      </div>

      {/* 2. Category Header Banner matching Screenshot 2 */}
      <div className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
              {activeCategoryTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Farklı marka ve modellere uygun çıkma ve sıfır motor beyinleri. Binlerce stoklu ürün, uygun fiyat ve garantili hizmet.
            </p>
          </div>

          <div className="w-48 h-28 rounded-xl bg-slate-50 border border-slate-200 p-2 flex items-center justify-center shrink-0">
            <img
              src="/images/catalog-ecu-banner.jpg"
              alt="ECU"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* 3. Top Filter Form Bar matching Screenshot 2 */}
      <div className="bg-slate-100 border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                OEM / BOSCH NO
              </label>
              <input
                type="text"
                placeholder="OEM veya Bosch No"
                value={oemSearch}
                onChange={(e) => setOemSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                MARKA
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Tümü</option>
                {brands?.map((b) => (
                  <option key={b._id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                ARAÇ MODELİ
              </label>
              <select className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Tümü</option>
                <option value="Passat">Passat</option>
                <option value="Golf">Golf</option>
                <option value="Focus">Focus</option>
                <option value="Megane">Megane</option>
                <option value="A4">A4</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                YIL
              </label>
              <select className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Tümü</option>
                <option value="2020-2024">2020 - 2024</option>
                <option value="2015-2019">2015 - 2019</option>
                <option value="2010-2014">2010 - 2014</option>
                <option value="2005-2009">2005 - 2009</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                FİLTRELE
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 4. Main Body Layout (Sidebar + 3-Col Grid) matching Screenshot 2 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar */}
          <aside className="lg:col-span-3 space-y-6">
            {/* KATEGORİLER */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 mb-3 pb-2 border-b border-slate-100">
                KATEGORİLER
              </h3>
              <ul className="space-y-1 text-xs">
                {(categories && categories.length > 0 ? categories : categoryList).map((cat: any) => {
                  const isActive = selectedCategory === cat.slug;
                  return (
                    <li key={cat.slug}>
                      <button
                        onClick={() => setSelectedCategory(cat.slug)}
                        className={`w-full text-left py-1.5 px-2 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                          isActive
                            ? "text-blue-600 font-bold bg-blue-50/80"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <span>{cat.name}</span>
                        {cat.itemCount && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({cat.itemCount})
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* FİLTRELER */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4 text-xs">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
                FİLTRELER
              </h3>

              {/* DURUM Checkbox */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 uppercase text-[10px]">
                  DURUM
                </label>
                <div className="space-y-1 text-slate-600">
                  {["Tümü", "Sıfır", "Çıkma"].map((c) => (
                    <label key={c} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="condition"
                        checked={selectedCondition === c}
                        onChange={() => setSelectedCondition(c)}
                        className="text-blue-600"
                      />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ARAÇ MARKASI */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px]">
                  ARAÇ MARKASI
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                >
                  <option value="">Tümü</option>
                  {brands?.map((b) => (
                    <option key={b._id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* YAKIT TİPİ */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px]">
                  YAKIT TİPİ
                </label>
                <select
                  value={selectedFuel}
                  onChange={(e) => setSelectedFuel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                >
                  <option value="Tümü">Tümü</option>
                  <option value="Dizel">Dizel</option>
                  <option value="Benzin">Benzin</option>
                  <option value="Hibrit">Hibrit</option>
                </select>
              </div>

              {/* STOK DURUMU */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px]">
                  STOK DURUMU
                </label>
                <select
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                >
                  <option value="Tümü">Tümü</option>
                  <option value="Stokta">Sadece Stoktakiler</option>
                </select>
              </div>
            </div>

            {/* OEM NO İLE BULAMADINIZ MI? Card matching Screenshot 2 */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-900 to-slate-900 text-white p-5 space-y-3 shadow-md">
              <h4 className="font-black text-xs uppercase tracking-wider text-white">
                OEM NO İLE BULAMADINIZ MI?
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Aradığınız ürünü bulamadıysanız WhatsApp üzerinden bize sorabilirsiniz.
              </p>
              <a
                href={generateWhatsAppLink(whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="block pt-1"
              >
                <button className="w-full py-2 bg-transparent border border-white/40 hover:bg-white hover:text-slate-900 text-white text-xs font-extrabold rounded-lg transition-colors cursor-pointer">
                  BİZE ULAŞIN
                </button>
              </a>
            </div>
          </aside>

          {/* Right Product Grid (3 Columns) matching Screenshot 2 */}
          <main className="lg:col-span-9 space-y-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs">
              <span className="font-medium text-slate-600">
                Toplam <strong className="text-slate-900">{rawProducts ? rawProducts.length : 0}</strong> ürün bulundu
              </span>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">SIRALAMA:</span>
                <select className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-semibold focus:outline-none">
                  <option>Güncelleme Tarihi ▾</option>
                  <option>Ürün Adı (A-Z)</option>
                  <option>Ürün Adı (Z-A)</option>
                </select>
              </div>
            </div>

            {/* 3-Col Product Grid matching Screenshot 2 */}
            {rawProducts && rawProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rawProducts.map((p) => (
                  <ProductCard key={p._id} product={p as any} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
                Seçilen kriterlere uygun ürün bulunamadı.
              </div>
            )}

            {/* Pagination matching Screenshot 2 */}
            <div className="flex items-center justify-center gap-1.5 pt-6 text-xs font-bold">
              <button className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 flex items-center justify-center">
                &lt;
              </button>
              <button className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                1
              </button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 flex items-center justify-center">
                2
              </button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 flex items-center justify-center">
                3
              </button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 flex items-center justify-center">
                4
              </button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 flex items-center justify-center">
                5
              </button>
              <span className="px-1 text-slate-400">...</span>
              <button className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 flex items-center justify-center">
                18
              </button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 flex items-center justify-center">
                &gt;
              </button>
            </div>
          </main>
        </div>
      </div>

      <FloatingWhatsApp />
      <Footer />
    </div>
  );
}

export default function ProductCatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <ProductCatalogContent />
    </Suspense>
  );
}
