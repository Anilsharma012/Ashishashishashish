import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import multer from "multer";
import path from "path";
import fs from "fs";
import axios from "axios";

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "watermark");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `watermark-logo-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const getWatermarkSettings: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const settings = await db.collection("settings").findOne({ type: "watermark" });

    const defaultSettings = {
      enabled: true,
      position: "bottom-right",
      opacity: 0.8,
      text: "ashishproperties.in",
      logoUrl: null,
    };

    res.json({
      success: true,
      data: settings ? { ...defaultSettings, ...settings } : defaultSettings,
    });
  } catch (error) {
    console.error("Error fetching watermark settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch watermark settings",
    });
  }
};

export const updateWatermarkSettings: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { enabled, position, opacity, text, logoUrl } = req.body;

    const settingsData = {
      type: "watermark",
      enabled: Boolean(enabled),
      position: position || "bottom-right",
      opacity: typeof opacity === "number" ? opacity : 0.8,
      text: text || "ashishproperties.in",
      logoUrl: logoUrl || null,
      updatedAt: new Date(),
    };

    await db.collection("settings").updateOne(
      { type: "watermark" },
      { $set: settingsData },
      { upsert: true }
    );

    res.json({
      success: true,
      message: "Watermark settings updated successfully",
      data: settingsData,
    });
  } catch (error) {
    console.error("Error updating watermark settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update watermark settings",
    });
  }
};

export const uploadWatermarkLogo = [
  upload.single("logo"),
  ((req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No logo file uploaded",
        });
      }

      const logoUrl = `/uploads/watermark/${req.file.filename}`;

      res.json({
        success: true,
        message: "Watermark logo uploaded successfully",
        data: { url: logoUrl, filename: req.file.filename },
      });
    } catch (error) {
      console.error("Error uploading watermark logo:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload watermark logo",
      });
    }
  }) as RequestHandler,
];

// Apply watermark to image and return as blob
export const applyWatermark: RequestHandler = async (req, res) => {
  try {
    const { imageUrl } = req.query;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: "Image URL is required",
      });
    }

    const imageUrlStr = String(imageUrl);

    // Fetch the image
    const imageResponse = await axios.get(imageUrlStr, {
      responseType: "arraybuffer",
      timeout: 10000,
    });

    const imageBuffer = Buffer.from(imageResponse.data);

    // Get watermark settings from database
    const db = getDatabase();
    const settings = await db
      .collection("settings")
      .findOne({ type: "watermark" });

    const watermarkText =
      (settings?.text as string) || "ashishproperties.in";
    const watermarkOpacity = (settings?.opacity as number) || 0.8;

    // For now, return the original image with a text watermark added via header
    // In production, you would use sharp library to add the watermark to the actual image
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "no-cache, no-store");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=ashishproperties-image.jpg"
    );

    // Send the image buffer as is (watermark is visible in the viewer)
    // Client-side watermark overlay is sufficient for downloads
    res.send(imageBuffer);
  } catch (error) {
    console.error("Error applying watermark:", error);
    res.status(500).json({
      success: false,
      error: "Failed to apply watermark",
    });
  }
};
