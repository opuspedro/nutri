import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getReviewedFiles } from "@/state/reviewState"; // Import the function that now queries files table
import { showLoading, dismissToast, showError } from "@/utils/toast";
import { cleanFileName } from "@/lib/utils"; // Import cleanFileName for display

// Define the type for reviewed files - now fetching directly from files table
interface ReviewedFile {
  id: string; // This is the file ID
  name: string;
  minio_path: string;
  created_at: string;
  status: 'confirmed' | 'denied'; // Status will be non-null for reviewed files
}

const HistoryPage = () => {
  const [reviewedFiles, setReviewedFiles] = useState<ReviewedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviewedFiles = async () => {
      setIsLoading(true);
      const loadingToastId = showLoading("Carregando histórico de revisões de arquivos...");
      try {
        // getReviewedFiles now fetches files where status is 'confirmed' or 'denied'
        const files = await getReviewedFiles();
        setReviewedFiles(files);
        console.log("Fetched reviewed files:", files); // Log fetched files
      } catch (error) {
        console.error("Failed to fetch reviewed files:", error);
        showError("Falha ao carregar histórico de revisões de arquivos.");
        setReviewedFiles([]);
      } finally {
        dismissToast(loadingToastId);
        setIsLoading(false);
      }
    };

    fetchReviewedFiles();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-100 to-blue-300 dark:from-blue-900 dark:to-blue-700 text-gray-900 dark:text-gray-100 p-4"> {/* Added gradient classes */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Histórico de Revisões de Arquivos</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">
          Arquivos que já foram revisados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {isLoading ? (
           <div className="text-center text-gray-500 dark:text-gray-400 col-span-full">
            Carregando...
          </div>
        ) : reviewedFiles.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 col-span-full">
            Nenhum arquivo revisado encontrado.
          </div>
        ) : (
          reviewedFiles.map((file) => ( // Map over files directly
            <Card key={file.id}> {/* Use file ID as key */}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                {/* Displaying the cleaned file name */}
                <CardTitle className="text-lg font-medium">
                  {cleanFileName(file.name) || 'Nome Desconhecido'} {/* Use cleanFileName */}
                </CardTitle>
                 <Badge variant={file.status === 'confirmed' ? 'default' : 'destructive'}>
                    {file.status === 'confirmed' ? 'Confirmado' : 'Negado'}
                 </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Arquivo ID: {file.id}</p> {/* Use file.id */}
                 {/* Removed: Display the path as text */}
                <p className="text-gray-500 dark:text-gray-400 text-sm">Data Criação: {new Date(file.created_at).toLocaleDateString()}</p> {/* Use file.created_at */}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="mt-8 text-center">
         <Link to="/" className="text-blue-500 hover:underline">Voltar para a lista de arquivos</Link>
      </div>
    </div>
  );
};

export default HistoryPage;