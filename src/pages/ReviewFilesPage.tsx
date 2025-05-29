import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { showLoading, showSuccess, showError, dismissToast } from "@/utils/toast";
import { markAsReviewed, getProjectFiles } from "@/state/reviewState"; // Import Supabase functions

// Define the type for files based on the Supabase query result
interface ProjectFile {
  id: string;
  name: string;
  minio_path: string; // This is expected to be a public URL
}

const ReviewFilesPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [filesToReview, setFilesToReview] = useState<ProjectFile[]>([]);
  const [isLoadingFiles, setIsLoading] = useState(true); // Loading state for files
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [denying, setDenying] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!projectId) {
        showError("ID do projeto não fornecido.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const loadingToastId = showLoading(`Carregando arquivos para o projeto ${projectId}...`);
      try {
        const files = await getProjectFiles(projectId);
        setFilesToReview(files);
      } catch (error) {
        console.error("Failed to fetch files:", error);
        showError("Falha ao carregar arquivos.");
        setFilesToReview([]);
      } finally {
        dismissToast(loadingToastId);
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [projectId]); // Re-run effect if projectId changes

  // Function to handle file download using the public minio_path URL
  const handleDownload = (fileId: string, fileMinioPath: string) => {
    setDownloadingId(fileId);
    const fileName = filesToReview.find(f => f.id === fileId)?.name || 'o arquivo';
    const loadingToastId = showLoading(`Preparando download de ${fileName}...`);

    try {
      console.log(`Attempting to download file from public URL: ${fileMinioPath}`);
      // Use the public URL directly
      window.open(fileMinioPath, '_blank');
      showSuccess(`Download iniciado para ${fileName}!`);

    } catch (error) {
      console.error("Download failed:", error);
      showError(`Falha ao iniciar download de ${fileName}.`);
    } finally {
      dismissToast(loadingToastId);
      setDownloadingId(null);
    }
  };

  // Function to handle file preview using the public minio_path URL
  const handlePreview = (fileId: string, fileMinioPath: string) => {
    setPreviewingId(fileId);
     const fileName = filesToReview.find(f => f.id === fileId)?.name || 'o arquivo';
    const loadingToastId = showLoading(`Preparando preview de ${fileName}...`);

    try {
      console.log(`Attempting to preview file from public URL: ${fileMinioPath}`);
      // Use the public URL directly for preview (opens in new tab)
      window.open(fileMinioPath, '_blank');
      showSuccess(`Preview aberto para ${fileName}!`);

    } catch (error) {
      console.error("Preview failed:", error);
      showError(`Falha ao abrir preview de ${fileName}.`);
    } finally {
      dismissToast(loadingToastId);
      setPreviewingId(null);
    }
  };

  // Function to handle confirmation
  const handleConfirm = async () => {
    if (!projectId) return;
    setConfirming(true);
    const loadingToastId = showLoading("Enviando confirmação...");

    try {
      await markAsReviewed(projectId, 'confirmed');
      showSuccess(`Revisão do Resultado ${projectId} confirmada com sucesso!`);
      navigate('/'); // Navigate back to index

    } catch (error: any) { // Use 'any' or a more specific error type if possible
      console.error("Confirmation failed:", error);
      showError(error.message || "Falha ao enviar confirmação."); // Display error message from state function
    } finally {
      dismissToast(loadingToastId);
      setConfirming(false);
    }
  };

  // Function to handle denial
  const handleDeny = async () => {
     if (!projectId) return;
    setDenying(true);
    const loadingToastId = showLoading("Enviando negação...");

    try {
      await markAsReviewed(projectId, 'denied');
      showSuccess(`Revisão do Resultado ${projectId} negada com sucesso!`);
      navigate('/'); // Navigate back to index

    } catch (error: any) { // Use 'any' or a more specific error type if possible
      console.error("Denial failed:", error);
      showError(error.message || "Falha ao enviar negação."); // Display error message from state function
    } finally {
      dismissToast(loadingToastId);
      setDenying(false);
    }
  };

  const isProcessingReview = confirming || denying; // Disable buttons while confirming/denying
  const isPageLoading = isLoadingFiles || isProcessingReview; // Disable file buttons while loading files or processing review

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-4">Podemos mandar esse resultado para o cliente?</h1>
      <h2 className="text-2xl text-center text-gray-700 dark:text-gray-300 mb-8">Resultado: {projectId}</h2>


      {isLoadingFiles ? (
         <div className="text-center text-gray-500 dark:text-gray-400">
            Carregando arquivos...
          </div>
      ) : filesToReview.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400">
          Nenhum arquivo encontrado para este resultado.
        </div>
      ) : (
         <div className="space-y-6 mb-8">
          {filesToReview.map((file) => (
            <Card key={file.id}>
              <CardHeader>
                <CardTitle>{file.name}</CardTitle>
                <CardDescription>Caminho no MinIO: {file.minio_path}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Placeholder for file preview - implementation depends on file type */}
                {/* If minio_path is a direct public URL, you could potentially embed images/PDFs here */}
                <div className="h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded-md">
                  Área de Preview (Implementação específica por tipo de arquivo necessária se não for apenas abrir em nova aba)
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePreview(file.id, file.minio_path)}
                  disabled={previewingId === file.id || isPageLoading}
                >
                  {previewingId === file.id ? "Carregando..." : "Preview"}
                </Button>
                <Button
                  onClick={() => handleDownload(file.id, file.minio_path)}
                  disabled={downloadingId === file.id || isPageLoading}
                >
                   {downloadingId === file.id ? "Carregando..." : "Download"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}


      <Separator className="my-8" />

      <div className="flex justify-center space-x-4">
        <Button
          variant="destructive"
          size="lg"
          onClick={handleDeny}
          disabled={isPageLoading || filesToReview.length === 0}
        >
          {denying ? "Enviando..." : "Negar"}
        </Button>
        <Button
          size="lg"
          onClick={handleConfirm}
          disabled={isPageLoading || filesToReview.length === 0}
        >
          {confirming ? "Enviando..." : "Confirmar"}
        </Button>
      </div>

      <div className="mt-8 text-center">
         <Link to="/" className="text-blue-500 hover:underline">Voltar para a lista de resultados</Link>
      </div>
    </div>
  );
};

export default ReviewFilesPage;