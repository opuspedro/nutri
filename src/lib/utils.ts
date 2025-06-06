import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to remove '.txt' and '@s.whatsapp.net' from file names
export function cleanFileName(fileName: string): string {
  if (!fileName) return "";
  let cleaned = fileName;

  // Remove .txt extension if present (case-insensitive) - Do this first
  const txtSuffix = ".txt";
  if (cleaned.toLowerCase().endsWith(txtSuffix)) {
      cleaned = cleaned.substring(0, cleaned.length - txtSuffix.length);
  }

  // Remove WhatsApp suffix if present at the end of the remaining string
  const whatsappSuffix = "@s.whatsapp.net";
  if (cleaned.endsWith(whatsappSuffix)) {
    cleaned = cleaned.substring(0, cleaned.length - whatsappSuffix.length);
  }

  console.log(`cleanFileName: Original "${fileName}" -> Cleaned "${cleaned}"`); // Added log

  return cleaned;
}