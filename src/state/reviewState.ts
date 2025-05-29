import { supabase } from "@/integrations/supabase/client";

// Define the type for files based on the Supabase query result
interface ProjectFile {
  id: string;
  name: string;
  minio_path: string;
}

// Define the type for pending projects including nested files
interface PendingProject {
  id: string;
  name: string;
  files: ProjectFile[]; // Add files array
}

// Function to get projects that are pending review (do not have an entry in the reviews table)
export const getPendingProjects = async (): Promise<PendingProject[]> => {
  console.log("Fetching pending projects and their files from Supabase...");
  try {
    // Select projects, their associated files, and check if they have a corresponding entry in the reviews table
    // We use a LEFT JOIN on reviews and filter where the reviews.project_id is NULL
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, files(id, name, minio_path), reviews(project_id)') // Select project info, files, and check for review existence
      .is('reviews.project_id', null); // Filter for projects where the review join result is null

    if (error) {
      console.error("Error fetching pending projects and files:", error);
      throw error;
    }

    console.log("Pending projects and files fetched:", data);
    // Map the data to the desired format, ensuring files array is included
    // Supabase automatically structures nested selects into arrays
    return data.map(project => ({
      id: project.id,
      name: project.name,
      files: project.files || [], // Ensure files is an array, even if null
    }));

  } catch (error) {
    console.error("Failed to fetch pending projects and files:", error);
    // In a real app, you might want to return an empty array or handle the error differently
    return [];
  }
};

// Function to get projects that have been reviewed
export const getReviewedProjects = async () => {
   console.log("Fetching reviewed projects from Supabase...");
  try {
    // Select reviews and join with projects to get project name
    const { data, error } = await supabase
      .from('reviews')
      .select('project_id, status, reviewed_at, projects(name)'); // Select review info and join project name

    if (error) {
      console.error("Error fetching reviewed projects:", error);
      throw error;
    }

    console.log("Reviewed projects fetched:", data);
    // Map the data to the desired format
    return data.map(review => ({
      id: review.project_id,
      name: review.projects?.name || 'Nome Desconhecido', // Use project name from join
      status: review.status as 'confirmed' | 'denied',
      reviewDate: new Date(review.reviewed_at).toLocaleDateString(), // Format date
    }));

  } catch (error) {
    console.error("Failed to fetch reviewed projects:", error);
     // In a real app, you might want to return an empty array or handle the error differently
    return [];
  }
};

// Function to mark a project as reviewed
export const markAsReviewed = async (projectId: string, status: 'confirmed' | 'denied') => {
  console.log(`Marking project ${projectId} as ${status} in Supabase...`);
  try {
    // Insert a new entry into the reviews table
    // RLS policy updated to allow insert without authentication
    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          project_id: projectId,
          status: status,
          // reviewer_id is now optional based on RLS policy
        }
      ])
      .select(); // Add .select() to get the inserted data back

    if (error) {
      console.error(`Error marking project ${projectId} as ${status}:`, error);
      throw error;
    }

    console.log(`Project ${projectId} marked as ${status} successfully.`, data);
    // Data returned by insert is typically the inserted row(s), but might be null depending on RLS/setup
    return data;

  } catch (error) {
    console.error(`Failed to mark project ${projectId} as ${status}:`, error);
    throw error; // Re-throw the error to be handled by the calling component
  }
};

// Function to get files for a specific project
// This function is still needed for the ReviewFilesPage
export const getProjectFiles = async (projectId: string): Promise<ProjectFile[]> => {
  console.log(`Fetching files for project ${projectId} from Supabase...`);
  try {
    const { data, error } = await supabase
      .from('files')
      .select('id, name, minio_path')
      .eq('project_id', projectId); // Filter files by project_id

    if (error) {
      console.error(`Error fetching files for project ${projectId}:`, error);
      throw error;
    }

    console.log(`Files fetched for project ${projectId}:`, data);
    return data || []; // Ensure it returns an array
  } catch (error) {
    console.error(`Failed to fetch files for project ${projectId}:`, error);
    return [];
  }
};