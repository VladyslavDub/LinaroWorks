import { supabase } from "./supabaseClient.js";
import { state, setState } from "./state.js";
import { loadEntries } from "./entries.js";

export async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await loadProfile(session.user);
  } else {
    setState({ authChecked: true });
  }
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session && session.user.id !== (state.user && state.user.id)) {
      loadProfile(session.user);
    } else if (!session) {
      setState({ user: null, role: null, entries: [], authChecked: true, view: "today" });
    }
  });
}

export async function loadProfile(user) {
  const { data, error } = await supabase.from("profiles").select("role,email,full_name").eq("id", user.id).single();
  if (error) console.error("Profile load error:", error);
  setState({ user, role: (data && data.role) || "робітник", fullName: (data && data.full_name) || null, authChecked: true });
  loadEntries();
}

export async function signIn(email, password) {
  setState({ authBusy: true, authError: null });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { setState({ authBusy: false, authError: "Невірний email або пароль." }); return; }
  setState({ authBusy: false });
}

export async function signUp(email, password, fullName) {
  setState({ authBusy: true, authError: null });
  const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  if (error) { setState({ authBusy: false, authError: error.message }); return; }
  setState({ authBusy: false });
}

export async function signOut() {
  await supabase.auth.signOut();
}
