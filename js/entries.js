import { supabase } from "./supabaseClient.js";
import { state, setState, displayName } from "./state.js";

export async function loadEntries() {
  const { data, error } = await supabase.from("entries").select("*, projects(name)").order("date", { ascending:false }).order("created_at", { ascending:false });
  if (error) {
    console.error("Supabase error:", error);
    setState({ error: "Не вдалося завантажити записи: " + error.message, loading: false });
    return;
  }
  setState({ entries: data, loading: false, error: null });
}

export async function saveEntry(formData) {
  setState({ saving: true, formError: null });
  const { error } = await supabase.from("entries").insert([{ ...formData, author: displayName() }]);
  if (error) {
    setState({ saving: false, formError: "Не вдалося зберегти запис. Спробуйте ще раз." });
    return;
  }
  setState({ saving: false, showForm: false });
  loadEntries();
}

export async function deleteEntry(id) {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) { alert("Не вдалося видалити запис: " + error.message); return; }
  loadEntries();
}

supabase.channel("entries-changes")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "entries" }, () => { if (state.user) loadEntries(); })
  .on("postgres_changes", { event: "DELETE", schema: "public", table: "entries" }, () => { if (state.user) loadEntries(); })
  .subscribe();
