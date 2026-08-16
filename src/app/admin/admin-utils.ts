// Turkish-aware URL slug generator
export function slugify(text: string): string {
  const trMap: Record<string, string> = {
    ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
    ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
  };
  return text
    .split("")
    .map((c) => trMap[c] || c)
    .join("")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Local codebase brand SVGs map
export const LOCAL_BRAND_LOGOS: Record<string, string> = {
  renault: "/images/brands/renault.svg",
  volkswagen: "/images/brands/volkswagen.svg",
  vw: "/images/brands/volkswagen.svg",
  "mercedes-benz": "/images/brands/mercedes-benz.svg",
  mercedes: "/images/brands/mercedes-benz.svg",
  bmw: "/images/brands/bmw.svg",
  audi: "/images/brands/audi.svg",
  ford: "/images/brands/ford.svg",
  peugeot: "/images/brands/peugeot.svg",
  citroen: "/images/brands/citroen.svg",
  "citroën": "/images/brands/citroen.svg",
  fiat: "/images/brands/fiat.svg",
  opel: "/images/brands/opel.svg",
  seat: "/images/brands/seat.svg",
  skoda: "/images/brands/skoda.svg",
  "škoda": "/images/brands/skoda.svg",
  toyota: "/images/brands/toyota.svg",
  hyundai: "/images/brands/hyundai.svg",
  honda: "/images/brands/honda.svg",
  nissan: "/images/brands/nissan.svg",
  volvo: "/images/brands/volvo.svg",
  kia: "/images/brands/kia.svg",
  dacia: "/images/brands/dacia.svg",
  "alfa-romeo": "/images/brands/alfa-romeo.svg",
  alfaromeo: "/images/brands/alfa-romeo.svg",
  porsche: "/images/brands/porsche.svg",
  "land-rover": "/images/brands/land-rover.svg",
  landrover: "/images/brands/land-rover.svg",
  jaguar: "/images/brands/jaguar.svg",
  mitsubishi: "/images/brands/mitsubishi.svg",
  chevrolet: "/images/brands/chevrolet.svg",
  chevy: "/images/brands/chevrolet.svg",
  suzuki: "/images/brands/suzuki.svg",
  mini: "/images/brands/mini.svg",
  mazda: "/images/brands/mazda.svg",
  jeep: "/images/brands/jeep.svg",
  iveco: "/images/brands/iveco.svg",
  subaru: "/images/brands/subaru.svg",
};

// Local codebase category images map
export const LOCAL_CATEGORY_IMAGES: Record<string, string> = {
  "motor-beyinleri-ecu": "/images/cat-ecu.jpg",
  "motor-beyni": "/images/cat-ecu.jpg",
  "motor-beyinleri": "/images/cat-ecu.jpg",
  ecu: "/images/cat-ecu.jpg",
  "abs-esp-beyinleri": "/images/cat-abs.jpg",
  "abs-beyni": "/images/cat-abs.jpg",
  abs: "/images/cat-abs.jpg",
  "airbag-beyinleri": "/images/cat-airbag.jpg",
  "airbag-beyni": "/images/cat-airbag.jpg",
  airbag: "/images/cat-airbag.jpg",
  "bcm-bsi-sam-modulleri": "/images/cat-bcm.jpg",
  "bcm-bsi-beyinleri": "/images/cat-bcm.jpg",
  bcm: "/images/cat-bcm.jpg",
  bsi: "/images/cat-bcm.jpg",
  "uch-sam-modulleri": "/images/cat-uch.jpg",
  uch: "/images/cat-uch.jpg",
  sam: "/images/cat-uch.jpg",
  "sigorta-kutulari": "/images/cat-fusebox.jpg",
  "sigorta-kutusu": "/images/cat-fusebox.jpg",
  fusebox: "/images/cat-fusebox.jpg",
  "gosterge-panelleri": "/images/cat-cluster.jpg",
  "gosterge-paneli": "/images/cat-cluster.jpg",
  kadran: "/images/cat-cluster.jpg",
  cluster: "/images/cat-cluster.jpg",
  "direksiyon-kumanda-modulleri": "/images/cat-steering.jpg",
  "direksiyon-kutusu": "/images/cat-steering.jpg",
  steering: "/images/cat-steering.jpg",
  "klima-kontrol-uniteleri": "/images/cat-climate.jpg",
  "klima-paneli": "/images/cat-climate.jpg",
  climate: "/images/cat-climate.jpg",
  "multimedya-uniteleri": "/images/cat-multimedia.jpg",
  multimedya: "/images/cat-multimedia.jpg",
  navigasyon: "/images/cat-multimedia.jpg",
  ekran: "/images/cat-multimedia.jpg",
  "konfor-modulleri": "/images/cat-comfort.jpg",
  "konfor-beyni": "/images/cat-comfort.jpg",
  comfort: "/images/cat-comfort.jpg",
  "sanziman-beyinleri": "/images/cat-transmission.jpg",
  "sanziman-beyni": "/images/cat-transmission.jpg",
  tcu: "/images/cat-transmission.jpg",
  transmission: "/images/cat-transmission.jpg",
};

// Subtle audio chime for new incoming chat message
export function playAdminNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Ignore restricted audio
  }
}
