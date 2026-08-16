import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price?: number): string {
  if (!price || price === 0) return "Fiyat Sorunuz";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}

export function generateWhatsAppLink(
  phoneNumber: string,
  productTitle?: string,
  oemNumber?: string,
  customMessage?: string
): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  let message = "";
  if (customMessage) {
    message = customMessage;
  } else if (productTitle && oemNumber) {
    message = `Merhaba TMS İthalat, web sitenizden ${productTitle} (OEM No: ${oemNumber}) ürünü hakkında bilgi ve fiyat almak istiyorum. Stok durumu nedir?`;
  } else if (productTitle) {
    message = `Merhaba TMS İthalat, web sitenizden ${productTitle} hakkında bilgi almak istiyorum.`;
  } else {
    message = `Merhaba TMS İthalat, oto elektronik parça talebinde bulunmak istiyorum.`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
