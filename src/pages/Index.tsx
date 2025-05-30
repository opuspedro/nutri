import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"; // Import CardFooter
import { Button } from "@/components/ui/button";
import { getPendingFiles } from "@/state/reviewState";
import { showLoading, dismissToast, showError, showSuccess } from "@/utils/toast"; // Import showSuccess
import { Download, Eye } from "lucide-react"; // Import icons

// Define the type for pending files
interface PendingFile {
  id: string; // This is the file ID
  name: string;
  minio_path: string;
  created_at: string;
}

const Index = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null); // State to track which file is being downloaded

  const fetchPendingFiles = useCallback(async () => {
    setIsLoading(true);
    const loadingToastId = showLoading("Carregando arquivos pendentes para revisão...");
    try {
      const files = await getPendingFiles();
      setPendingFiles(files);
    } catch (error) {
      console.error("Failed to fetch pending files:", error);
      showError("Falha ao carregar arquivos pendentes.");
      setPendingFiles([]);
    } finally {
      dismissToast(loadingToastId);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingFiles();
  }, [fetchPendingFiles]);

  // Function to handle file download
  const handleDownload = (file: PendingFile) => {
    setDownloadingFileId(file.id);
    const loadingToastId = showLoading(`Preparando download de ${file.name}...`);

    try {
      console.log(`Attempting to download file from public URL: ${file.minio_path}`);
      // Use the public URL directly to open in a new tab, which often triggers download
      window.open(file.minio_path, '_blank');
      showSuccess(`Download iniciado para ${file.name}!`);

    } catch (error) {
      console.error("Download failed:", error);
      showError(`Falha ao iniciar download de ${file.name}.`);
    } finally {
      dismissToast(loadingToastId);
      setDownloadingFileId(null);
    }
  };

  // Function to handle navigation to the review page
  const handleReviewClick = (fileId: string) => {
    navigate(`/review-file/${fileId}`);
  };


  return (
    <div className="min-h-screen flex flex-col items-center text-gray-900 dark:text-gray-100 p-4"> {/* Removed bg-gray-100 dark:bg-gray-900 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Arquivos para Revisão</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">
          Selecione um arquivo para revisar.
        </p>
        <div className="mt-6">
          <Link to="/history"> {/* Link to the history page */}
            <Button variant="outline">Ver Histórico de Revisões</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {isLoading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 col-span-full">
            Carregando...
          </div>
        ) : pendingFiles.length === 0 ? (
           <div className="text-center text-gray-500 dark:text-gray-400 col-span-full">
            Nenhum arquivo pendente para revisão.
          </div>
        ) : (
          pendingFiles.map((file) => (
            // Card itself is not a link anymore, actions are via buttons
              <Card key={file.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
                <CardHeader>
                  {/* File name is now just text */}
                  <CardTitle className="text-lg font-medium truncate">{file.name}</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400 text-sm">ID: {file.id}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                   {/* Removed: Display the path as text */}
                   <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Criado em: {new Date(file.created_at).toLocaleDateString()}</p>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    {/* Download Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file)}
                        disabled={downloadingFileId === file.id}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        {downloadingFileId === file.id ? "Baixando..." : "Download"}
                    </Button>
                     {/* Review Button */}
                    <Button
                        variant="default" // Use default variant for primary action
                        size="sm"
                        onClick={() => handleReviewClick(file.id)}
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        Revisar
                    </Button>
                </CardFooter>
              </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Index;