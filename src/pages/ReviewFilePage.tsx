import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { showLoading, showSuccess, showError, dismissToast } from "@/utils/toast";
import { markFileAsReviewed, getFileById } from "@/state/reviewState"; // Import file-based functions

// Define the type for a single file
interface ReviewFile {
  id: string; // This is the file ID
  name: string;
  minio_path: string;
  created_at: string;
}

const ReviewFilePage = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [fileToReview, setFileToReview] = useState<ReviewFile | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(true); // Loading state for the file
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [denying, setDenying] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      if (!fileId) {
        showError("ID do arquivo não fornecido.");
        setIsLoadingFile(false);
        return;
      }
      setIsLoadingFile(true);
      const loadingToastId = showLoading(`Carregando arquivo ${fileId}...`);
      try {
        const file = await getFileById(fileId);
        setFileToReview(file);
        if (!file) {
             showError("Arquivo não encontrado.");
        }
      } catch (error) {
        console.error("Failed to fetch file:", error);
        showError("Falha ao carregar arquivo.");
        setFileToReview(null); // Set to null on error
      } finally {
        dismissToast(loadingToastId);
        setIsLoadingFile(false);
      }
    };

    fetchFile();
  }, [fileId]); // Re-run effect if fileId changes

  // Function to handle file download using the public minio_path URL
  const handleDownload = () => {
    if (!fileToReview) return;
    setDownloading(true);
    const loadingToastId = showLoading(`Preparando download de ${fileToReview.name}...`);

    try {
      console.log(`Attempting to download file from public URL: ${fileToReview.minio_path}`);
      // Use the public URL directly
      window.open(fileToReview.minio_path, '_blank');
      showSuccess(`Download iniciado para ${fileToReview.name}!`);

    } catch (error) {
      console.error("Download failed:", error);
      showError(`Falha ao iniciar download de ${fileToReview.name}.`);
    } finally {
      dismissToast(loadingToastId);
      setDownloading(false);
    }
  };

  // Function to handle file preview using the public minio_path URL
  const handlePreview = () => {
     if (!fileToReview) return;
    setPreviewing(true);
     const loadingToastId = showLoading(`Preparando preview de ${fileToReview.name}...`);

    try {
      console.log(`Attempting to preview file from public URL: ${fileToReview.minio_path}`);
      // Use the public URL directly for preview (opens in new tab)
      window.open(fileToReview.minio_path, '_blank');
      showSuccess(`Preview aberto para ${fileToReview.name}!`);

    } catch (error) {
      console.error("Preview failed:", error);
      showError(`Falha ao abrir preview de ${fileToReview.name}.`);
    } finally {
      dismissToast(loadingToastId);
      setPreviewing(false);
    }
  };

  // Function to handle confirmation
  const handleConfirm = async () => {
    if (!fileId) return;
    setConfirming(true);
    const loadingToastId = showLoading("Enviando confirmação...");

    try {
      await markFileAsReviewed(fileId, 'confirmed'); // Use the file-based function
      showSuccess(`Revisão do arquivo ${fileId} confirmada com sucesso!`);
      navigate('/'); // Navigate back to index

    } catch (error: any) {
      console.error("Confirmation failed:", error);
      showError(error.message || "Falha ao enviar confirmação.");
    } finally {
      dismissToast(loadingToastId);
      setConfirming(false);
    }
  };

  // Function to handle denial
  const handleDeny = async () => {
     if (!fileId) return;
    setDenying(true);
    const loadingToastId = showLoading("Enviando negação...");

    try {
      await markFileAsReviewed(fileId, 'denied'); // Use the file-based function
      showSuccess(`Revisão do arquivo ${fileId} negada com sucesso!`);
      navigate('/'); // Navigate back to index

    } catch (error: any) {
      console.error("Denial failed:", error);
      showError(error.message || "Falha ao enviar negação.");
    } finally {
      dismissToast(loadingToastId);
      setDenying(false);
    }
  };

  const isProcessingReview = confirming || denying;
  const isPageLoading = isLoadingFile || isProcessingReview;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-4">Podemos mandar esse arquivo para o cliente?</h1>
      <h2 className="text-2xl text-center text-gray-700 dark:text-gray-300 mb-8">Arquivo: {fileId}</h2>


      {isLoadingFile ? (
         <div className="text-center text-gray-500 dark:text-gray-400">
            Carregando arquivo...
          </div>
      ) : !fileToReview ? (
        <div className="text-center text-gray-500 dark:text-gray-400">
          Arquivo não encontrado.
        </div>
      ) : (
         <div className="space-y-6 mb-8">
            <Card key={fileToReview.id}>
              <CardHeader>
                <CardTitle>{fileToReview.name}</CardTitle>
                <CardDescription>Caminho no MinIO: {fileToReview.minio_path}</CardDescription>
                 <CardDescription className="text-gray-500 dark:text-gray-400 text-sm">Criado em: {new Date(fileToReview.created_at).toLocaleDateString()}</CardDescription>
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
                  onClick={handlePreview}
                  disabled={previewing || isPageLoading}
                >
                  {previewing ? "Carregando..." : "Preview"}
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={downloading || isPageLoading}
                >
                   {downloading ? "Carregando..." : "Download"}
                </Button>
              </CardFooter>
            </Card>
        </div>
      )}


      <Separator className="my-8" />

      <div className="flex justify-center space-x-4">
        <Button
          variant="destructive"
          size="lg"
          onClick={handleDeny}
          disabled={isPageLoading || !fileToReview}
        >
          {denying ? "Enviando..." : "Negar"}
        </Button>
        <Button
          size="lg"
          onClick={handleConfirm}
          disabled={isPageLoading || !fileToReview}
        >
          {confirming ? "Enviando..." : "Confirmar"}
        </Button>
      </div>

      <div className="mt-8 text-center">
         <Link to="/" className="text-blue-500 hover:underline">Voltar para a lista de arquivos</Link>
      </div>
    </div>
  );
};

export default ReviewFilePage;