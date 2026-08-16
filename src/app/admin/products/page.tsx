"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Cpu,
  ImageIcon,
  Upload,
  X,
  Check,
  Loader2,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { slugify } from "../admin-utils";

export default function AdminProductsPage() {
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");

  // Product Modals & Form State
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [oemNumber, setOemNumber] = useState("");
  const [shelfCode, setShelfCode] = useState("");
  const [brand, setBrand] = useState("Renault");
  const [model, setModel] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [condition, setCondition] = useState("Orijinal Çıkma");
  const [inStock, setInStock] = useState(true);
  const [description, setDescription] = useState("");
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploadedStorageIds, setUploadedStorageIds] = useState<Id<"_storage">[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // AI Auto-Fill State
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuccess, setAiSuccess] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const products = useQuery(api.products.list, {
    searchTerm: searchProduct || undefined,
    categorySlug: selectedCategoryFilter || undefined,
    brand: selectedBrandFilter || undefined,
    limit: 100,
  });
  const categories = useQuery(api.categories.list, { onlyActive: false });
  const brands = useQuery(api.brands.list);

  // Mutations & Actions
  const generateProductDetailsAction = useAction(api.ai.generateProductDetails);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const toggleStock = useMutation(api.products.toggleStock);
  const deleteProduct = useMutation(api.products.deleteProduct);

  const resetProductForm = () => {
    setTitle("");
    setSlug("");
    setSlugManuallyEdited(false);
    setOemNumber("");
    setShelfCode("");
    setBrand(brands?.[0]?.name || "Renault");
    setModel("");
    setSelectedCategoryId(categories?.[0]?._id || "");
    setCondition("Orijinal Çıkma");
    setInStock(true);
    setDescription("");
    setPreviewImages([]);
    setUploadedStorageIds([]);
    setMetaTitle("");
    setMetaDescription("");
    setMetaKeywords("");
    setTagsInput("");
    setEditingProduct(null);
    setAiError("");
    setAiSuccess("");
  };

  const handleOpenAddProduct = () => {
    resetProductForm();
    setAddProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: any) => {
    setEditingProduct(p);
    setTitle(p.title);
    setSlug(p.slug);
    setSlugManuallyEdited(true);
    setOemNumber(p.oemNumber);
    setShelfCode(p.shelfCode || "");
    setBrand(p.brand);
    setModel(p.model || "");
    setSelectedCategoryId(p.categoryId);
    setCondition(p.condition);
    setInStock(p.inStock);
    setDescription(p.description);
    setPreviewImages(p.images || []);
    setUploadedStorageIds(p.imageStorageIds || []);
    setMetaTitle(p.metaTitle || "");
    setMetaDescription(p.metaDescription || "");
    setMetaKeywords(p.metaKeywords || "");
    setTagsInput(p.tags ? p.tags.join(", ") : "");
    setAiError("");
    setAiSuccess("");
    setAddProductModalOpen(true);
  };

  // AI Auto Fill Handler
  const handleAiAutoFill = async () => {
    if (!oemNumber.trim()) {
      setAiError("Lütfen önce OEM numarasını girin.");
      return;
    }

    setAiGenerating(true);
    setAiError("");
    setAiSuccess("");

    try {
      const result = await generateProductDetailsAction({
        oemNumber: oemNumber.trim(),
        additionalHint: brand ? `Marka: ${brand}` : undefined,
      });

      if (result) {
        if (result.title) {
          setTitle(result.title);
          if (!slugManuallyEdited) {
            setSlug(slugify(result.title));
          }
        }
        if (result.brand && !brand) setBrand(result.brand);
        if (result.model) setModel(result.model);
        if (result.description) setDescription(result.description);
        if (result.metaTitle) setMetaTitle(result.metaTitle);
        if (result.metaDescription) setMetaDescription(result.metaDescription);
        if (result.metaKeywords) setMetaKeywords(result.metaKeywords);
        if (result.tags && result.tags.length > 0) {
          setTagsInput(result.tags.join(", "));
        }

        if (result.categoryId) {
          setSelectedCategoryId(result.categoryId);
        } else if (result.categorySlug && categories) {
          const matched = categories.find((c) => c.slug === result.categorySlug);
          if (matched) {
            setSelectedCategoryId(matched._id);
          }
        }

        setAiSuccess("Ürün bilgileri OEM koduyla otomatik dolduruldu.");
        setTimeout(() => setAiSuccess(""), 4000);
      }
    } catch (err: any) {
      setAiError(err?.message || "Detaylar üretilirken hata oluştu.");
    } finally {
      setAiGenerating(false);
    }
  };

  // Upload image to Convex storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const postUrl = await generateUploadUrl();

        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        const { storageId } = await result.json();
        setUploadedStorageIds((prev) => [...prev, storageId]);

        const localUrl = URL.createObjectURL(file);
        setPreviewImages((prev) => [...prev, localUrl]);
      }
    } catch (err) {
      console.error("Görsel yüklenemedi:", err);
      alert("Görsel yüklenirken bir hata oluştu.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !oemNumber || !brand) {
      alert("Lütfen zorunlu alanları (Başlık, OEM No, Marka) doldurunuz.");
      return;
    }

    let targetCatId = selectedCategoryId;
    if (!targetCatId && categories && categories.length > 0) {
      targetCatId = categories[0]._id;
    }

    if (!targetCatId) {
      alert("Lütfen en az bir kategori seçiniz.");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const generatedSlug = slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-")
      : slugify(title);

    const images = previewImages.length > 0 ? previewImages : ["/images/catalog-ecu-banner.jpg"];

    const payload: any = {
      title,
      slug: generatedSlug,
      oemNumber,
      shelfCode: shelfCode.trim() ? shelfCode.trim().toUpperCase() : undefined,
      categoryId: targetCatId as Id<"categories">,
      brand,
      model: model.trim() || undefined,
      condition,
      inStock,
      description: description || `${title} orijinal oto elektronik parça.`,
      images,
      imageStorageIds: uploadedStorageIds.length > 0 ? uploadedStorageIds : undefined,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      metaKeywords: metaKeywords.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    if (editingProduct) {
      await updateProduct({
        id: editingProduct._id,
        ...payload,
      });
    } else {
      await createProduct(payload);
    }

    setAddProductModalOpen(false);
    resetProductForm();
  };

  const handleDeleteProduct = async (p: any) => {
    if (confirm(`'${p.oemNumber} - ${p.title}' ürününü silmek istediğinize emin misiniz?`)) {
      await deleteProduct({ id: p._id });
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Ürün Kataloğu</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              {products ? products.length : 0} kayıt
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Depo stok durumlarını, OEM kodlarını ve parça detaylarını yönetin.
          </p>
        </div>

        <Button
          onClick={handleOpenAddProduct}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 rounded-lg gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Ürün Ekle</span>
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="OEM No, parça adı veya raf kodu ara..."
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            className="pl-9 bg-white border-slate-200 text-slate-900 text-xs h-9 rounded-lg"
          />
        </div>

        <select
          value={selectedBrandFilter}
          onChange={(e) => setSelectedBrandFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 font-medium text-slate-700 text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="">Tüm Markalar</option>
          {brands?.map((b) => (
            <option key={b._id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 font-medium text-slate-700 text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="">Tüm Kategoriler</option>
          {categories?.map((c) => (
            <option key={c._id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Görsel</th>
                <th className="p-3.5">OEM No</th>
                <th className="p-3.5">Parça Başlığı</th>
                <th className="p-3.5">Marka &amp; Kategori</th>
                <th className="p-3.5">Raf</th>
                <th className="p-3.5">Durum</th>
                <th className="p-3.5">Stok</th>
                <th className="p-3.5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products && products.length > 0 ? (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5">
                      <div className="w-10 h-10 rounded-md bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-1">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.title} className="w-full h-full object-contain" />
                        ) : (
                          <Cpu className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {p.oemNumber}
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">{p.title}</div>
                      {p.model && <div className="text-[11px] text-slate-500 truncate">{p.model}</div>}
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800">{p.brand}</div>
                      <div className="text-[11px] text-slate-500">{p.categoryName}</div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                      {p.shelfCode || "-"}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {p.condition}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => toggleStock({ id: p._id, inStock: !p.inStock })}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          p.inStock
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        {p.inStock ? "Stokta" : "Tükendi"}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/urunler/${p.slug}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                          title="Görüntüle"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    Kayıtlı ürün bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Dialog open={addProductModalOpen} onOpenChange={setAddProductModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-slate-900 border-slate-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingProduct ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Parça OEM kodunu girip teknik detayları belirleyin.
            </DialogDescription>
          </DialogHeader>

          {aiSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{aiSuccess}</span>
            </div>
          )}

          {aiError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
              {aiError}
            </div>
          )}

          <form onSubmit={handleSaveProduct} className="space-y-4 pt-1 text-xs">
            {/* OEM Number Input with Auto Fill Button */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 block uppercase text-[11px]">
                OEM / BOSCH / PARÇA NUMARASI *
              </label>

              <div className="flex gap-2">
                <Input
                  required
                  placeholder="Örn: 0281011234 veya 237101702R"
                  value={oemNumber}
                  onChange={(e) => setOemNumber(e.target.value.toUpperCase())}
                  className="font-mono uppercase font-bold text-sm bg-white border-slate-300 text-slate-900"
                />
                <Button
                  type="button"
                  onClick={handleAiAutoFill}
                  disabled={aiGenerating || !oemNumber.trim()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shrink-0 rounded-md"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Dolduruluyor...</span>
                    </>
                  ) : (
                    <span>Otomatik Doldur</span>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Depo Raf Kodu</label>
                <Input
                  placeholder="RAF-A01"
                  value={shelfCode}
                  onChange={(e) => setShelfCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase bg-white border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Durum</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 font-medium text-slate-800 text-xs"
                >
                  <option value="Orijinal Çıkma">Orijinal Çıkma</option>
                  <option value="Sıfır - Orijinal">Sıfır - Orijinal</option>
                  <option value="Revizyonlu">Revizyonlu</option>
                  <option value="Sıfırlanmış - Virgin">Sıfırlanmış - Virgin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Ürün Başlığı *</label>
              <Input
                required
                placeholder="Örn: Renault Megane 2 Motor Beyni ECU Sagem S113717205D"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugManuallyEdited) {
                    setSlug(slugify(e.target.value));
                  }
                }}
                className="bg-white border-slate-200"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 block">URL Slug *</label>
                <span className="text-[10px] text-slate-400">Otomatik üretilir</span>
              </div>
              <Input
                required
                value={slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setSlug(e.target.value.toLowerCase());
                }}
                className="font-mono bg-slate-50 border-slate-200 text-xs text-slate-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Marka *</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 font-medium text-slate-800 text-xs"
                  required
                >
                  <option value="">Marka Seçiniz...</option>
                  {brands?.map((b) => (
                    <option key={b._id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Uyumlu Model</label>
                <Input
                  placeholder="Megane 2 / Scenic"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="bg-white border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kategori *</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 font-medium text-slate-800 text-xs"
                  required
                >
                  {categories?.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Images Upload */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ürün Fotoğrafları</span>
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium gap-1 cursor-pointer h-7"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3 text-slate-500" />
                      <span>Fotoğraf Seç</span>
                    </>
                  )}
                </Button>
              </div>

              {previewImages.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {previewImages.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-md border border-slate-200 overflow-hidden bg-white p-1">
                      <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImages((prev) => prev.filter((_, i) => i !== idx));
                          setUploadedStorageIds((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-0.5 right-0.5 bg-slate-800/80 text-white rounded-full p-0.5 hover:bg-red-600 cursor-pointer transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Fotoğraf yüklenmediğinde varsayılan kategori görseli atanır.
                </p>
              )}
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Açıklama</label>
              <Textarea
                rows={3}
                placeholder="Parça teknik durumu, test bilgisi ve montaj notları..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white border-slate-200 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Etiketler (Virgülle ayırın)</label>
                <Input
                  placeholder="bosch, megane, sagem, ecu"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="bg-white border-slate-200 text-xs"
                />
              </div>

              <div className="pt-4">
                <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300"
                  />
                  <span>Stokta Var (Satışa Açık)</span>
                </label>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddProductModalOpen(false)}
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                İptal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6">
                {editingProduct ? "Değişiklikleri Kaydet" : "Ürünü Kaydet"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
