import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { showLoading, showSuccess, showError, dismissToast } from "@/utils/toast";
import { markFileAsReviewed, getFileById } from "@/state/reviewState"; // Import file-based functions
import { Download, Eye, EyeOff, RefreshCw } from "lucide-react"; // Import icons, including RefreshCw
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client
import { cleanFileName } from "@/lib/utils"; // Import the utility function

// Define the type for a single file
interface ReviewFile {
  id: string; // This is the file ID
  name: string;
  minio_path: string;
  created_at: string;
}

// Define a type for the data fetched from Google Sheets
// Now expecting an object with header and row
interface SheetData {
  header: string[]; // Array of column headers
  row: string[]; // Array of values for the found row
}


const ReviewFilePage = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [fileToReview, setFileToReview] = useState<ReviewFile | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(true); // Loading state for the file
  const [sheetData, setSheetData] = useState<SheetData | null>(null); // State for sheet data
  const [isLoadingSheetData, setIsLoadingSheetData] = useState(false); // Loading state for sheet data
  const [downloading, setDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // State to control preview visibility
  const [confirming, setConfirming] = useState(false);
  const [denying, setDenying] = useState(false);
  const [regenerating, setRegenerating] = useState(false); // State for PDF regeneration

  // Function to fetch file details
  const fetchFile = async (id: string) => {
     setIsLoadingFile(true);
     const loadingToastId = showLoading(`Carregando arquivo ${id}...`);
     try {
       const file = await getFileById(id);
       setFileToReview(file);
       if (!file) {
            showError("Arquivo não encontrado.");
       }
       return file; // Return file data to be used for fetching sheet data
     } catch (error) {
       console.error("Failed to fetch file:", error);
       showError("Falha ao carregar arquivo.");
       setFileToReview(null);
       return null;
     } finally {
       dismissToast(loadingToastId);
       setIsLoadingFile(false);
     }
   };

   // Function to fetch sheet data
   const fetchSheetData = async (fileName: string) => {
     setIsLoadingSheetData(true);
     console.log(`Fetching sheet data for file: ${fileName}`);
     try {
       // Invoke the Edge Function
       const { data, error } = await supabase.functions.invoke('fetch-sheet-data', {
         body: { fileName: fileName },
       });

       if (error) {
         console.error("Error invoking Edge Function:", error);
         showError(`Falha ao carregar dados da planilha: ${error.message}`);
         setSheetData(null);
       } else if (data && data.data) {
         console.log("Sheet data received:", data.data);
         // Assuming data.data is { header: string[], row: string[] }
         setSheetData(data.data as SheetData);
       } else {
         console.log("Edge Function returned no data for this file.");
         setSheetData(null); // No data found for this file
       }
     } catch (error) {
       console.error("Failed to fetch sheet data:", error);
       showError("Falha ao carregar dados da planilha.");
       setSheetData(null);
     } finally {
       setIsLoadingSheetData(false);
     }
   };


  useEffect(() => {
    if (!fileId) {
      showError("ID do arquivo não fornecido.");
      setIsLoadingFile(false);
      return;
    }

    // Fetch file details first
    fetchFile(fileId).then(file => {
        // If file details are successfully fetched, then fetch sheet data
        if (file && file.name) {
            fetchSheetData(file.name);
        }
    });

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

  // Function to handle file preview - now toggles visibility
  const handlePreview = () => {
     if (!fileToReview) return;
     setShowPreview(!showPreview); // Toggle preview visibility
  };

  // Function to handle PDF regeneration
  const handleRegeneratePdf = async () => {
      if (!fileId) return;
      setRegenerating(true);
      const loadingToastId = showLoading("Solicitando regeneração do PDF...");

      try {
          // Call the new Edge Function
          const { data, error } = await supabase.functions.invoke('regenerate-pdf', {
              body: { fileId: fileId },
          });

          if (error) {
              console.error("Error invoking regenerate-pdf Edge Function:", error);
              showError(`Falha ao solicitar regeneração do PDF: ${error.message}`);
          } else {
              console.log("Regenerate PDF Edge Function response:", data);
              // Assuming the Edge Function returns a success message or status
              showSuccess("Solicitação de regeneração do PDF enviada com sucesso!");
              // Optionally, you might want to refetch file details or show a message
              // indicating the process might take time.
          }
      } catch (error: any) {
          console.error("Failed to call regenerate-pdf Edge Function:", error);
          showError(error.message || "Falha ao solicitar regeneração do PDF.");
      } finally {
          dismissToast(loadingToastId);
          setRegenerating(false);
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

  const isProcessingReview = confirming || denying || regenerating; // Include regenerating in processing state
  const isPageLoading = isLoadingFile || isLoadingSheetData || isProcessingReview;

  // Define the starting column index for displaying data (H is index 7)
  const START_COLUMN_INDEX = 7;
  // Define the column index for the person's name (C is index 1 in the B:BA range)
  const PERSON_NAME_COLUMN_INDEX = 1;


  return (
    <div className="container mx-auto p-4 max-w-4xl min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-100 to-blue-300 dark:from-blue-900 dark:to-blue-700 text-gray-900 dark:text-gray-100">
      {/* Main title: Person's Name */}
      <h1 className="text-3xl font-bold text-center mb-4">
        {isLoadingSheetData ? "Carregando nome..." : sheetData?.row?.[PERSON_NAME_COLUMN_INDEX] || "Nome Desconhecido"}
      </h1>
      {/* Secondary title: Cleaned File Name */}
      <h2 className="text-2xl text-center text-gray-700 dark:text-gray-300 mb-8">
        Arquivo: {fileToReview ? cleanFileName(fileToReview.name) : fileId}
      </h2>


      {isLoadingFile ? (
         <div className="text-center text-gray-500 dark:text-gray-400">
            Carregando arquivo...
          </div>
      ) : !fileToReview ? (
        <div className="text-center text-gray-500 dark:text-gray-400">
          Arquivo não encontrado.
        </div>
      ) : (
         <div className="space-y-6 mb-8 w-full">
            <Card key={fileToReview.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> {/* Added flex layout */}
                <div> {/* Container for title and description */}
                    <CardTitle className="text-lg font-medium truncate">ID do Arquivo: {fileToReview.id}</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400 text-sm">Criado em: {new Date(fileToReview.created_at).toLocaleDateString()}</CardDescription>
                </div>
                 {/* Preview Button - Moved here */}
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  disabled={isPageLoading} // Disable if page is loading or processing review
                  size="sm" // Make button smaller to fit header
                >
                   {showPreview ? (
                       <>
                           <EyeOff className="mr-2 h-4 w-4" /> Esconder Preview
                       </>
                   ) : (
                       <>
                           <Eye className="mr-2 h-4 w-4" /> Mostrar Preview
                       </>
                   )}
                </Button>
              </CardHeader>
              <CardContent>
                {/* Area de Preview do Arquivo */}
                {showPreview && fileToReview.minio_path ? (
                    <div className="w-full h-[600px] border rounded-md overflow-hidden">
                        <iframe
                            src={fileToReview.minio_path}
                            title={`Preview de ${fileToReview.name}`}
                            className="w-full h-full"
                            style={{ border: 'none' }}
                        >
                            Seu navegador não suporta iframes. Você pode baixar o arquivo para visualizá-lo.
                        </iframe>
                    </div>
                ) : (
                    <div className="h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded-md">
                      Clique em "Mostrar Preview" para visualizar o arquivo.
                    </div>
                )}

                <Separator className="my-6" />

                {/* Area de Dados da Planilha */}
                <h3 className="text-xl font-semibold mb-4">Dados da Planilha Associados</h3>
                {isLoadingSheetData ? (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                       Carregando dados da planilha...
                     </div>
                ) : sheetData && sheetData.header && sheetData.row ? (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                            {/* Iterate from START_COLUMN_INDEX (7 for H) */}
                            {sheetData.row.slice(START_COLUMN_INDEX).map((cellValue, index) => {
                                // Calculate the actual column index in the original row/header
                                const originalColumnIndex = START_COLUMN_INDEX + index;
                                // Ensure header exists for this column
                                if (sheetData.header.length > originalColumnIndex) {
                                    const columnName = sheetData.header[originalColumnIndex];
                                    // Only display if the cell has a value (not empty string, null, or undefined)
                                    if (cellValue !== null && cellValue !== undefined && cellValue.toString().trim() !== '') {
                                        return (
                                            <p key={originalColumnIndex}>
                                                <span className="font-semibold">{columnName}:</span> {cellValue}
                                            </p>
                                        );
                                    }
                                }
                                return null; // Don't render if no value or no header
                            })}
                            {/* Show message if no relevant data found */}
                            {sheetData.row.slice(START_COLUMN_INDEX).every(cellValue => !cellValue || cellValue.toString().trim() === '') && (
                                <p className="text-center text-gray-500 dark:text-gray-400">
                                    Nenhum dado relevante encontrado a partir da Coluna H.
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                       Nenhum dado encontrado na planilha para este arquivo.
                     </div>
                )}


              </CardContent>
              <CardFooter className="flex justify-between space-x-2"> {/* Changed to justify-between */}
                {/* Download Button */}
                <Button
                  onClick={handleDownload}
                  disabled={downloading || isPageLoading}
                  variant="outline" // Use outline variant
                >
                   <Download className="mr-2 h-4 w-4" />
                   {downloading ? "Baixando..." : "Download"}
                </Button>
                 {/* Regenerate PDF Button */}
                 <Button
                   onClick={handleRegeneratePdf}
                   disabled={regenerating || isPageLoading}
                   variant="secondary" // Use secondary variant
                 >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {regenerating ? "Refazendo..." : "Refazer PDF"}
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