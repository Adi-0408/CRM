import Project from '@/models/Project';
import Task from '@/models/Task';

/**
 * Recalculates and updates the dynamic progress and status of a project
 * Progress % = (Completed Tasks / Total Linked Tasks) * 100
 */
export async function recalculateProjectProgress(projectId: string): Promise<any> {
  if (!projectId) return null;

  try {
    const projectTasks = await Task.find({ project: projectId });
    const total = projectTasks.length;
    const completed = projectTasks.filter((t: any) => t.status === 'completed').length;

    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const currentProject = await Project.findById(projectId);
    if (!currentProject) return null;

    let nextStatus = currentProject.status;
    // Automatic lifecycle transition based on task deliverables
    if (progress === 100 && total > 0) {
      if (currentProject.status !== 'completed') {
        nextStatus = 'completed';
      }
    } else if (progress > 0) {
      if (currentProject.status === 'planning') {
        nextStatus = 'in_progress';
      }
    }

    const updated = await Project.findByIdAndUpdate(
      projectId,
      { progress, status: nextStatus },
      { new: true }
    );
    return updated;
  } catch (err) {
    console.error(`Error recalculating progress for project ${projectId}:`, err);
    return null;
  }
}
