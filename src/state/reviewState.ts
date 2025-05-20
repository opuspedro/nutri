// Placeholder data for all possible projects and their files
export const allProjects = {
  'projeto-alpha': {
    name: 'Projeto Alpha',
    files: [
      { id: 'file1-alpha', name: 'Relatorio_Alpha_Final.pdf', minioPath: 'path/to/alpha/report.pdf' },
      { id: 'file2-alpha', name: 'Apresentacao_Alpha.pptx', minioPath: 'path/to/alpha/presentation.pptx' },
    ]
  },
  'projeto-beta': {
    name: 'Projeto Beta',
    files: [
      { id: 'file1-beta', name: 'Dados_Beta.xlsx', minioPath: 'path/to/beta/data.xlsx' },
      { id: 'file2-beta', name: 'Analise_Beta.docx', minioPath: 'path/to/beta/analysis.docx' },
      { id: 'file3-beta', name: 'Graficos_Beta.png', minioPath: 'path/to/beta/charts.png' },
    ]
  },
   'projeto-gama': {
    name: 'Projeto Gama',
    files: [
      { id: 'file1-gama', name: 'Relatorio_Gama.pdf', minioPath: 'path/to/gama/report.pdf' },
    ]
  },
};

// Simple in-memory state for reviewed projects
// In a real app, this would be stored in a database
const reviewedStatus: { [projectId: string]: 'confirmed' | 'denied' } = {};

export const markAsReviewed = (projectId: string, status: 'confirmed' | 'denied') => {
  reviewedStatus[projectId] = status;
  console.log(`Project ${projectId} marked as ${status}. Current reviewedStatus:`, reviewedStatus);
};

export const getPendingProjects = () => {
  return Object.keys(allProjects)
    .filter(projectId => reviewedStatus[projectId] === undefined)
    .map(projectId => ({ id: projectId, name: allProjects[projectId as keyof typeof allProjects].name }));
};

export const getReviewedProjects = () => {
  return Object.keys(reviewedStatus)
    .map(projectId => ({
      id: projectId,
      name: allProjects[projectId as keyof typeof allProjects]?.name || projectId, // Use name from allProjects if available
      status: reviewedStatus[projectId],
      reviewDate: new Date().toLocaleDateString(), // Simulate review date
    }));
};