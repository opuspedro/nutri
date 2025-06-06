import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to remove '@s.whatsapp.net' and then '.txt' from file names (Reverted Logic)
export function cleanFileName(fileName: string): string {
  if (!fileName) return "";
  let cleaned = fileName;

  // Remove WhatsApp suffix if present at the end - Do this first (Reverted Order)
  const whatsappSuffix = "@s.whatsapp.net";
  if (cleaned.endsWith(whatsappSuffix)) {
    cleaned = cleaned.substring(0, cleaned.length - whatsappSuffix.length);
  }

  // Remove .txt extension if present (case-insensitive) - Do this second (Reverted Order)
  const txtSuffix = ".txt";
  if (cleaned.toLowerCase().endsWith(txtSuffix)) {
      cleaned = cleaned.substring(0, cleaned.length - txtSuffix.length);
  }

  console.log(`cleanFileName (Frontend - Reverted Logic): Original "${fileName}" -> Cleaned "${cleaned}"`); // Added log

  return cleaned;
}