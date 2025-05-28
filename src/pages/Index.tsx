import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPendingProjects } from "@/state/reviewState";

const Index = () => {
  const [pendingProjects, setPendingProjects] = useState<{ id: string; name: string; }[]>([]);

  useEffect(() => {
    // Fetch pending projects when the component mounts
    setPendingProjects(getPendingProjects());
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Resultados para Revisão</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">
          Selecione um resultado para revisar os arquivos.
        </p>
        <div className="mt-6">
          <Link to="/history">
            <Button variant="outline">Ver Histórico de Revisões</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {pendingProjects.length === 0 ? (
           <div className="text-center text-gray-500 dark:text-gray-400 col-span-full">
            Nenhum resultado pendente para revisão.
          </div>
        ) : (
          pendingProjects.map((project) => (
            <Link key={project.id} to={`/review/${project.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  {/* Displaying the project name with "Consultoria" prefix */}
                  <CardTitle>Consultoria {project.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 dark:text-gray-400">ID: {project.id}</p>
                  {/* Add more project details here if needed */}
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