import { supabase } from "./supabaseClient.js";
import { state, setState, displayName } from "./state.js";

export async function loadTimeEntries() {
  const { data, error } = await supabase.from("time_entries").select("*").order("date", { ascending:false }).order("created_at", { ascending:false });
  if (error) { setState({ error: "Не вдалося завантажити години: " + error.message }); return; }
  setState({ timeEntries: data, error: null });
}

export async function addTimeEntry(data) {
  setState({ hoursSaving: true, hoursFormError: null });
  const { error } = await supabase.from("time_entries").insert([{
    ...data, user_id: state.user.id, author_email: state.user.email, author_name: displayName(),
  }]);
  if (error) { setState({ hoursSaving: false, hoursFormError: "Не вдалося зберегти. Спробуйте ще раз." }); return; }
  setState({ hoursSaving: false, showHoursForm: false });
  loadTimeEntries();
}

export async function updateTimeEntry(id, patch) {
  const { error } = await supabase.from("time_entries").update(patch).eq("id", id);
  if (error) { alert("Не вдалося оновити: " + error.message); return; }
  loadTimeEntries();
}

export async function confirmTimeEntry(id) { updateTimeEntry(id, { status: "підтверджено" }); }

export async function deleteTimeEntry(id) {
  const { error } = await supabase.from("time_entries").delete().eq("id", id);
  if (error) { alert("Не вдалося видалити: " + error.message); return; }
  loadTimeEntries();
}

supabase.channel("time-entries-changes")
  .on("postgres_changes", { event: "*", schema: "public", table: "time_entries" }, () => { if (state.user) loadTimeEntries(); })
  .subscribe();
