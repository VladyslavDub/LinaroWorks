import { supabase } from "./supabaseClient.js";
import { state, setState } from "./state.js";

export async function loadProjects() {
  const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
  if (error) { setState({ error: "Не вдалося завантажити проєкти: " + error.message }); return; }
  setState({ projects: data, error: null });
}

export async function createProject(data) {
  setState({ projectSaving: true, projectFormError: null });
  const { error } = await supabase.from("projects").insert([{ ...data, created_by: state.user.id }]);
  if (error) { setState({ projectSaving: false, projectFormError: "Не вдалося створити проєкт. Спробуйте ще раз." }); return; }
  setState({ projectSaving: false, showProjectForm: false });
  loadProjects();
}

export async function setProjectStatus(id, status) {
  const { error } = await supabase.from("projects").update({ status }).eq("id", id);
  if (error) { alert("Не вдалося оновити проєкт: " + error.message); return; }
  loadProjects();
}

export async function deleteProject(id) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) { alert("Не вдалося видалити проєкт: " + error.message); return; }
  loadProjects();
}

supabase.channel("projects-changes")
  .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => { if (state.user) loadProjects(); })
  .subscribe();
