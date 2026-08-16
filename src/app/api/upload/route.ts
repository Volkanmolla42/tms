import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;

    const filesToProcess: File[] = [];
    if (files && files.length > 0) {
      filesToProcess.push(...files);
    } else if (singleFile) {
      filesToProcess.push(singleFile);
    }

    if (filesToProcess.length === 0) {
      return NextResponse.json(
        { success: false, message: "Yüklenecek dosya bulunamadı." },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const uploadedUrls: string[] = [];

    for (const file of filesToProcess) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Clean filename
      const originalName = file.name || "upload.jpg";
      const ext = path.extname(originalName) || ".jpg";
      const baseName = path
        .basename(originalName, ext)
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "-")
        .replace(/-+/g, "-");

      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      const fileName = `${baseName || "image"}-${uniqueSuffix}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      uploadedUrls.push(`/uploads/${fileName}`);
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      url: uploadedUrls[0] || null,
    });
  } catch (error: any) {
    console.error("Local upload error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Dosya yüklenirken hata oluştu." },
      { status: 500 }
    );
  }
}
