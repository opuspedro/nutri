import { supabase } from "@/integrations/supabase/client";

// Define the type for files based on the Supabase query result, including the new status
interface ReviewFile {
  id: string; // This is the file ID
  name: string;
  minio_path: string;
  created_at: string; // Assuming files table has created_at
  status: 'confirmed' | 'denied' | null; // Add the new status column
}

// Define the type for reviewed files - now fetching directly from files table
interface ReviewedFile {
  id: string; // This is the file ID
  name: string;
  minio_path: string;
  created_at: string;
  status: 'confirmed' | 'denied'; // Status will be non-null for reviewed files
}


// Function to get files that are pending review (status is null)
export const getPendingFiles = async (): Promise<ReviewFile[]> => {
  console.log("--- getPendingFiles START ---");
  console.log("Fetching files with status is null...");
  try {
    // Select files where the status column is null
    const { data, error } = await supabase
      .from('files')
      .select('id, name, minio_path, created_at, status') // Select all relevant columns including status
      .is('status', null); // Filter for files where status is null

    if (error) {
      console.error("Error fetching pending files:", error);
      throw error;
    }

    console.log("Pending files fetched:", data);
    console.log("--- getPendingFiles END (Success) ---");
    return data || [];

  } catch (error) {
    console.error("--- getPendingFiles END (Error) ---");
    console.error("Failed to fetch pending files:", error);
    throw error; // Re-throw the error to be handled by the calling component
  }
};

// Function to get files that have been reviewed (status is 'confirmed' or 'denied')
export const getReviewedFiles = async (): Promise<ReviewedFile[]> => {
   console.log("Fetching reviewed files from Supabase (from files table)...");
  try {
    // Select files where the status is 'confirmed' or 'denied'
    const { data, error } = await supabase
      .from('files')
      .select('id, name, minio_path, created_at, status') // Select relevant columns
      .in('status', ['confirmed', 'denied']); // Filter for reviewed statuses

    if (error) {
      console.error("Error fetching reviewed files:", error);
      throw error;
    }

    console.log("Reviewed files fetched:", data);
    // The data structure now directly matches the ReviewedFile type
    return data as ReviewedFile[] || [];

  } catch (error) {
    console.error("Failed to fetch reviewed files:", error);
     // In a real app, you might want to return an empty array or handle the error differently
    throw error; // Re-throw to be handled by the calling component
  }
};

// Function to update the status of a file in the files table
export const updateFileStatus = async (fileId: string, status: 'confirmed' | 'denied') => {
  console.log(`Updating status for file ${fileId} to ${status} in Supabase...`);
  try {
    // Update the status column in the files table
    const { data, error } = await supabase
      .from('files')
      .update({ status: status }) // Set the new status
      .eq('id', fileId) // Where the file ID matches
      .select(); // Select the updated row to confirm

    if (error) {
      console.error(`Error updating status for file ${fileId} to ${status}:`, error);
      throw error;
    }

    console.log(`Status for file ${fileId} updated to ${status} successfully.`, data);
    return data;

  } catch (error) {
    console.error(`Failed to update status for file ${fileId} to ${status}:`, error);
    throw error; // Re-throw the error to be handled by the calling component
  }
};

// Function to get a single file by ID (still queries files table)
export const getFileById = async (fileId: string): Promise<ReviewFile | null> => {
  console.log(`Fetching file ${fileId} from Supabase...`);
  try {
    const { data, error } = await supabase
      .from('files')
      .select('id, name, minio_path, created_at, status') // Include status in select
      .eq('id', fileId)
      .single(); // Expecting a single row

    if (error) {
      console.error(`Error fetching file ${fileId}:`, error);
      throw error;
    }

    console.log(`File ${fileId} fetched:`, data);
    return data || null;
  } catch (error) {
    console.error(`Failed to fetch file ${fileId}:`, error);
    throw error; // Re-throw the error
  }
};

// Remove project-related functions (already removed in previous state)
// export const createProject = async (name: string) => { ... }
// export const getProjectFiles = async (projectId: string): Promise<Omit<ProjectFile, 'project_id'>[]> => { ... }