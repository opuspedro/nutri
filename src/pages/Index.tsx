import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPendingFiles } from "@/state/reviewState"; // Import the new function
import { showLoading, dismissToast, showError } from "@/utils/toast";

// Define the type for pending files
interface PendingFile {
  id: string; // This is the file ID
  name: string;
  minio_path: string;
  created_at: string;
}

const Index = () => {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
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

      {/* Removed Project Creation Form */}

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
            <Link key={file.id} to={`/review-file/${file.id}`}> {/* Link to the new file review page */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">{file.name}</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400 text-sm">ID: {file.id}</CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-gray-700 dark:text-gray-300 truncate">Caminho: {file.minio_path}</p>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Criado em: {new Date(file.created_at).toLocaleDateString()}</p>
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