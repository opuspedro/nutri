import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to remove '@s.whatsapp.net' and '.txt' from file names
export function cleanFileName(fileName: string): string {
  if (!fileName) return "";
  let cleaned = fileName;

  // Remove .txt extension first (case-insensitive)
  cleaned = cleaned.replace(/\.txt$/i, '');

  // Remove WhatsApp suffix
  cleaned = cleaned.replace(/@s\.whatsapp\.net$/, '');

  // Trim any leading/trailing whitespace that might result
  cleaned = cleaned.trim();


  console.log(`cleanFileName: Original "${fileName}" -> Cleaned "${cleaned}"`); // Added log

  return cleaned;
}