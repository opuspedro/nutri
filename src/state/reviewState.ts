import { supabase } from "@/integrations/supabase/client";

// Define the type for files based on the Supabase query result
interface ProjectFile {
  id: string;
  name: string;
  minio_path: string;
  project_id: string; // Include project_id for grouping
}

// Define the type for pending projects including nested files
interface PendingProject {
  id: string;
  name: string;
  files: Omit<ProjectFile, 'project_id'>[]; // Files array without project_id
}

// Function to get projects that are pending review (do not have an entry in the reviews table)
export const getPendingProjects = async (): Promise<PendingProject[]> => {
  console.log("--- getPendingProjects START ---");
  console.log("Fetching all projects and reviews from Supabase to find pending...");
  try {
    // Step 1: Fetch all projects
    console.log("Step 1: Fetching all projects...");
    const { data: allProjectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, name');

    if (projectsError) {
      console.error("Error fetching all projects:", projectsError);
      throw projectsError;
    }

    console.log("Step 1 Result: All projects fetched:", allProjectsData);

    if (!allProjectsData || allProjectsData.length === 0) {
      console.log("No projects found in the database.");
      console.log("--- getPendingProjects END (No projects) ---");
      return []; // No projects at all, return empty array
    }

    // Step 2: Fetch all reviews
    console.log("Step 2: Fetching all reviews...");
    const { data: allReviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('project_id'); // Only need the project_id to identify reviewed projects

    if (reviewsError) {
      console.error("Error fetching all reviews:", reviewsError);
      // We can still proceed if fetching reviews fails, assuming no projects are reviewed
      console.warn("Could not fetch reviews, assuming no projects are reviewed.");
    }

    console.log("Step 2 Result: All reviews fetched:", allReviewsData);

    // Step 3: Identify pending project IDs by filtering projects that do NOT have a review entry
    console.log("Step 3: Identifying pending projects...");
    const reviewedProjectIds = new Set(allReviewsData?.map(review => review.project_id) || []);
    console.log("Reviewed project IDs set:", reviewedProjectIds);

    const pendingProjectsData = allProjectsData.filter(project => !reviewedProjectIds.has(project.id));

    console.log("Step 3 Result: Pending projects identified:", pendingProjectsData);

    if (pendingProjectsData.length === 0) {
      console.log("No pending projects found after filtering.");
      console.log("--- getPendingProjects END (No pending projects) ---");
      return []; // No pending projects after filtering, return empty array
    }

    const pendingProjectIds = pendingProjectsData.map(p => p.id);
    console.log("Pending project IDs list:", pendingProjectIds);

    console.log("Step 4: Fetching files for pending project IDs:", pendingProjectIds);
    // Step 4: Fetch all files for these pending project IDs
    const { data: filesData, error: filesError } = await supabase
      .from('files')
      .select('id, name, minio_path, project_id') // Select file info and project_id
      .in('project_id', pendingProjectIds); // Filter files by the list of pending project IDs

    if (filesError) {
      console.error("Error fetching files for pending projects:", filesError);
      throw filesError; // Re-throw to be caught by the component
    }

    console.log("Step 4 Result: Files for pending projects fetched:", filesData);

    // Step 5 & 6: Group files by project_id and combine with pending project data
    console.log("Step 5 & 6: Grouping files and combining with projects...");
    const filesByProjectId = filesData.reduce((acc, file) => {
      if (!acc[file.project_id]) {
        acc[file.project_id] = [];
      }
      // Omit project_id when adding to the files array in the final structure
      const { project_id, ...fileWithoutProjectId } = file;
      acc[file.project_id].push(fileWithoutProjectId);
      return acc;
    }, {} as Record<string, Omit<ProjectFile, 'project_id'>[]>);
    console.log("Files grouped by project ID:", filesByProjectId);


    const pendingProjectsWithFiles: PendingProject[] = pendingProjectsData.map(project => ({
      id: project.id,
      name: project.name,
      files: filesByProjectId[project.id] || [], // Attach the files for this project
    }));

    console.log("Step 6 Result: Combined pending projects with files:", pendingProjectsWithFiles);
    console.log("--- getPendingProjects END (Success) ---");
    return pendingProjectsWithFiles;

  } catch (error) {
    console.error("--- getPendingProjects END (Error) ---");
    console.error("Failed to fetch pending projects and files:", error);
    // Re-throw the error to be handled by the calling component (Index.tsx)
    throw error;
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
export const getProjectFiles = async (projectId: string): Promise<Omit<ProjectFile, 'project_id'>[]> => {
  console.log(`Fetching files for project ${projectId} from Supabase...`);
  try {
    const { data, error } = await supabase
      .from('files')
      .select('id, name, minio_path') // Select only necessary fields
      .eq('project_id', projectId); // Filter files by project_id

    if (error) {
      console.error(`Error fetching files for project ${projectId}:`, error);
      throw error;
    }

    console.log(`Files fetched for project ${projectId}:`, data);
    // Ensure data is an array and remove project_id if it was selected (though we removed it from select)
    return data || [];
  } catch (error) {
    console.error(`Failed to fetch files for project ${projectId}:`, error);
    return [];
  }
};

// New function to create a project
export const createProject = async (name: string) => {
  console.log(`Creating new project with name: ${name}...`);
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([
        { name: name }
      ])
      .select(); // Select the inserted data to get the new project ID

    if (error) {
      console.error("Error creating project:", error);
      throw error;
    }

    console.log("Project created successfully:", data);
    // Return the created project data (should be an array with one item)
    return data ? data[0] : null;

  } catch (error) {
    console.error("Failed to create project:", error);
    throw error; // Re-throw the error
  }
};