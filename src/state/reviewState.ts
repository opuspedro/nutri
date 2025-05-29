import { supabase } from "@/integrations/supabase/client";

// Define the type for files based on the Supabase query result
interface ReviewFile {
  id: string; // This is the file ID
  name: string;
  minio_path: string;
  created_at: string; // Assuming files table has created_at
}

// Define the type for reviewed files
interface ReviewedFile {
  id: string; // This is the review ID
  file_id: string; // The ID of the reviewed file
  status: 'confirmed' | 'denied';
  reviewed_at: string;
  files: { // Details of the reviewed file from the join
    name: string;
    minio_path: string;
  } | null; // Use null in case the join fails
}


// Function to get files that are pending review (do not have an entry in the reviews table)
export const getPendingFiles = async (): Promise<ReviewFile[]> => {
  console.log("--- getPendingFiles START ---");
  console.log("Fetching files that do not have a review...");
  try {
    // Select files that do NOT have a matching entry in the 'reviews' table
    const { data, error } = await supabase
      .from('files')
      .select('id, name, minio_path, created_at') // Select file details
      .is_null('reviews.file_id'); // Filter for files where the joined review's file_id is null

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

// Function to get files that have been reviewed
export const getReviewedFiles = async (): Promise<ReviewedFile[]> => {
   console.log("Fetching reviewed files from Supabase...");
  try {
    // Select reviews and join with files to get file name and path
    const { data, error } = await supabase
      .from('reviews')
      .select('id, file_id, status, reviewed_at, files(name, minio_path)'); // Select review info and join file details

    if (error) {
      console.error("Error fetching reviewed files:", error);
      throw error;
    }

    console.log("Reviewed files fetched:", data);
    // The data structure is already close to ReviewedFile, just need to ensure types match
    return data as ReviewedFile[] || [];

  } catch (error) {
    console.error("Failed to fetch reviewed files:", error);
     // In a real app, you might want to return an empty array or handle the error differently
    throw error; // Re-throw to be handled by the calling component
  }
};

// Function to mark a file as reviewed
export const markFileAsReviewed = async (fileId: string, status: 'confirmed' | 'denied') => {
  console.log(`Marking file ${fileId} as ${status} in Supabase...`);
  try {
    // Insert a new entry into the reviews table
    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          file_id: fileId,
          status: status,
          // reviewer_id is not needed based on the new schema
        }
      ])
      .select(); // Add .select() to get the inserted data back

    if (error) {
      console.error(`Error marking file ${fileId} as ${status}:`, error);
      throw error;
    }

    console.log(`File ${fileId} marked as ${status} successfully.`, data);
    return data;

  } catch (error) {
    console.error(`Failed to mark file ${fileId} as ${status}:`, error);
    throw error; // Re-throw the error to be handled by the calling component
  }
};

// Function to get a single file by ID
export const getFileById = async (fileId: string): Promise<ReviewFile | null> => {
  console.log(`Fetching file ${fileId} from Supabase...`);
  try {
    const { data, error } = await supabase
      .from('files')
      .select('id, name, minio_path, created_at')
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

// Remove project-related functions
// export const createProject = async (name: string) => { ... }
// export const getProjectFiles = async (projectId: string): Promise<Omit<ProjectFile, 'project_id'>[]> => { ... }