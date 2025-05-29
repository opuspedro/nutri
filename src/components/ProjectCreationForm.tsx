import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { showLoading, showSuccess, showError, dismissToast } from "@/utils/toast";
import { createProject } from "@/state/reviewState";

interface ProjectCreationFormProps {
  onProjectCreated: () => void; // Callback to refresh the list after creation
}

const ProjectCreationForm: React.FC<ProjectCreationFormProps> = ({ onProjectCreated }) => {
  const [projectName, setProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      showError("O nome do projeto não pode estar vazio.");
      return;
    }

    setIsCreating(true);
    const loadingToastId = showLoading(`Criando projeto "${projectName}"...`);

    try {
      const newProject = await createProject(projectName);
      if (newProject) {
        showSuccess(`Projeto "${newProject.name}" criado com sucesso! ID: ${newProject.id}`);
        setProjectName(""); // Clear the input field
        onProjectCreated(); // Call the callback to refresh the list
      } else {
         // This case might happen if insert is successful but select returns no data (less common with .select())
         showError("Projeto criado, mas não foi possível obter os detalhes.");
         setProjectName(""); // Clear the input field
         onProjectCreated(); // Still try to refresh
      }
    } catch (error: any) {
      console.error("Error creating project:", error);
      showError(error.message || "Falha ao criar projeto.");
    } finally {
      dismissToast(loadingToastId);
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mb-8">
      <CardHeader>
        <CardTitle>Criar Novo Resultado</CardTitle>
        <CardDescription>Adicione um novo resultado para revisão.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="projectName">Nome do Resultado</Label>
            <Input
              id="projectName"
              placeholder="Ex: Consultoria de Marketing Q3"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isCreating}
            />
          </div>
          <Button type="submit" disabled={isCreating || !projectName.trim()}>
            {isCreating ? "Criando..." : "Criar Resultado"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProjectCreationForm;