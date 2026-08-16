"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Headphones,
  Truck,
  ArrowRight,
  Cpu,
  Search,
  MessageCircle,
  Award,
  Wrench,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { generateWhatsAppLink } from "@/lib/utils";

export default function HomePage() {
  const [searchInput, setSearchInput] = useState("");

  const categories = useQuery(api.categories.list, {});
  const settings = useQuery(api.siteSettings.get);
  const seedAll = useMutation(api.seed.seedAll);

  useEffect(() => {
    if (categories && categories.length === 0) {
      seedAll().catch(console.error);
    }
  }, [categories, seedAll]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.location.href = `/urunler?q=${encodeURIComponent(searchInput.trim())}`;
    }
  };

  const popularSearches = [
    "0281011234",
    "0281002411",
    "5WK96812",
    "04L907309B",
    "04E907309C",
  ];

  // 12 Exact Categories from Screenshot 1 with custom generated studio photos
  const defaultCategories = [
    { title: "MOTOR BEYİNLERİ (ECU)", slug: "motor-beyinleri-ecu", img: "/images/cat-ecu.jpg" },
    { title: "ABS / ESP BEYİNLERİ", slug: "abs-esp-beyinleri", img: "/images/cat-abs.jpg" },
    { title: "AİRBAG BEYİNLERİ", slug: "airbag-beyinleri", img: "/images/cat-airbag.jpg" },
    { title: "BCM / BSI BEYİNLERİ", slug: "bcm-bsi-sam-modulleri", img: "/images/cat-bcm.jpg" },
    { title: "UCH / SAM MODÜLLERİ", slug: "uch-sam-modulleri", img: "/images/cat-uch.jpg" },
    { title: "SİGORTA KUTULARI", slug: "sigorta-kutulari", img: "/images/cat-fusebox.jpg" },
    { title: "GÖSTERGE PANELLERİ", slug: "gosterge-panelleri", img: "/images/cat-cluster.jpg" },
    { title: "DİREKSİYON KUMANDA MODÜLLERİ", slug: "direksiyon-kumanda-modulleri", img: "/images/cat-steering.jpg" },
    { title: "KLİMA KONTROL ÜNİTELERİ", slug: "klima-kontrol-uniteleri", img: "/images/cat-climate.jpg" },
    { title: "MULTİMEDYA ÜNİTELERİ", slug: "multimedya-uniteleri", img: "/images/cat-multimedia.jpg" },
    { title: "KONFOR MODÜLLERİ", slug: "konfor-modulleri", img: "/images/cat-comfort.jpg" },
    { title: "ŞANZIMAN BEYİNLERİ", slug: "sanziman-beyinleri", img: "/images/cat-transmission.jpg" },
  ];

  // Brand Names matching Screenshot 1
  const brandNames = [
    "Mercedes-Benz",
    "BMW",
    "Audi",
    "Volkswagen",
    "Ford",
    "Renault",
    "Peugeot",
    "Citroën",
    "Fiat",
    "Opel",
    "Volvo",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* 1. HERO SECTION matching Screenshot 1 */}
      <section className="relative w-full hero-circuit-bg text-white py-16 sm:py-20 lg:py-24 overflow-hidden border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                Türkiye&apos;nin<br />
                Oto Elektronik<br />
                Parça Merkezi
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-lg leading-relaxed">
                ECU, ABS, Airbag, BCM, BSI, UCH ve binlerce orijinal elektronik modül.
              </p>

              {/* Action Buttons matching Screenshot 1 */}
              <div className="flex items-center justify-center lg:justify-start gap-4 pt-2">
                <Link href="/urunler">
                  <button className="px-7 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm tracking-wider shadow-lg shadow-blue-600/30 transition-all cursor-pointer">
                    ÜRÜNLERİ İNCELE
                  </button>
                </Link>

                <Link href="/urunler">
                  <button className="px-7 py-3 rounded-lg border border-slate-600 hover:border-white bg-transparent text-white font-bold text-sm tracking-wider hover:bg-white/10 transition-all cursor-pointer">
                    OEM NO İLE ARA
                  </button>
                </Link>
              </div>
            </div>

            {/* Right: Floating 3D ECU Hardware Presentation matching Screenshot 1 */}
            <div className="lg:col-span-6 relative flex justify-center">
              <div className="relative w-full max-w-lg aspect-square sm:aspect-4/3 flex items-center justify-center">
                <img
                  src="/images/hero-ecu-modules.jpg"
                  alt="TMS Oto Elektronik Modülleri"
                  className="w-full h-full object-contain rounded-2xl filter drop-shadow-[0_20px_40px_rgba(0,102,255,0.4)]"
                />
              </div>
            </div>
          </div>

          {/* 2. OEM NO İLE HIZLI ARAMA Dark Container matching Screenshot 1 */}
          <div className="mt-12 max-w-4xl mx-auto search-box-dark rounded-2xl p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-12 bg-slate-700" />
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-300">
                OEM NO İLE HIZLI ARAMA
              </h3>
              <span className="h-px w-12 bg-slate-700" />
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="OEM, BOSCH, SIEMENS, PARÇA NO, ARAÇ MODELİ, VIN..."
                className="flex-1 bg-white text-slate-900 placeholder:text-slate-400 font-mono text-sm px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-semibold"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-lg transition-colors cursor-pointer shrink-0"
              >
                ARA
              </button>
            </form>

            {/* Popular Searches */}
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-slate-400">
              <span className="font-medium">Popüler Aramalar:</span>
              {popularSearches.map((tag) => (
                <Link
                  key={tag}
                  href={`/urunler?q=${tag}`}
                  className="font-mono text-slate-300 hover:text-blue-400 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. FOUR VALUE PROPOSITIONS matching Screenshot 1 */}
      <section className="w-full bg-white border-b border-slate-200 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 uppercase">ORİJİNAL ÜRÜN</h4>
              <p className="text-[11px] text-slate-500">Orijinal ve garantili ürünler</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 uppercase">TEST EDİLMİŞ</h4>
              <p className="text-[11px] text-slate-500">Tüm üniteler test edilerek gönderilir</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 uppercase">UZMAN DESTEK</h4>
              <p className="text-[11px] text-slate-500">Teknik destek ve danışmanlık</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 uppercase">HIZLI TESLİMAT</h4>
              <p className="text-[11px] text-slate-500">Türkiye&apos;nin her yerine hızlı kargo</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRODUCT CATEGORIES (12 Items matching Screenshot 1) */}
      <section className="w-full py-14 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <span className="h-px w-10 bg-slate-300" />
              <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-wider">
                ÜRÜN KATEGORİLERİ
              </h2>
              <span className="h-px w-10 bg-slate-300" />
            </div>
          </div>

          {/* 3 rows of 4 columns matching Screenshot 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {(categories && categories.length > 0 ? categories : defaultCategories).map((cat: any, i: number) => (
              <Link
                key={cat.slug || i}
                href={`/urunler?kategori=${cat.slug}`}
                className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-lg transition-all text-center"
              >
                <div className="w-24 h-24 rounded-xl bg-slate-50 flex items-center justify-center p-2 mb-3 group-hover:scale-105 transition-transform">
                  <img
                    src={cat.image || cat.img}
                    alt={cat.name || cat.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                  {cat.name || cat.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. STATS BAR matching Screenshot 1 */}
      <section className="w-full py-10 px-4 sm:px-6 lg:px-8 bg-[#091424] text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
          <div className="pt-2 md:pt-0">
            <span className="text-3xl sm:text-4xl font-black text-white block">
              15.000+
            </span>
            <span className="text-[11px] uppercase font-bold text-slate-400 mt-1 block tracking-wider">
              STOKLU ÜRÜN
            </span>
          </div>

          <div className="pt-2 md:pt-0">
            <span className="text-3xl sm:text-4xl font-black text-white block">
              45+
            </span>
            <span className="text-[11px] uppercase font-bold text-slate-400 mt-1 block tracking-wider">
              ARAÇ MARKASI
            </span>
          </div>

          <div className="pt-2 md:pt-0">
            <span className="text-3xl sm:text-4xl font-black text-white block">
              1000+
            </span>
            <span className="text-[11px] uppercase font-bold text-slate-400 mt-1 block tracking-wider">
              ECU MODELİ
            </span>
          </div>

          <div className="pt-2 md:pt-0">
            <span className="text-3xl sm:text-4xl font-black text-white block">
              20+
            </span>
            <span className="text-[11px] uppercase font-bold text-slate-400 mt-1 block tracking-wider">
              YILLIK TECRÜBE
            </span>
          </div>
        </div>
      </section>

      {/* 6. SUPPORTED BRANDS STRIP matching Screenshot 1 */}
      <section className="w-full py-10 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-slate-300" />
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest">
              KULLANDIĞIMIZ ARAÇ MARKALARI
            </h3>
            <span className="h-px w-10 bg-slate-300" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {brandNames.map((name) => (
              <Link
                key={name}
                href={`/urunler?marka=${encodeURIComponent(name)}`}
                className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-all shadow-2xs cursor-pointer"
              >
                {name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FloatingWhatsApp />
      <Footer />
    </div>
  );
}
