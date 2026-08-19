import { render } from "./render.js";

export let state = {
  authChecked: false,
  user: null,
  role: null,
  fullName: null,
  loading: true,
  entries: [],
  profiles: [],
  timeEntries: [],
  view: "today",
  showForm: false,
  saving: false,
  error: null,
  formError: null,
  showHoursForm: false,
  hoursSaving: false,
  hoursFormError: null,
  hoursSearch: "",
  authMode: "signin",
  authError: null,
  authBusy: false,
};

export function setState(patch) {
  state = { ...state, ...patch };
  render();
}

export const isForeman = () => state.role === "бригадир";
export const displayName = () => state.fullName || state.user.email;
