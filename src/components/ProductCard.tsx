"use client";

import Link from "next/link";
import { Eye, MessageCircle, Cpu } from "lucide-react";
import { generateWhatsAppLink } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface ProductCardProps {
  product: {
    _id: string;
    title: string;
    slug: string;
    oemNumber: string;
    boschNumber?: string;
    categorySlug: string;
    categoryName: string;
    brand: string;
    model: string;
    yearRange: string;
    fuelType: string;
    condition: string;
    warranty?: string;
    tested: boolean;
    inStock: boolean;
    images: string[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const settings = useQuery(api.siteSettings.get);
  const whatsappNumber = settings?.whatsappNumber || "+905340653222";

  // Formatted brand/type subtitle (e.g. "Bosch ECU" or "Mercedes ECU")
  const brandTypeLabel = product.boschNumber
    ? "Bosch ECU"
    : product.title.includes("Siemens")
    ? "Siemens ECU"
    : `${product.brand} ECU`;

  return (
    <div className="product-card-clean rounded-xl p-4 flex flex-col justify-between group bg-white">
      <div>
        {/* Hardware Photo on Clean Background */}
        <Link href={`/urunler/${product.slug}`} className="block">
          <div className="relative aspect-4/3 w-full rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-3 mb-3.5">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <Cpu className="w-16 h-16 text-slate-300" />
            )}
          </div>
        </Link>

        {/* Product Information matching Screenshot 2 */}
        <div className="space-y-1">
          {/* Large Bold OEM Code */}
          <Link href={`/urunler/${product.slug}`} className="block">
            <span className="font-mono text-sm sm:text-base font-black text-slate-950 group-hover:text-blue-600 transition-colors tracking-tight">
              {product.oemNumber}
            </span>
          </Link>

          {/* Subtitle (e.g. Bosch ECU) */}
          <p className="text-xs font-semibold text-slate-600">
            {brandTypeLabel}
          </p>

          {/* Vehicle Model & Engine */}
          <p className="text-xs text-slate-500 font-medium">
            {product.brand} {product.model}
          </p>

          {/* Year Range */}
          <p className="text-xs text-slate-400 font-medium">
            {product.yearRange}
          </p>

          {/* Pill Badges: Çıkma / Test Edildi */}
          <div className="flex items-center gap-1.5 pt-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              {product.condition.includes("Çıkma") ? "Çıkma" : product.condition}
            </span>
            {product.tested && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Test Edildi
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons: DETAY button + WhatsApp quick button */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
        <Link href={`/urunler/${product.slug}`} className="flex-1">
          <button className="w-full py-1.5 px-3 rounded-lg border border-slate-300 hover:border-blue-600 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
            <Eye className="w-3.5 h-3.5" />
            <span>DETAY</span>
          </button>
        </Link>

        <a
          href={generateWhatsAppLink(
            whatsappNumber,
            product.title,
            product.oemNumber
          )}
          target="_blank"
          rel="noopener noreferrer"
          title="WhatsApp Sipariş & Fiyat"
          className="shrink-0"
        >
          <button className="h-8 w-8 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer">
            <MessageCircle className="w-4 h-4 fill-white" />
          </button>
        </a>
      </div>
    </div>
  );
}
