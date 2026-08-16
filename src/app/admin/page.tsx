"use client";

import { useState, useRef, useEffect } from "react";
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
  RotateCw,
  Search,
  ExternalLink,
  Save,
  Cpu,
  FolderPlus,
  Globe,
  Tag,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  X,
  Sparkles,
  AlertCircle,
  Send,
  User,
  ShoppingBag,
  Check,
  CheckCheck,
  Phone,
  PowerOff,
  Headphones,
  Circle,
  Archive,
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
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { generateWhatsAppLink } from "@/lib/utils";

// Subtle audio chime for new incoming chat message
function playAdminNotificationSound() {
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

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"products" | "chats" | "categories" | "settings">("products");
  const [searchProduct, setSearchProduct] = useState("");

  // Product Modals & Form State
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
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

  // Live Chat State
  const [selectedChatId, setSelectedChatId] = useState<Id<"conversations"> | null>(null);
  const [chatSearch, setChatSearch] = useState("");
  const [chatStatusFilter, setChatStatusFilter] = useState<string>("active");
  const [adminMessageInput, setAdminMessageInput] = useState("");
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const prevAdminMsgCountRef = useRef<number>(0);

  // Category Modal & Form State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catPreviewImage, setCatPreviewImage] = useState<string>("");
  const [catStorageId, setCatStorageId] = useState<Id<"_storage"> | null>(null);
  const [catUploading, setCatUploading] = useState(false);
  const [catOrder, setCatOrder] = useState<number>(1);
  const [catIsActive, setCatIsActive] = useState<boolean>(true);
  const [catMetaTitle, setCatMetaTitle] = useState("");
  const [catMetaDescription, setCatMetaDescription] = useState("");
  const [catMetaKeywords, setCatMetaKeywords] = useState("");
  const [categoryError, setCategoryError] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const catFileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const products = useQuery(api.products.list, { searchTerm: searchProduct || undefined, limit: 100 });
  const categories = useQuery(api.categories.list, { onlyActive: false });
  const siteSettings = useQuery(api.siteSettings.get);

  // Live Chat Queries & Mutations
  const conversations = useQuery(api.chats.listConversations, {
    status: chatStatusFilter === "all" ? undefined : chatStatusFilter,
    searchTerm: chatSearch || undefined,
  });

  const activeChatMessages = useQuery(
    api.chats.getMessages,
    selectedChatId ? { conversationId: selectedChatId } : "skip"
  );

  const selectedConversation = conversations?.find((c) => c._id === selectedChatId);

  const generateProductDetailsAction = useAction(api.ai.generateProductDetails);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const toggleStock = useMutation(api.products.toggleStock);
  const deleteProduct = useMutation(api.products.deleteProduct);

  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const deleteCategory = useMutation(api.categories.deleteCategory);

  const updateSiteSettings = useMutation(api.siteSettings.update);

  // Chat Mutations
  const sendChatMessage = useMutation(api.chats.sendMessage);
  const markChatAsRead = useMutation(api.chats.markAsRead);
  const closeChatMutation = useMutation(api.chats.closeConversation);
  const deleteChatMutation = useMutation(api.chats.deleteConversation);

  // Calculate total unread chats for badge
  const totalUnreadAdminCount = conversations?.reduce((acc, c) => acc + (c.unreadCountAdmin || 0), 0) || 0;

  // Auto select first chat if none selected
  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedChatId) {
      setSelectedChatId(conversations[0]._id);
    }
  }, [conversations, selectedChatId]);

  // Mark chat as read when admin opens it
  useEffect(() => {
    if (selectedChatId && selectedConversation?.unreadCountAdmin) {
      markChatAsRead({ conversationId: selectedChatId, reader: "admin" });
    }
  }, [selectedChatId, selectedConversation?.unreadCountAdmin, markChatAsRead]);

  // Auto scroll chat messages to bottom & sound alert
  useEffect(() => {
    if (activeChatMessages && activeChatMessages.length > 0) {
      if (activeChatMessages.length > prevAdminMsgCountRef.current) {
        const last = activeChatMessages[activeChatMessages.length - 1];
        if (last.sender === "visitor") {
          playAdminNotificationSound();
        }
      }
      prevAdminMsgCountRef.current = activeChatMessages.length;
      chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChatMessages]);

  // Settings form states
  const [settingsWhatsapp, setSettingsWhatsapp] = useState("");
  const [settingsPhone, setSettingsPhone] = useState("");
  const [settingsEmail, setSettingsEmail] = useState("");
  const [settingsAddress, setSettingsAddress] = useState("");
  const [settingsAnnouncement, setSettingsAnnouncement] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  // AI AUTO-FILL HANDLER
  const handleAiAutoFill = async () => {
    if (!oemNumber.trim()) {
      alert("Lütfen önce Parça No / OEM Kodu giriniz.");
      return;
    }

    setAiGenerating(true);
    setAiError("");
    setAiSuccess("");

    try {
      const res = await generateProductDetailsAction({
        oemNumber: oemNumber.trim().toUpperCase(),
        additionalHint: brand ? `Marka: ${brand}` : undefined,
      });

      if (res && res.success) {
        setTitle(res.title);
        setBrand(res.brand);
        if (res.model) setModel(res.model);
        if (res.categoryId) setSelectedCategoryId(res.categoryId);
        setCondition(res.condition || "Orijinal Çıkma");
        setDescription(res.description);
        setMetaTitle(res.metaTitle);
        setMetaDescription(res.metaDescription);
        setMetaKeywords(res.metaKeywords);
        setTagsInput(res.tags ? res.tags.join(", ") : "");
        setSlug(res.slug);

        setAiSuccess(`✨ "${res.title}" bilgileri yapay zeka ile dolduruldu.`);
        setTimeout(() => setAiSuccess(""), 4000);
      }
    } catch (err: any) {
      console.error("AI Auto-fill error:", err);
      setAiError(err?.message || "Yapay zeka yanıt veremedi. Lütfen OPENROUTER_API_KEY kontrol ediniz.");
    } finally {
      setAiGenerating(false);
    }
  };

  // SEND ADMIN CHAT MESSAGE
  const handleAdminSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminMessageInput.trim() || !selectedChatId) return;

    const text = adminMessageInput.trim();
    setAdminMessageInput("");

    try {
      await sendChatMessage({
        conversationId: selectedChatId,
        sender: "admin",
        text,
      });
    } catch (err) {
      console.error("Send admin message error:", err);
    }
  };

  // FILE UPLOAD HANDLERS
  const handleProductFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);

    try {
      const newStorageIds = [...uploadedStorageIds];
      const newPreviews = [...previewImages];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        const { storageId } = await result.json();
        newStorageIds.push(storageId);
        newPreviews.push(URL.createObjectURL(file));
      }

      setUploadedStorageIds(newStorageIds);
      setPreviewImages(newPreviews);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Fotoğraf yüklenirken hata oluştu.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCategoryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setCatUploading(true);

    try {
      const file = files[0];
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      const { storageId } = await result.json();
      setCatStorageId(storageId);
      setCatPreviewImage(URL.createObjectURL(file));
    } catch (err) {
      console.error("Category upload error:", err);
      alert("Kategori görseli yüklenirken hata oluştu.");
    } finally {
      setCatUploading(false);
    }
  };

  // PRODUCT HANDLERS
  const resetProductForm = () => {
    setTitle("");
    setSlug("");
    setOemNumber("");
    setShelfCode("");
    setBrand("Renault");
    setModel("");
    if (categories && categories.length > 0) {
      setSelectedCategoryId(categories[0]._id);
    }
    setCondition("Orijinal Çıkma");
    setInStock(true);
    setDescription("");
    setPreviewImages([]);
    setUploadedStorageIds([]);
    setMetaTitle("");
    setMetaDescription("");
    setMetaKeywords("");
    setTagsInput("");
    setAiError("");
    setAiSuccess("");
    setEditingProduct(null);
  };

  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setTitle(p.title);
    setSlug(p.slug || "");
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

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId && categories && categories.length > 0) {
      setSelectedCategoryId(categories[0]._id);
    }

    const targetCatId = (selectedCategoryId || categories?.[0]?._id) as Id<"categories">;
    if (!targetCatId) {
      alert("Lütfen önce bir kategori seçiniz veya oluşturunuz.");
      return;
    }

    const generatedSlug = slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-")
      : `${brand.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${oemNumber.toLowerCase().replace(/[^a-z0-9]/g, "-")}-motor-beyni-ecu`;

    const images = previewImages.length > 0 ? previewImages : ["/images/cat-ecu.jpg"];
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      title,
      slug: generatedSlug,
      oemNumber,
      shelfCode: shelfCode.trim() ? shelfCode.trim().toUpperCase() : undefined,
      categoryId: targetCatId,
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

  // CATEGORY HANDLERS
  const resetCategoryForm = () => {
    setCatName("");
    setCatSlug("");
    setCatDescription("");
    setCatPreviewImage("");
    setCatStorageId(null);
    setCatOrder((categories?.length || 0) + 1);
    setCatIsActive(true);
    setCatMetaTitle("");
    setCatMetaDescription("");
    setCatMetaKeywords("");
    setEditingCategory(null);
    setCategoryError("");
  };

  const handleOpenEditCategory = (c: any) => {
    setEditingCategory(c);
    setCatName(c.name);
    setCatSlug(c.slug);
    setCatDescription(c.description || "");
    setCatPreviewImage(c.image || "");
    setCatStorageId(c.imageStorageId || null);
    setCatOrder(c.order ?? 1);
    setCatIsActive(c.isActive ?? true);
    setCatMetaTitle(c.metaTitle || "");
    setCatMetaDescription(c.metaDescription || "");
    setCatMetaKeywords(c.metaKeywords || "");
    setCategoryError("");
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError("");

    const generatedSlug = catSlug.trim()
      ? catSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-")
      : catName.trim().toLowerCase().replace(/[^a-z0-9]/g, "-");

    try {
      const payload = {
        name: catName,
        slug: generatedSlug,
        description: catDescription || undefined,
        image: catPreviewImage || undefined,
        imageStorageId: catStorageId || undefined,
        order: Number(catOrder),
        isActive: catIsActive,
        metaTitle: catMetaTitle.trim() || undefined,
        metaDescription: catMetaDescription.trim() || undefined,
        metaKeywords: catMetaKeywords.trim() || undefined,
      };

      if (editingCategory) {
        await updateCategory({
          id: editingCategory._id,
          ...payload,
        });
      } else {
        await createCategory(payload);
      }

      setCategoryModalOpen(false);
      resetCategoryForm();
    } catch (err: any) {
      setCategoryError(err?.message || "Kategori kaydedilirken bir hata oluştu.");
    }
  };

  const handleDeleteCategory = async (cat: any) => {
    if (confirm(`'${cat.name}' kategorisini silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteCategory({ id: cat._id });
      } catch (err: any) {
        alert(err?.message || "Kategori silinemedi. Bağlı ürünler olabilir.");
      }
    }
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
      {/* Admin Top Header */}
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
            <Link href="/" target="_blank">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs font-bold gap-1 cursor-pointer">
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
            <span>Ürünler ({products ? products.length : 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("chats")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer relative ${
              activeTab === "chats"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Canlı Destek & Sohbetler</span>
            {totalUnreadAdminCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                {totalUnreadAdminCount}
              </span>
            )}
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
            <span>Kategori Yönetimi ({categories ? categories.length : 0})</span>
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
            <span>İletişim &amp; Site Ayarları</span>
          </button>
        </div>

        {/* TAB 1: PRODUCTS MANAGEMENT */}
        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Ürün adı, OEM kod, marka veya etiket ara..."
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
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 h-10 rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Ürün Ekle</span>
              </Button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Görsel</th>
                      <th className="p-3.5">Parça No (OEM)</th>
                      <th className="p-3.5">Raf Kodu</th>
                      <th className="p-3.5">Ürün Başlığı</th>
                      <th className="p-3.5">Kategori</th>
                      <th className="p-3.5">Araç Markası</th>
                      <th className="p-3.5">Model / Yıl</th>
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
                                <img src={p.images[0]} alt={p.title} className="w-full h-full object-contain" />
                              ) : (
                                <Cpu className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-blue-700">{p.oemNumber}</td>
                          <td className="p-3">
                            {p.shelfCode ? (
                              <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                                {p.shelfCode}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-slate-900 max-w-xs truncate">{p.title}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                              {p.categoryName}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 font-semibold">{p.brand}</td>
                          <td className="p-3 text-slate-500 font-medium">{p.model || "-"}</td>
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
                        <td colSpan={10} className="p-8 text-center text-slate-500">
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

        {/* TAB 1.5: WHATSAPP-STYLE LIVE CHAT SUPPORT */}
        {activeTab === "chats" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden h-[720px] flex flex-col md:flex-row">
            {/* Left Column: Conversations List */}
            <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
              {/* Header & Filter */}
              <div className="p-3.5 border-b border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-emerald-600" />
                    <span>Canlı Sohbetler</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    {conversations?.length || 0} Konuşma
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Müşteri adı veya OEM ara..."
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    className="pl-8 h-8 text-xs bg-slate-50"
                  />
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                  <button
                    onClick={() => setChatStatusFilter("active")}
                    className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer ${
                      chatStatusFilter === "active" ? "bg-white text-emerald-800 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Aktifler
                  </button>
                  <button
                    onClick={() => setChatStatusFilter("closed")}
                    className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer ${
                      chatStatusFilter === "closed" ? "bg-white text-slate-800 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Kapatılanlar
                  </button>
                  <button
                    onClick={() => setChatStatusFilter("all")}
                    className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer ${
                      chatStatusFilter === "all" ? "bg-white text-slate-800 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tümü
                  </button>
                </div>
              </div>

              {/* Conversations Feed */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {conversations && conversations.length > 0 ? (
                  conversations.map((conv) => {
                    const isSelected = conv._id === selectedChatId;
                    const isClosed = conv.status === "closed";

                    return (
                      <div
                        key={conv._id}
                        onClick={() => setSelectedChatId(conv._id)}
                        className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isSelected
                            ? "bg-emerald-50/80 border-l-4 border-emerald-600"
                            : "hover:bg-slate-100/80"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-sm">
                            {conv.visitorName ? conv.visitorName.charAt(0).toUpperCase() : <User className="w-5 h-5 text-slate-400" />}
                          </div>
                          {!isClosed && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="font-extrabold text-xs text-slate-900 truncate">
                              {conv.visitorName || "Misafir Ziyaretçi"}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(conv.lastMessageAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>

                          {conv.visitorPhone && (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold mb-0.5">
                              <Phone className="w-2.5 h-2.5 shrink-0" />
                              <span>{conv.visitorPhone}</span>
                            </div>
                          )}

                          {conv.productCard && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-700 font-bold truncate mb-1">
                              <ShoppingBag className="w-3 h-3 shrink-0" />
                              <span className="truncate">{conv.productCard.oemNumber} - {conv.productCard.title}</span>
                            </div>
                          )}

                          <p className="text-[11px] text-slate-500 truncate">
                            {conv.lastMessage || "Sohbet"}
                          </p>
                        </div>

                        {conv.unreadCountAdmin > 0 && (
                          <span className="bg-emerald-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-xs">
                            {conv.unreadCountAdmin}
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Sohbet bulunamadı.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: WhatsApp-Style Chat Room */}
            {selectedConversation ? (
              <div className="flex-1 flex flex-col h-full bg-[#efeae2]/40 relative">
                {/* Chat Room Top Bar */}
                <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shadow-xs z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
                      {selectedConversation.visitorName ? selectedConversation.visitorName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm text-white truncate">
                          {selectedConversation.visitorName || "Misafir Ziyaretçi"}
                        </h4>
                        {selectedConversation.visitorPhone && (
                          <span className="text-[11px] font-bold text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{selectedConversation.visitorPhone}</span>
                          </span>
                        )}
                        <Badge
                          variant="secondary"
                          className={`text-[9px] py-0 px-1.5 font-bold ${
                            selectedConversation.status === "active"
                              ? "bg-emerald-500/20 text-emerald-300 border-none"
                              : "bg-slate-700 text-slate-300 border-none"
                          }`}
                        >
                          {selectedConversation.status === "active" ? "Aktif" : "Kapatıldı"}
                        </Badge>
                      </div>

                      {selectedConversation.productCard && (
                        <Link
                          href={`/urunler/${selectedConversation.productCard.slug}`}
                          target="_blank"
                          className="flex items-center gap-1 text-[11px] text-blue-300 hover:text-white truncate"
                        >
                          <span>İncelenen Parça: OEM <strong>{selectedConversation.productCard.oemNumber}</strong> ({selectedConversation.productCard.title})</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Actions: WhatsApp Link, Close, Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={generateWhatsAppLink(
                        selectedConversation.visitorPhone || "+905340653222",
                        selectedConversation.productCard?.title,
                        selectedConversation.productCard?.oemNumber,
                        `Merhaba ${selectedConversation.visitorName || "Değerli Müşterimiz"}, TMS İthalat canlı destek hattından talebinizle ilgili ulaşıyoruz.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-600 text-xs font-bold gap-1 h-8 cursor-pointer"
                        title="WhatsApp'a Aktar"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </Button>
                    </a>

                    {selectedConversation.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Bu canlı destek oturumunu sonlandırmak istediğinizden emin misiniz?")) {
                            closeChatMutation({ conversationId: selectedConversation._id });
                          }
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-bold gap-1 h-8 cursor-pointer"
                        title="Sohbeti Kapat"
                      >
                        <PowerOff className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">Kapat</span>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Bu sohbeti ve tüm mesajlarını kalıcı olarak silmek istediğinizden emin misiniz?")) {
                          deleteChatMutation({ conversationId: selectedConversation._id });
                          setSelectedChatId(null);
                        }
                      }}
                      className="text-red-400 hover:text-red-200 hover:bg-red-950/50 h-8 w-8 p-0 cursor-pointer"
                      title="Sohbeti Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Message Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                  {activeChatMessages?.map((m) => {
                    const isAdmin = m.sender === "admin";
                    const isSystem = m.sender === "system";

                    if (isSystem) {
                      return (
                        <div key={m._id} className="flex justify-center my-2">
                          <span className="text-[11px] font-semibold text-slate-600 bg-white/90 shadow-2xs px-3.5 py-1 rounded-full text-center max-w-md border border-slate-200/60">
                            {m.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m._id}
                        className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-xs ${
                            isAdmin
                              ? "bg-[#d9fdd3] text-slate-900 rounded-tr-xs border border-emerald-200/60"
                              : "bg-white text-slate-900 rounded-tl-xs border border-slate-200/80"
                          }`}
                        >
                          <div className="text-[10px] font-bold text-slate-500 mb-0.5">
                            {isAdmin ? "Siz (Yetkili)" : (selectedConversation.visitorName || "Müşteri")}
                          </div>

                          {m.productCard && (
                            <div className="mb-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-left">
                              <div className="flex items-center gap-3">
                                {m.productCard.image && (
                                  <img
                                    src={m.productCard.image}
                                    alt={m.productCard.title}
                                    className="w-10 h-10 object-contain rounded-lg bg-white border border-slate-200"
                                  />
                                )}
                                <div className="min-w-0">
                                  <p className="font-extrabold text-xs text-slate-900 truncate">{m.productCard.title}</p>
                                  <p className="text-[11px] text-blue-700 font-mono font-bold">OEM: {m.productCard.oemNumber}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                          <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                            <span>{new Date(m.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                            {isAdmin && (
                              m.isRead ? (
                                <CheckCheck className="w-3 h-3 text-blue-500" />
                              ) : (
                                <Check className="w-3 h-3 text-slate-400" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleAdminSendMessage}
                  className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 z-10"
                >
                  <Input
                    placeholder="Müşteriye yanıt yazın... (Enter ile gönder)"
                    value={adminMessageInput}
                    onChange={(e) => setAdminMessageInput(e.target.value)}
                    className="text-xs h-10 bg-slate-50 rounded-xl"
                  />
                  <Button
                    type="submit"
                    disabled={!adminMessageInput.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-xs gap-1.5 cursor-pointer"
                  >
                    <span>Gönder</span>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/50">
                <Headphones className="w-12 h-12 text-slate-300 mb-3" />
                <h4 className="font-extrabold text-sm text-slate-600">Sohbet Seçilmedi</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Sol taraftaki listeden bir konuşma seçerek müşterilerinizle gerçek zamanlı yazışabilirsiniz.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CATEGORIES FULL MANAGEMENT */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h3 className="font-black text-sm text-slate-900">Kategori Yönetimi</h3>
                <p className="text-xs text-slate-500">
                  Kategorileri ekleyin, düzenleyin veya kaldırın. Ürünler bu kategorilere bağlanır.
                </p>
              </div>

              <Button
                onClick={() => {
                  resetCategoryForm();
                  setCategoryModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 h-10 rounded-xl cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Yeni Kategori Ekle</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories?.map((cat) => (
                <div
                  key={cat._id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-contain" />
                      ) : (
                        <Layers className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">{cat.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{cat.slug}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-bold">Sıra: {cat.order ?? 1}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${cat.isActive !== false ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                          {cat.isActive !== false ? "Aktif" : "Pasif"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditCategory(cat)}
                      className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600"
                      title="Düzenle"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(cat)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SETTINGS */}
        {activeTab === "settings" && (
          <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">İletişim &amp; Site Ayarları</h3>
              <p className="text-xs text-slate-500">
                Sitede ve altbilgide (Footer) görünen iletişim bilgilerini ve üst duyuru bandını güncelleyin.
              </p>
            </div>

            {settingsSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ayarlar başarıyla kaydedildi!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    WhatsApp Sipariş Numarası
                  </label>
                  <Input
                    defaultValue={siteSettings?.whatsappNumber || "+905340653222"}
                    onChange={(e) => setSettingsWhatsapp(e.target.value)}
                    placeholder="+905340653222"
                    className="bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Telefon Numarası (Görünen)
                  </label>
                  <Input
                    defaultValue={siteSettings?.phone || "(0212) 861 32 72"}
                    onChange={(e) => setSettingsPhone(e.target.value)}
                    placeholder="(0212) 861 32 72"
                    className="bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  E-Posta Adresi
                </label>
                <Input
                  defaultValue={siteSettings?.email || "info@tmsithalat.com"}
                  onChange={(e) => setSettingsEmail(e.target.value)}
                  placeholder="info@tmsithalat.com"
                  className="bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Depo &amp; Mağaza Adresi
                </label>
                <Input
                  defaultValue={siteSettings?.address || "Hürriyet, İstiklal Cd. No:102, 34537 Büyükçekmece/İstanbul"}
                  onChange={(e) => setSettingsAddress(e.target.value)}
                  placeholder="Hürriyet, İstiklal Cd. No:102, 34537 Büyükçekmece/İstanbul"
                  className="bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Üst Duyuru Bandı Metni
                </label>
                <Input
                  defaultValue={siteSettings?.announcement || "⚡ Saat 16:00'ya kadar verilen siparişlerde aynı gün hızlı kargo! Orijinal & iade güvencesi."}
                  onChange={(e) => setSettingsAnnouncement(e.target.value)}
                  placeholder="Duyuru metni..."
                  className="bg-white"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 font-bold h-11 px-8 rounded-xl cursor-pointer">
                  <Save className="w-4 h-4 mr-2" />
                  <span>Ayarları Kaydet</span>
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Product Add / Edit Modal (All AI & Storage Actions Unified Here) */}
      <Dialog open={addProductModalOpen} onOpenChange={setAddProductModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">
              {editingProduct ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Parça numarasını yazıp AI ile tek tıkla formu doldurabilir, raf kodu ve fotoğrafları ekleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          {aiSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{aiSuccess}</span>
            </div>
          )}

          {aiError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProduct} className="space-y-4 pt-1 text-xs">
            {/* OEM Input + AI Auto Fill Button */}
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
              <label className="font-bold text-purple-950 block">
                OEM / Parça Numarası & AI Otomatik Doldurma
              </label>
              <div className="flex gap-2">
                <Input
                  required
                  placeholder="Örn: S113717205D veya 0281011234"
                  value={oemNumber}
                  onChange={(e) => setOemNumber(e.target.value.toUpperCase())}
                  className="font-mono uppercase font-bold text-sm bg-white border-purple-300"
                />

                <Button
                  type="button"
                  disabled={aiGenerating || !oemNumber.trim()}
                  onClick={handleAiAutoFill}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 shrink-0 px-4 h-10 rounded-xl shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>AI Dolduruyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>✨ AI İle Doldur</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Depo Raf Kodu</label>
                <Input
                  placeholder="Örn: RAF-R04"
                  value={shelfCode}
                  onChange={(e) => setShelfCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Durum</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-800"
                >
                  <option value="Orijinal Çıkma">Orijinal Çıkma</option>
                  <option value="Sıfır - Orijinal">Sıfır - Orijinal</option>
                  <option value="Revizyonlu">Revizyonlu</option>
                  <option value="Sıfırlanmış - Virgin">Sıfırlanmış - Virgin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Ürün Başlığı *</label>
              <Input
                required
                placeholder="Örn: Renault Motor Beyni ECU Sagem S113717205D Orijinal Çıkma Motor Kontrol Ünitesi"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Araç Markası *</label>
                <Input
                  required
                  placeholder="Renault, Volkswagen, BMW..."
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Model / Uyumluluk</label>
                <Input
                  placeholder="Renault Modelleri (Genel)"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kategori / Parça Türü *</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white px-2.5 font-semibold text-slate-800"
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

            {/* Product Photo Upload Section */}
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>Ürün Fotoğrafları</span>
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleProductFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-bold gap-1 cursor-pointer"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                      <span>Fotoğraf Yükle</span>
                    </>
                  )}
                </Button>
              </div>

              {previewImages.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {previewImages.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-white group">
                      <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImages(previewImages.filter((_, i) => i !== idx));
                          setUploadedStorageIds(uploadedStorageIds.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 opacity-80 hover:opacity-100 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Henüz fotoğraf yüklenmedi. Cihazınızdan doğrudan fotoğraf seçebilirsiniz.
                </p>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Ürün Açıklaması & Kullanım Alanları
              </label>
              <Textarea
                placeholder="Motor kontrol ünitesi özellikleri, kullanım alanları, montaj uyarıları..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* SEO & Meta Fields Section */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                <Globe className="w-4 h-4" />
                <span>SEO & Google Arama Ayarları</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">SEO Bağlantısı (URL Slug)</label>
                <Input
                  placeholder="renault-sagem-s113717205d-motor-beyni-ecu"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  className="font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Meta Başlığı</label>
                <Input
                  placeholder="Sagem S113717205D Renault Motor Beyni ECU Orijinal Çıkma | TMS İthalat"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Meta Açıklaması</label>
                <Input
                  placeholder="Renault araçlar için Sagem S113717205D numaralı motor beyni ECU..."
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Meta Kelimeleri</label>
                <Input
                  placeholder="S113717205D, Renault motor beyni, Renault ECU, Sagem ECU"
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-500" />
                  <span>Ürün Etiketleri (Virgülle ayırın)</span>
                </label>
                <Input
                  placeholder="S113717205D, Renault, Sagem, ECU, Motor Beyni, Çıkma Parça"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span>Stokta Var</span>
              </label>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
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

      {/* Category Add / Edit Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              {editingCategory ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Kategori adını, slug, görselini ve SEO ayarlarını tanımlayın.
            </DialogDescription>
          </DialogHeader>

          {categoryError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {categoryError}
            </div>
          )}

          <form onSubmit={handleSaveCategory} className="space-y-3.5 pt-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Kategori Adı *</label>
              <Input
                required
                placeholder="Örn: Motor Beyinleri (ECU)"
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value);
                  if (!editingCategory) {
                    setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                  }
                }}
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">URL Slug *</label>
              <Input
                required
                placeholder="motor-beyinleri-ecu"
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value.toLowerCase())}
                className="font-mono"
              />
            </div>

            {/* Category Image Upload */}
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kategori Görseli</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={catFileInputRef}
                  onChange={handleCategoryFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={catUploading}
                  onClick={() => catFileInputRef.current?.click()}
                  className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-bold gap-1 cursor-pointer h-7"
                >
                  {catUploading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3 h-3 text-blue-600" />
                      <span>Görsel Seç</span>
                    </>
                  )}
                </Button>
              </div>

              {catPreviewImage ? (
                <div className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <img src={catPreviewImage} alt="Category Preview" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      setCatPreviewImage("");
                      setCatStorageId(null);
                    }}
                    className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 opacity-80 hover:opacity-100 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Kategori ikon veya fotoğrafını yükleyin.
                </p>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Açıklama</label>
              <Input
                placeholder="Kategori hakkında kısa açıklama..."
                value={catDescription}
                onChange={(e) => setCatDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Sıralama (Order)</label>
                <Input
                  type="number"
                  value={catOrder}
                  onChange={(e) => setCatOrder(Number(e.target.value))}
                />
              </div>

              <div className="pt-4">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={catIsActive}
                    onChange={(e) => setCatIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Kategori Aktif</span>
                </label>
              </div>
            </div>

            {/* Category SEO Section */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                <Globe className="w-3.5 h-3.5" />
                <span>SEO Ayarları (Opsiyonel)</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kategori Meta Başlığı</label>
                <Input
                  placeholder="Motor Beyinleri (ECU) Modülleri ve Fiyatları | TMS İthalat"
                  value={catMetaTitle}
                  onChange={(e) => setCatMetaTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kategori Meta Açıklaması</label>
                <Input
                  placeholder="En uygun fiyatlı orijinal çıkma ve sıfır motor beyinleri..."
                  value={catMetaDescription}
                  onChange={(e) => setCatMetaDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kategori SEO Kelimeleri</label>
                <Input
                  placeholder="motor beyni, ecu, çıkma motor beyni, bosch ecu"
                  value={catMetaKeywords}
                  onChange={(e) => setCatMetaKeywords(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoryModalOpen(false)}
              >
                İptal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 font-bold px-6">
                {editingCategory ? "Güncelle" : "Kategori Oluştur"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
