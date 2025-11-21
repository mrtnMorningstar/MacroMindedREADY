import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Converts a full resolution image URL to a thumbnail URL
 * Expected format: mealPlans/{userId}/images/{imageName}
 * Thumbnail format: mealPlans/{userId}/thumbnails/{imageName}
 */
export function getThumbnailUrl(fullUrl: string): string {
  try {
    const url = new URL(fullUrl);
    
    // Handle Firebase Storage URLs
    // Format: https://firebasestorage.googleapis.com/v0/b/.../o/mealPlans%2F{userId}%2Fimages%2F{imageName}?...
    const pathMatch = url.pathname.match(/o\/(.+)/);
    if (pathMatch) {
      const decodedPath = decodeURIComponent(pathMatch[1]);
      
      // Replace /images/ with /thumbnails/
      if (decodedPath.includes("/images/")) {
        const thumbnailPath = decodedPath.replace("/images/", "/thumbnails/");
        const encodedThumbnailPath = encodeURIComponent(thumbnailPath);
        return `https://firebasestorage.googleapis.com/v0/b/${url.hostname.split('.')[0]}/o/${encodedThumbnailPath}?alt=media`;
      }
      
      // Handle recipes: recipes/{timestamp}_{imageName}
      if (decodedPath.startsWith("recipes/")) {
        // For recipes, we'll store thumbnails at recipes/thumbnails/{imageName}
        const recipeFileName = decodedPath.replace("recipes/", "");
        const thumbnailPath = `recipes/thumbnails/${recipeFileName}`;
        const encodedThumbnailPath = encodeURIComponent(thumbnailPath);
        return `https://firebasestorage.googleapis.com/v0/b/${url.hostname.split('.')[0]}/o/${encodedThumbnailPath}?alt=media`;
      }
    }
    
    // If we can't parse it, return original (fallback)
    return fullUrl;
  } catch (error) {
    console.error("Failed to convert to thumbnail URL:", error);
    return fullUrl;
  }
}

/**
 * Generates a thumbnail image from a File using canvas
 * @param file Original image file
 * @param maxWidth Maximum width for thumbnail (default: 400)
 * @param maxHeight Maximum height for thumbnail (default: 400)
 * @param quality JPEG quality (0-1, default: 0.8)
 */
export function generateThumbnail(
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create thumbnail blob"));
            }
          },
          "image/jpeg",
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image and its thumbnail to Firebase Storage
 * @param file Original image file
 * @param storagePath Storage path (e.g., "mealPlans/{userId}/images/{fileName}")
 * @returns Promise resolving to { fullUrl, thumbnailUrl }
 */
export async function uploadImageWithThumbnail(
  file: File,
  storagePath: string
): Promise<{ fullUrl: string; thumbnailUrl: string }> {
  try {
    // Upload full resolution image
    const fullImageRef = ref(storage, storagePath);
    await uploadBytes(fullImageRef, file);
    const fullUrl = await getDownloadURL(fullImageRef);
    
    // Generate and upload thumbnail
    const thumbnailBlob = await generateThumbnail(file);
    const thumbnailPath = storagePath.replace("/images/", "/thumbnails/");
    const thumbnailRef = ref(storage, thumbnailPath);
    
    // Create a File-like object from the blob for upload
    const thumbnailFile = new File([thumbnailBlob], file.name, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    
    await uploadBytes(thumbnailRef, thumbnailFile);
    const thumbnailUrl = await getDownloadURL(thumbnailRef);
    
    return { fullUrl, thumbnailUrl };
  } catch (error) {
    console.error("Failed to upload image with thumbnail:", error);
    throw error;
  }
}

/**
 * Uploads a recipe image and its thumbnail
 * @param file Original image file
 * @returns Promise resolving to { fullUrl, thumbnailUrl }
 */
export async function uploadRecipeImageWithThumbnail(
  file: File
): Promise<{ fullUrl: string; thumbnailUrl: string }> {
  const timestamp = Date.now();
  const fullPath = `recipes/${timestamp}_${file.name}`;
  const thumbnailPath = `recipes/thumbnails/${timestamp}_${file.name}`;
  
  try {
    // Upload full resolution image
    const fullImageRef = ref(storage, fullPath);
    await uploadBytes(fullImageRef, file);
    const fullUrl = await getDownloadURL(fullImageRef);
    
    // Generate and upload thumbnail
    const thumbnailBlob = await generateThumbnail(file);
    const thumbnailFile = new File([thumbnailBlob], file.name, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    
    const thumbnailRef = ref(storage, thumbnailPath);
    await uploadBytes(thumbnailRef, thumbnailFile);
    const thumbnailUrl = await getDownloadURL(thumbnailRef);
    
    return { fullUrl, thumbnailUrl };
  } catch (error) {
    console.error("Failed to upload recipe image with thumbnail:", error);
    throw error;
  }
}

