import { supabase } from "./supabaseClient.js";
import { setState } from "./state.js";

export async function loadProfiles() {
  const { data, error } = await supabase.from("profiles").select("id,email,role,full_name").order("email");
  if (error) { setState({ error: "Не вдалося завантажити список людей: " + error.message }); return; }
  setState({ profiles: data, error: null });
}

export async function setRole(id, role) {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) { alert("Не вдалося змінити роль: " + error.message); return; }
  loadProfiles();
}
