import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your App</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Start building your amazing project here!
        </p>
        {/* Add a link/button to the new review page */}
        <Link to="/review">
          <Button size="lg">Ir para Revisão de Arquivos</Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;