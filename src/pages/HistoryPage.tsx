import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getReviewedProjects } from "@/state/reviewState";

const HistoryPage = () => {
  const [reviewedProjects, setReviewedProjects] = useState<{ id: string; name: string; status: 'confirmed' | 'denied'; reviewDate: string; }[]>([]);

  useEffect(() => {
    // Fetch reviewed projects when the component mounts
    setReviewedProjects(getReviewedProjects());
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Histórico de Revisões</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">
          Resultados que já foram revisados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {reviewedProjects.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 col-span-full">
            Nenhum resultado revisado encontrado.
          </div>
        ) : (
          reviewedProjects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                {/* Displaying the project name with "Consultoria" prefix */}
                <CardTitle className="text-lg font-medium">
                  Consultoria {project.name}
                </CardTitle>
                 <Badge variant={project.status === 'confirmed' ? 'default' : 'destructive'}>
                    {project.status === 'confirmed' ? 'Confirmado' : 'Negado'}
                 </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 dark:text-gray-400 text-sm">ID: {project.id}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Data: {project.reviewDate}</p>
                {/* Add more history details here if needed */}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="mt-8 text-center">
         <Link to="/" className="text-blue-500 hover:underline">Voltar para a lista de resultados</Link>
      </div>
    </div>
  );
};

export default HistoryPage;