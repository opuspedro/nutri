import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getReviewedFiles } from "@/state/reviewState"; // Import the new function
import { showLoading, dismissToast, showError } from "@/utils/toast";

// Define the type for reviewed files based on the Supabase query result
interface ReviewedFile {
  id: string; // Review ID
  file_id: string; // File ID
  status: 'confirmed' | 'denied';
  reviewed_at: string;
  files: { // Details of the reviewed file from the join
    name: string;
    minio_path: string;
  } | null;
}

const HistoryPage = () => {
  const [reviewedFiles, setReviewedFiles] = useState<ReviewedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviewedFiles = async () => {
      setIsLoading(true);
      const loadingToastId = showLoading("Carregando histórico de revisões de arquivos...");
      try {
        const files = await getReviewedFiles();
        setReviewedFiles(files);
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
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
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
          reviewedFiles.map((review) => ( // Map over reviews
            <Card key={review.id}> {/* Use review ID as key */}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                {/* Displaying the file name */}
                <CardTitle className="text-lg font-medium">
                  {review.files?.name || 'Nome Desconhecido'}
                </CardTitle>
                 <Badge variant={review.status === 'confirmed' ? 'default' : 'destructive'}>
                    {review.status === 'confirmed' ? 'Confirmado' : 'Negado'}
                 </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Arquivo ID: {review.file_id}</p>
                 <p className="text-gray-500 dark:text-gray-400 text-sm truncate">Caminho: {review.files?.minio_path || 'Caminho Desconhecido'}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Data Revisão: {new Date(review.reviewed_at).toLocaleDateString()}</p>
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