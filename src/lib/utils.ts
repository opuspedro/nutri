import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to remove '@s.whatsapp.net' and '.txt' from file names
// Consistent with Edge Function logic: remove whatsapp first, then txt
export function cleanFileName(fileName: string): string {
  if (!fileName) return "";
  let cleaned = fileName;

  // Remove WhatsApp suffix if present at the end
  const whatsappSuffix = "@s.whatsapp.net";
  if (cleaned.endsWith(whatsappSuffix)) {
    cleaned = cleaned.substring(0, cleaned.length - whatsappSuffix.length);
  }

  // Remove .txt extension if present (case-insensitive)
  const txtSuffix = ".txt";
  if (cleaned.toLowerCase().endsWith(txtSuffix)) {
      cleaned = cleaned.substring(0, cleaned.length - txtSuffix.length);
  }

  console.log(`cleanFileName (Frontend - Consistent): Original "${fileName}" -> Cleaned "${cleaned}"`); // Added log

  return cleaned;
}