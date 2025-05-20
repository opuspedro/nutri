import { useState } from "react"; // Import useState
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { showLoading, showSuccess, showError, dismissToast } from "@/utils/toast"; // Import toast utilities

// Placeholder data for files - replace with data fetched from your backend
const filesToReview = [
  { id: 'file1', name: 'Relatorio_Final_Projeto_X.pdf', minioPath: 'path/to/report.pdf' },
  { id: 'file2', name: 'Apresentacao_Cliente_X.pptx', minioPath: 'path/to/presentation.pptx' },
];

const ReviewFilesPage = () => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [denying, setDenying] = useState(false);

  // Function to handle file download
  // This function needs to fetch a pre-signed URL from your backend
  const handleDownload = async (fileId: string, fileMinioPath: string) => {
    setDownloadingId(fileId);
    const loadingToastId = showLoading(`Preparando download de ${filesToReview.find(f => f.id === fileId)?.name}...`);

    try {
      console.log(`Attempting to download file from MinIO path: ${fileMinioPath}`);
      // TODO: Implement logic to fetch a pre-signed download URL from your backend
      // Example: const response = await fetch('/api/get-presigned-url', { method: 'POST', body: JSON.stringify({ path: fileMinioPath }) });
      // const { url } = await response.json();
      // window.open(url, '_blank');

      // Simulate network request delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Placeholder success - replace with actual download logic
      showSuccess(`Download pronto para ${filesToReview.find(f => f.id === fileId)?.name}! (Simulado)`);
      // If you got a URL, you would open it here: window.open(url, '_blank');

    } catch (error) {
      console.error("Download failed:", error);
      showError(`Falha ao preparar download de ${filesToReview.find(f => f.id === fileId)?.name}.`);
    } finally {
      dismissToast(loadingToastId);
      setDownloadingId(null);
    }
  };

  // Function to handle file preview
  // This function needs to fetch a pre-signed URL from your backend
  const handlePreview = async (fileId: string, fileMinioPath: string) => {
    setPreviewingId(fileId);
    const loadingToastId = showLoading(`Preparando preview de ${filesToReview.find(f => f.id === fileId)?.name}...`);

    try {
      console.log(`Attempting to preview file from MinIO path: ${fileMinioPath}`);
      // TODO: Implement logic to fetch a pre-signed preview URL from your backend
      // The preview method depends on the file type (e.g., embed PDF, show image, link for others)
      // Example: const response = await fetch('/api/get-presigned-url', { method: 'POST', body: JSON.stringify({ path: fileMinioPath, action: 'preview' }) });
      // const { url } = await response.json();
      // window.open(url, '_blank'); // Simple approach: open in new tab

      // Simulate network request delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Placeholder success - replace with actual preview logic
      showSuccess(`Preview pronto para ${filesToReview.find(f => f.id === fileId)?.name}! (Simulado)`);
       // If you got a URL, you would open it here: window.open(url, '_blank');

    } catch (error) {
      console.error("Preview failed:", error);
      showError(`Falha ao preparar preview de ${filesToReview.find(f => f.id === fileId)?.name}.`);
    } finally {
      dismissToast(loadingToastId);
      setPreviewingId(null);
    }
  };

  // Function to handle confirmation
  const handleConfirm = async () => {
    setConfirming(true);
    const loadingToastId = showLoading("Enviando confirmação...");

    try {
      console.log("Review confirmed!");
      // TODO: Implement logic to send confirmation to your backend
      // Example: await fetch('/api/confirm-review', { method: 'POST', body: JSON.stringify({ fileIds: filesToReview.map(f => f.id) }) });

      // Simulate network request delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      showSuccess("Revisão confirmada com sucesso! (Simulado)");
      // Redirect or show success message
      // navigate('/'); // Example redirect

    } catch (error) {
      console.error("Confirmation failed:", error);
      showError("Falha ao enviar confirmação.");
    } finally {
      dismissToast(loadingToastId);
      setConfirming(false);
    }
  };

  // Function to handle denial
  const handleDeny = async () => {
    setDenying(true);
    const loadingToastId = showLoading("Enviando negação...");

    try {
      console.log("Review denied!");
      // TODO: Implement logic to send denial to your backend
      // Example: await fetch('/api/deny-review', { method: 'POST', body: JSON.stringify({ fileIds: filesToReview.map(f => f.id) }) });

      // Simulate network request delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      showSuccess("Revisão negada com sucesso! (Simulado)");
      // Redirect or show success message
      // navigate('/'); // Example redirect

    } catch (error) {
      console.error("Denial failed:", error);
      showError("Falha ao enviar negação.");
    } finally {
      dismissToast(loadingToastId);
      setDenying(false);
    }
  };

  const isLoading = confirming || denying; // Disable file buttons while confirming/denying

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-8">Podemos mandar esse resultado para o cliente?</h1>

      <div className="space-y-6 mb-8">
        {filesToReview.map((file) => (
          <Card key={file.id}>
            <CardHeader>
              <CardTitle>{file.name}</CardTitle>
              <CardDescription>Caminho no MinIO: {file.minioPath}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for file preview - implementation depends on file type */}
              <div className="h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded-md">
                Área de Preview (Implementação necessária)
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => handlePreview(file.id, file.minioPath)}
                disabled={previewingId === file.id || isLoading}
              >
                {previewingId === file.id ? "Carregando..." : "Preview"}
              </Button>
              <Button
                onClick={() => handleDownload(file.id, file.minioPath)}
                disabled={downloadingId === file.id || isLoading}
              >
                 {downloadingId === file.id ? "Carregando..." : "Download"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Separator className="my-8" />

      <div className="flex justify-center space-x-4">
        <Button
          variant="destructive"
          size="lg"
          onClick={handleDeny}
          disabled={isLoading}
        >
          {denying ? "Enviando..." : "Negar"}
        </Button>
        <Button
          size="lg"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {confirming ? "Enviando..." : "Confirmar"}
        </Button>
      </div>

      <div className="mt-8 text-center">
         <Link to="/" className="text-blue-500 hover:underline">Voltar para a página inicial</Link>
      </div>
    </div>
  );
};

export default ReviewFilesPage;