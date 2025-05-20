import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";

// Placeholder data for files - replace with data fetched from your backend
const filesToReview = [
  { id: 'file1', name: 'Relatorio_Final_Projeto_X.pdf', minioPath: 'path/to/report.pdf' },
  { id: 'file2', name: 'Apresentacao_Cliente_X.pptx', minioPath: 'path/to/presentation.pptx' },
];

const ReviewFilesPage = () => {

  // Function to handle file download
  // This function needs to fetch a pre-signed URL from your backend
  const handleDownload = async (fileMinioPath: string) => {
    console.log(`Attempting to download file from MinIO path: ${fileMinioPath}`);
    // TODO: Implement logic to fetch a pre-signed download URL from your backend
    // Example: const response = await fetch('/api/get-presigned-url', { method: 'POST', body: JSON.stringify({ path: fileMinioPath }) });
    // const { url } = await response.json();
    // window.open(url, '_blank');
    alert(`Download logic needed for: ${fileMinioPath}\n\nImplement backend call to get pre-signed URL.`);
  };

  // Function to handle file preview
  // This function needs to fetch a pre-signed URL from your backend
  const handlePreview = async (fileMinioPath: string) => {
    console.log(`Attempting to preview file from MinIO path: ${fileMinioPath}`);
    // TODO: Implement logic to fetch a pre-signed preview URL from your backend
    // The preview method depends on the file type (e.g., embed PDF, show image, link for others)
    // Example: const response = await fetch('/api/get-presigned-url', { method: 'POST', body: JSON.stringify({ path: fileMinioPath, action: 'preview' }) });
    // const { url } = await response.json();
    // window.open(url, '_blank'); // Simple approach: open in new tab
     alert(`Preview logic needed for: ${fileMinioPath}\n\nImplement backend call to get pre-signed URL and handle file type preview.`);
  };

  // Function to handle confirmation
  const handleConfirm = () => {
    console.log("Review confirmed!");
    // TODO: Implement logic to send confirmation to your backend
    alert("Confirm action needed!\n\nImplement backend call to record confirmation.");
    // Redirect or show success message
  };

  // Function to handle denial
  const handleDeny = () => {
    console.log("Review denied!");
    // TODO: Implement logic to send denial to your backend
    alert("Deny action needed!\n\nImplement backend call to record denial.");
    // Redirect or show success message
  };

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
              <Button variant="outline" onClick={() => handlePreview(file.minioPath)}>Preview</Button>
              <Button onClick={() => handleDownload(file.minioPath)}>Download</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Separator className="my-8" />

      <div className="flex justify-center space-x-4">
        <Button variant="destructive" size="lg" onClick={handleDeny}>Negar</Button>
        <Button size="lg" onClick={handleConfirm}>Confirmar</Button>
      </div>

      <div className="mt-8 text-center">
         <Link to="/" className="text-blue-500 hover:underline">Voltar para a página inicial</Link>
      </div>
    </div>
  );
};

export default ReviewFilesPage;