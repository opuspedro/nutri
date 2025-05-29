import { useState, useEffect, useCallback } from "react"; // Import useCallback
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPendingProjects } from "@/state/reviewState";
import { showLoading, dismissToast, showError } from "@/utils/toast"; // Import toast utilities
import ProjectCreationForm from "@/components/ProjectCreationForm"; // Import the new form component

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

const Index = () => {
  const [pendingProjects, setPendingProjects] = useState<PendingProject[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Use useCallback to memoize the fetch function
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    const loadingToastId = showLoading("Carregando resultados pendentes...");
    try {
      const projects = await getPendingProjects();
      setPendingProjects(projects);
    } catch (error) {
      console.error("Failed to fetch pending projects:", error);
      showError("Falha ao carregar resultados pendentes.");
      setPendingProjects([]); // Set to empty array on error
    } finally {
      dismissToast(loadingToastId);
      setIsLoading(false);
    }
  }, []); // Empty dependency array means this function is created once

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]); // Effect depends on the memoized fetchProjects function

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Resultados para Revisão</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">
          Selecione um resultado para revisar os arquivos.
        </p>
        <div className="mt-6">
          <Link to="/history">
            <Button variant="outline">Ver Histórico de Revisões</Button>
          </Link>
        </div>
      </div>

      {/* Add the Project Creation Form */}
      <ProjectCreationForm onProjectCreated={fetchProjects} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {isLoading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 col-span-full">
            Carregando...
          </div>
        ) : pendingProjects.length === 0 ? (
           <div className="text-center text-gray-500 dark:text-gray-400 col-span-full">
            Nenhum resultado pendente para revisão. Crie um novo acima.
          </div>
        ) : (
          pendingProjects.map((project) => (
            <Link key={project.id} to={`/review/${project.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  {/* Displaying the project name with "Consultoria" prefix */}
                  <CardTitle className="text-lg font-medium">Consultoria {project.name}</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400 text-sm">ID: {project.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="text-md font-semibold mb-2">Arquivos:</h4>
                  {project.files && project.files.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                      {project.files.map(file => (
                        <li key={file.id} className="truncate">
                          <span className="font-medium">{file.name}:</span> {file.minio_path}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum arquivo associado.</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Index;