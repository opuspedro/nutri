import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to remove '@s.whatsapp.net' from file names
export function cleanFileName(fileName: string): string {
  if (!fileName) return "";
  const suffix = "@s.whatsapp.net";
  if (fileName.endsWith(suffix)) {
    return fileName.substring(0, fileName.length - suffix.length);
  }
  return fileName;
}