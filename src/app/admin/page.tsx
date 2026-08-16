"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  Layers,
  MessageCircle,
  Settings,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  RotateCw,
  Search,
  ExternalLink,
  Phone,
  Eye,
  Home,
  Save,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { generateWhatsAppLink } from "@/lib/utils";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "inquiries" | "settings">("products");
  const [searchProduct, setSearchProduct] = useState("");
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Form State for Add / Edit Product
  const [title, setTitle] = useState("");
  const [oemNumber, setOemNumber] = useState("");
  const [boschNumber, setBoschNumber] = useState("");
  const [siemensNumber, setSiemensNumber] = useState("");
  const [categorySlug, setCategorySlug] = useState("motor-beyinleri-ecu");
  const [categoryName, setCategoryName] = useState("Motor Beyinleri (ECU)");
  const [brand, setBrand] = useState("Volkswagen");
  const [model, setModel] = useState("Passat");
  const [yearRange, setYearRange] = useState("2010 - 2014");
  const [fuelType, setFuelType] = useState("Dizel");
  const [condition, setCondition] = useState("Çıkma - Orijinal");
  const [warranty, setWarranty] = useState("3 Ay Garanti");
  const [inStock, setInStock] = useState(true);
  const [tested, setTested] = useState(true);
  const [plugAndPlay, setPlugAndPlay] = useState(true);
  const [pinCount, setPinCount] = useState("94 Pin");
  const [voltage, setVoltage] = useState("12V");
  const [weight, setWeight] = useState("1.25 kg");
  const [dimensions, setDimensions] = useState("18 x 16 x 4 cm");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Queries
  const products = useQuery(api.products.list, { searchTerm: searchProduct || undefined, limit: 100 });
  const categories = useQuery(api.categories.list);
  const inquiries = useQuery(api.inquiries.list, {});
  const siteSettings = useQuery(api.siteSettings.get);

  // Mutations
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const toggleStock = useMutation(api.products.toggleStock);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const updateInquiryStatus = useMutation(api.inquiries.updateStatus);
  const deleteInquiry = useMutation(api.inquiries.deleteInquiry);
  const updateSiteSettings = useMutation(api.siteSettings.update);
  const seedAll = useMutation(api.seed.seedAll);

  // Settings form states
  const [settingsWhatsapp, setSettingsWhatsapp] = useState("");
  const [settingsPhone, setSettingsPhone] = useState("");
  const [settingsEmail, setSettingsEmail] = useState("");
  const [settingsAddress, setSettingsAddress] = useState("");
  const [settingsAnnouncement, setSettingsAnnouncement] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  const resetProductForm = () => {
    setTitle("");
    setOemNumber("");
    setBoschNumber("");
    setSiemensNumber("");
    setBrand("Volkswagen");
    setModel("");
    setYearRange("2012 - 2016");
    setFuelType("Dizel");
    setCondition("Çıkma - Orijinal");
    setWarranty("3 Ay Garanti");
    setInStock(true);
    setTested(true);
    setPlugAndPlay(true);
    setPinCount("94 Pin");
    setDescription("");
    setImageUrl("");
    setEditingProduct(null);
  };

  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setTitle(p.title);
    setOemNumber(p.oemNumber);
    setBoschNumber(p.boschNumber || "");
    setSiemensNumber(p.siemensNumber || "");
    setCategorySlug(p.categorySlug);
    setCategoryName(p.categoryName);
    setBrand(p.brand);
    setModel(p.model);
    setYearRange(p.yearRange);
    setFuelType(p.fuelType);
    setCondition(p.condition);
    setWarranty(p.warranty || "3 Ay Garanti");
    setInStock(p.inStock);
    setTested(p.tested);
    setPlugAndPlay(p.plugAndPlay);
    setPinCount(p.pinCount || "94 Pin");
    setDescription(p.description);
    setImageUrl(p.images?.[0] || "");
    setAddProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = `${oemNumber.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${brand.toLowerCase()}-${model.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    const images = imageUrl
      ? [imageUrl]
      : ["https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=800"];

    if (editingProduct) {
      await updateProduct({
        id: editingProduct._id,
        title,
        slug,
        oemNumber,
        boschNumber: boschNumber || undefined,
        siemensNumber: siemensNumber || undefined,
        categorySlug,
        categoryName,
        brand,
        model,
        yearRange,
        fuelType,
        condition,
        warranty,
        tested,
        plugAndPlay,
        pinCount,
        voltage,
        weight,
        dimensions,
        inStock,
        priceText: "Fiyat Sorunuz",
        description: description || `${title} test edilmiş orijinal modül.`,
        images,
        compatibleVehicles: [
          { brand, model, engine: fuelType, yearRange, oemNumber },
        ],
        featured: true,
      });
    } else {
      await createProduct({
        title,
        slug,
        oemNumber,
        boschNumber: boschNumber || undefined,
        siemensNumber: siemensNumber || undefined,
        categorySlug,
        categoryName,
        brand,
        model,
        yearRange,
        fuelType,
        condition,
        warranty,
        tested,
        plugAndPlay,
        pinCount,
        voltage,
        weight,
        dimensions,
        inStock,
        priceText: "Fiyat Sorunuz",
        description: description || `${title} test edilmiş orijinal modül.`,
        images,
        compatibleVehicles: [
          { brand, model, engine: fuelType, yearRange, oemNumber },
        ],
        featured: true,
      });
    }

    setAddProductModalOpen(false);
    resetProductForm();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;

    await updateSiteSettings({
      siteName: siteSettings.siteName,
      slogan: siteSettings.slogan,
      whatsappNumber: settingsWhatsapp || siteSettings.whatsappNumber,
      whatsappDisplay: settingsWhatsapp || siteSettings.whatsappDisplay,
      phone: settingsPhone || siteSettings.phone,
      email: settingsEmail || siteSettings.email,
      address: settingsAddress || siteSettings.address,
      workingHours: siteSettings.workingHours,
      announcement: settingsAnnouncement || siteSettings.announcement,
      heroHeadline: siteSettings.heroHeadline,
      heroSubheadline: siteSettings.heroSubheadline,
      stats: siteSettings.stats,
    });

    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Admin Top Navigation */}
      <header className="bg-slate-900 text-white border-b border-slate-800 py-3.5 px-4 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-lg text-white">TMS İTHALAT</span>
              <span className="text-xs text-blue-400 font-semibold ml-2 px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800">
                Yönetim Paneli
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Örnek oto elektronik verileri sıfırlanıp yeniden yüklensin mi?")) {
                  seedAll();
                }
              }}
              className="bg-slate-800 text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 mr-1" />
              <span>Veritabanını Doldur (Seed)</span>
            </Button>

            <Link href="/" target="_blank">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs font-bold gap-1">
                <span>Siteyi Görüntüle</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Admin Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "products"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Ürün Yönetimi ({products ? products.length : 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("inquiries")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "inquiries"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Talepler & WhatsApp ({inquiries ? inquiries.length : 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "categories"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kategoriler ({categories ? categories.length : 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Site Ayarları</span>
          </button>
        </div>

        {/* TAB 1: PRODUCTS MANAGEMENT */}
        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="OEM no, ürün adı veya marka ile ara..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="pl-9 h-10 text-xs bg-slate-50"
                />
              </div>

              <Button
                onClick={() => {
                  resetProductForm();
                  setAddProductModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 h-10 rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Parça Ekle</span>
              </Button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Görsel</th>
                      <th className="p-3.5">OEM / Parça No</th>
                      <th className="p-3.5">Ürün Adı</th>
                      <th className="p-3.5">Kategori</th>
                      <th className="p-3.5">Marka & Model</th>
                      <th className="p-3.5">Durum</th>
                      <th className="p-3.5">Stok</th>
                      <th className="p-3.5 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products && products.length > 0 ? (
                      products.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                              {p.images?.[0] ? (
                                <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                              ) : (
                                <Cpu className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-blue-700">{p.oemNumber}</td>
                          <td className="p-3 font-bold text-slate-900 max-w-xs truncate">{p.title}</td>
                          <td className="p-3 text-slate-600 font-medium">{p.categoryName}</td>
                          <td className="p-3 text-slate-700 font-semibold">{p.brand} {p.model}</td>
                          <td className="p-3">
                            <Badge variant="secondary" className="text-[10px] py-0">
                              {p.condition}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => toggleStock({ id: p._id, inStock: !p.inStock })}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                                p.inStock ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {p.inStock ? "Stokta" : "Tükendi"}
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(p)}
                                className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600"
                                title="Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`${p.title} silinsin mi?`)) {
                                    deleteProduct({ id: p._id });
                                  }
                                }}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          Kayıtlı ürün bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INQUIRIES & WHATSAPP LEADS */}
        {activeTab === "inquiries" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Gelen Fiyat & WhatsApp Talepleri
                </h3>
                <span className="text-xs text-slate-500">
                  Toplam {inquiries?.length || 0} Talep
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {inquiries && inquiries.length > 0 ? (
                  inquiries.map((inq) => (
                    <div key={inq._id} className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{inq.name}</span>
                          <span className="text-xs font-semibold text-blue-600">{inq.phone}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {inq.type}
                          </Badge>
                        </div>
                        {inq.productTitle && (
                          <p className="text-xs font-semibold text-slate-700">
                            Talep Edilen Parça: {inq.productTitle} (OEM: {inq.oemNumber || "-"})
                          </p>
                        )}
                        {inq.vehicleInfo && (
                          <p className="text-xs text-slate-500 font-mono">
                            Araç: {inq.vehicleInfo}
                          </p>
                        )}
                        <p className="text-xs text-slate-600">{inq.message}</p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(inq.createdAt).toLocaleString("tr-TR")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={generateWhatsAppLink(
                            inq.phone,
                            inq.productTitle,
                            inq.oemNumber,
                            `Merhaba ${inq.name}, TMS İthalat olarak talebinizle ilgili ulaşıyoruz.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="whatsapp" size="sm" className="text-xs font-bold gap-1">
                            <MessageCircle className="w-3.5 h-3.5 fill-white" />
                            <span>WhatsApp İle Yanıtla</span>
                          </Button>
                        </a>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInquiry({ id: inq._id })}
                          className="text-red-500 hover:bg-red-50 h-8 px-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Henüz yeni talep bulunmuyor.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES MANAGEMENT */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories?.map((cat) => (
                <div key={cat._id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <Layers className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{cat.name}</h4>
                    <span className="text-[10px] text-slate-400">{cat.slug}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SITE SETTINGS */}
        {activeTab === "settings" && (
          <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">İletişim & WhatsApp Ayarları</h3>
              <p className="text-xs text-slate-500">
                Sitedeki WhatsApp sipariş butonu numaralarını ve iletişim bilgilerini güncelleyin.
              </p>
            </div>

            {settingsSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ayarlar başarıyla kaydedildi!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  WhatsApp Sipariş Numarası (Ülke kodu ile, boşluksuz)
                </label>
                <Input
                  defaultValue={siteSettings?.whatsappNumber || "+905340653222"}
                  onChange={(e) => setSettingsWhatsapp(e.target.value)}
                  placeholder="+905340653222"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Telefon Numarası (Görünen)
                </label>
                <Input
                  defaultValue={siteSettings?.phone || "+90 534 065 32 22"}
                  onChange={(e) => setSettingsPhone(e.target.value)}
                  placeholder="+90 534 065 32 22"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  E-Posta Adresi
                </label>
                <Input
                  defaultValue={siteSettings?.email || "info@tmsithalat.com"}
                  onChange={(e) => setSettingsEmail(e.target.value)}
                  placeholder="info@tmsithalat.com"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Depo & Mağaza Adresi
                </label>
                <Input
                  defaultValue={siteSettings?.address || "Fevzipaşa Mh. 10121 Sk. No: 2 Karatay / KONYA"}
                  onChange={(e) => setSettingsAddress(e.target.value)}
                  placeholder="Fevzipaşa Mh. 10121 Sk. No: 2 Karatay / KONYA"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Üst Duyuru Bandı Metni
                </label>
                <Input
                  defaultValue={siteSettings?.announcement || "Türkiye'nin her yerine aynı gün hızlı kargo imkanı!"}
                  onChange={(e) => setSettingsAnnouncement(e.target.value)}
                  placeholder="Duyuru metni..."
                />
              </div>

              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 font-bold h-11 px-6 rounded-xl">
                <Save className="w-4 h-4 mr-2" />
                <span>Ayarları Kaydet</span>
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Dialog open={addProductModalOpen} onOpenChange={setAddProductModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">
              {editingProduct ? "Parçayı Düzenle" : "Yeni Oto Elektronik Parçası Ekle"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              OEM kodları, araç uyumluluk bilgileri ve teknik detayları eksiksiz giriniz.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">OEM Numarası *</label>
                <Input
                  required
                  placeholder="Örn: 0281011234"
                  value={oemNumber}
                  onChange={(e) => setOemNumber(e.target.value.toUpperCase())}
                  className="font-mono uppercase font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Bosch / Siemens No</label>
                <Input
                  placeholder="Örn: 0281011234 veya SID807"
                  value={boschNumber}
                  onChange={(e) => setBoschNumber(e.target.value.toUpperCase())}
                  className="font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Ürün Başlığı *</label>
              <Input
                required
                placeholder="Örn: Bosch ECU VW Passat 2.0 TDI 2010 - 2014"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Kategori</label>
                <select
                  value={categorySlug}
                  onChange={(e) => {
                    setCategorySlug(e.target.value);
                    const matched = categories?.find((c) => c.slug === e.target.value);
                    if (matched) setCategoryName(matched.name);
                  }}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-800"
                >
                  {categories?.map((c) => (
                    <option key={c._id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Araç Markası</label>
                <Input
                  required
                  placeholder="Volkswagen, BMW..."
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Model & Yıl</label>
                <Input
                  required
                  placeholder="Passat (2010 - 2014)"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Yakıt Tipi</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-800"
                >
                  <option value="Dizel">Dizel</option>
                  <option value="Benzin">Benzin</option>
                  <option value="Hibrit">Hibrit</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Durum</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-800"
                >
                  <option value="Çıkma - Orijinal">Çıkma - Orijinal</option>
                  <option value="Sıfır - Orijinal">Sıfır - Orijinal</option>
                  <option value="Revizyonlu">Revizyonlu</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Garanti</label>
                <Input
                  placeholder="3 Ay Garanti"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Görsel URL Adresi</label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Açıklama</label>
              <Textarea
                placeholder="Ürün genel bilgisi, test raporu ve immobilizer durumu..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span>Stokta Var</span>
              </label>

              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tested}
                  onChange={(e) => setTested(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span>Test Edildi</span>
              </label>

              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={plugAndPlay}
                  onChange={(e) => setPlugAndPlay(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span>Tak & Çalıştır</span>
              </label>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddProductModalOpen(false)}
              >
                İptal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 font-bold px-6">
                {editingProduct ? "Güncelle" : "Kaydet"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
