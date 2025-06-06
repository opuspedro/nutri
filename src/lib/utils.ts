import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Original function: Removes '@s.whatsapp.net' then '.txt'. Used for backend logic (e.g., sheet matching).
export function cleanFileName(fileName: string): string {
  if (!fileName) return "";
  let cleaned = fileName;

  // Remove WhatsApp suffix if present at the end - Do this first (Original Logic)
  const whatsappSuffix = "@s.whatsapp.net";
  if (cleaned.endsWith(whatsappSuffix)) {
    cleaned = cleaned.substring(0, cleaned.length - whatsappSuffix.length);
  }

  // Remove .txt extension if present (case-insensitive) - Do this second (Original Logic)
  const txtSuffix = ".txt";
  if (cleaned.toLowerCase().endsWith(txtSuffix)) {
      cleaned = cleaned.substring(0, cleaned.length - txtSuffix.length);
  }

  console.log(`cleanFileName (Backend Logic): Original "${fileName}" -> Cleaned "${cleaned}"`); // Added log

  return cleaned;
}

// New function: Removes '.txt' then '@s.whatsapp.net'. Used ONLY for visual display in the UI.
export function formatDisplayName(fileName: string): string {
    if (!fileName) return "";
    let formatted = fileName;

    // Remove .txt extension if present (case-insensitive) - Do this first (Display Logic)
    const txtSuffix = ".txt";
    if (formatted.toLowerCase().endsWith(txtSuffix)) {
        formatted = formatted.substring(0, formatted.length - txtSuffix.length);
    }

    // Remove WhatsApp suffix if present at the end - Do this second (Display Logic)
    const whatsappSuffix = "@s.whatsapp.net";
    if (formatted.endsWith(whatsappSuffix)) {
        formatted = formatted.substring(0, formatted.length - whatsappSuffix.length);
    }

    console.log(`formatDisplayName (Visual Only): Original "${fileName}" -> Formatted "${formatted}"`); // Added log

    return formatted;
}