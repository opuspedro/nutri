import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder data for projects - replace with data fetched from your backend
const projects = [
  { id: 'projeto-alpha', name: 'Projeto Alpha' },
  { id: 'projeto-beta', name: 'Projeto Beta' },
  { id: 'projeto-gama', name: 'Projeto Gama' },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Projetos para Revisão</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">
          Selecione um projeto para revisar os arquivos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {projects.map((project) => (
          <Link key={project.id} to={`/review/${project.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 dark:text-gray-400">ID: {project.id}</p>
                {/* Add more project details here if needed */}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Index;