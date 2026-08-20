import { state, setState, isForeman, displayName } from "./state.js";
import { t, tt, lang, setLang } from "./i18n.js";
import { APP_NAME, BG, CARD, INK, ORANGE, CYAN, WORK_TYPES, WORK_TYPE_LABELS, WEATHER, WEATHER_LABELS, MONTHS_NOM } from "./constants.js";
import { todayISO, fmtLong, fmtShort, esc, minutesLabel, computeHoursMinutes, computeHoursLabel } from "./helpers.js";
import { signIn, signUp, signOut } from "./auth.js";
import { saveEntry, deleteEntry } from "./entries.js";
import { addTimeEntry, updateTimeEntry, confirmTimeEntry, deleteTimeEntry, loadTimeEntries } from "./timeEntries.js";
import { loadProfiles, setRole } from "./profiles.js";
import { loadProjects, createProject, setProjectStatus, deleteProject } from "./projects.js";

const root = document.getElementById("root");

function langToggleHTML() {
  return `<button id="langToggle" style="background:rgba(127,179,211,0.12);border:1px solid rgba(127,179,211,0.3);color:${CYAN};font-size:11px;padding:5px 10px;border-radius:9999px;font-weight:600;letter-spacing:0.02em;">
    ${lang === "uk" ? "🇺🇦 UK" : "🇨🇿 CS"}
  </button>`;
}
function attachLangToggle() {
  const btn = document.getElementById("langToggle");
  if (btn) btn.onclick = () => setLang(lang === "uk" ? "cs" : "uk");
}

export function render() {
  if (!state.authChecked) return renderLoading();
  if (!state.user) return renderAuthGate();
  if (state.loading) return renderLoading();
  renderApp();
}

function renderLoading() {
  root.innerHTML = `<div style="background:${BG};min-height:100vh;display:flex;align-items:center;justify-content:center;">
    <div style="color:${CYAN};font-size:14px;" class="animate-pulse">${t("loading")}</div></div>`;
}

function renderAuthGate() {
  const isSignIn = state.authMode === "signin";
  root.innerHTML = `
    <div style="background:${BG};min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;position:relative;">
      <div style="position:absolute;top:20px;right:20px;">${langToggleHTML()}</div>
      <div style="max-width:320px;width:100%;text-align:center;">
        <div style="width:64px;height:64px;border-radius:9999px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;background:rgba(242,100,48,0.15);font-size:28px;">👷</div>
        <h1 class="font-display" style="color:#fff;font-size:26px;letter-spacing:0.03em;margin-bottom:4px;">${APP_NAME}</h1>
        <p style="color:${CYAN};opacity:0.8;font-size:14px;margin-bottom:24px;">${t("appSubtitle")}</p>

        <input id="authEmail" type="email" placeholder="${t("emailPh")}" style="width:100%;padding:12px 16px;border-radius:8px;background:${CARD};color:${INK};border:none;outline:none;font-size:14px;margin-bottom:10px;box-sizing:border-box;" />
        ${!isSignIn ? `
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <input id="authFirst" type="text" placeholder="${t("firstNamePh")}" style="flex:1;padding:12px 16px;border-radius:8px;background:${CARD};color:${INK};border:none;outline:none;font-size:14px;box-sizing:border-box;" />
          <input id="authLast" type="text" placeholder="${t("lastNamePh")}" style="flex:1;padding:12px 16px;border-radius:8px;background:${CARD};color:${INK};border:none;outline:none;font-size:14px;box-sizing:border-box;" />
        </div>` : ""}
        <input id="authPass" type="password" placeholder="${t("passwordPh")}" style="width:100%;padding:12px 16px;border-radius:8px;background:${CARD};color:${INK};border:none;outline:none;font-size:14px;margin-bottom:12px;box-sizing:border-box;" />

        ${state.authError ? `<div style="color:#ffb4b4;font-size:12px;margin-bottom:12px;">${esc(state.authError)}</div>` : ""}

        <button id="authSubmit" class="font-display" ${state.authBusy?"disabled":""} style="width:100%;padding:12px;border-radius:8px;background:${ORANGE};color:#fff;font-weight:600;letter-spacing:0.03em;border:none;font-size:14px;opacity:${state.authBusy?0.6:1};">
          ${state.authBusy ? "..." : (isSignIn ? t("signInBtn") : t("signUpBtn"))}
        </button>

        <button id="authToggle" style="margin-top:14px;background:none;border:none;color:${CYAN};opacity:0.8;font-size:13px;">
          ${isSignIn ? t("toggleToSignup") : t("toggleToSignin")}
        </button>
      </div>
    </div>`;

  attachLangToggle();
  const emailInput = document.getElementById("authEmail");
  const passInput = document.getElementById("authPass");
  const submit = () => {
    const email = emailInput.value.trim();
    const pass = passInput.value;
    if (!email || !pass) { setState({ authError: t("fillEmailPass") }); return; }
    if (isSignIn) {
      signIn(email, pass);
    } else {
      const first = document.getElementById("authFirst").value.trim();
      const last = document.getElementById("authLast").value.trim();
      if (!first || !last) { setState({ authError: t("fillNames") }); return; }
      signUp(email, pass, `${first} ${last}`);
    }
  };
  document.getElementById("authSubmit").onclick = submit;
  passInput.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
  document.getElementById("authToggle").onclick = () => setState({ authMode: isSignIn ? "signup" : "signin", authError: null });
}

function ticketHTML(e) {
  const w = WEATHER.find(x => x[0] === e.weather);
  const rot = e.id % 2 === 0 ? "-0.6deg" : "0.6deg";
  const dots = Array.from({length:16}).map(()=>`<div style="width:10px;height:10px;border-radius:9999px;background:${BG};"></div>`).join("");
  const chips = (e.work_types||[]).map(tp => `<span style="font-size:11px;padding:2px 10px;border-radius:9999px;background:rgba(242,100,48,0.12);color:#B84B22;border:1px solid rgba(242,100,48,0.3);">${esc(tt(WORK_TYPE_LABELS[tp] || [tp,tp]))}</span>`).join("");
  const deleteBtn = isForeman() ? `<button data-delete-id="${e.id}" style="margin-top:10px;width:100%;padding:7px 0;border-radius:8px;border:1px solid rgba(192,57,43,0.35);background:rgba(192,57,43,0.06);color:#C0392B;font-size:12px;">${t("deleteEntryBtn")}</button>` : "";
  const projectLabel = (e.projects && e.projects.name) || e.site || t("noProjectFallback");
  return `
  <div style="position:relative;margin-top:16px;transform:rotate(${rot});">
    <div style="position:absolute;top:-5px;left:0;right:0;display:flex;justify-content:space-around;padding:0 12px;">${dots}</div>
    <div style="background:${CARD};color:${INK};border-radius:10px;padding:16px;box-shadow:0 6px 16px rgba(0,0,0,0.25);position:relative;overflow:hidden;">
      <div style="position:absolute;top:12px;right:-8px;padding:4px 12px;font-size:11px;font-weight:700;transform:rotate(7deg);border:1.5px solid ${ORANGE};color:${ORANGE};border-radius:4px;" class="font-mono">${fmtShort(e.date)}</div>
      <div style="padding-right:64px;">
        <div class="font-mono" style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;opacity:0.5;margin-bottom:2px;">${t("navProjects")}</div>
        <div class="font-display" style="font-weight:600;font-size:15px;">${esc(projectLabel)}</div>
      </div>
      ${chips ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;">${chips}</div>` : ""}
      <p style="font-size:13.5px;line-height:1.6;margin-top:12px;opacity:0.9;white-space:pre-wrap;">${esc(e.description)}</p>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:1px solid rgba(26,26,24,0.1);">
        <div style="font-size:12px;opacity:0.6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">👤 ${esc(e.workers || t("workersFallback"))}</div>
        <div style="font-size:11px;opacity:0.5;display:flex;align-items:center;gap:8px;flex-shrink:0;margin-left:8px;">
          ${w ? `<span>${w[1]}</span>` : ""}
          <span style="font-style:italic;">${esc(e.author)}</span>
        </div>
      </div>
      ${deleteBtn}
    </div>
  </div>`;
}

function emptyStateHTML(text) {
  return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px 24px;text-align:center;">
    <div style="width:56px;height:56px;border-radius:9999px;background:rgba(127,179,211,0.12);display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:24px;">👷</div>
    <p style="color:${CYAN};opacity:0.75;font-size:14px;">${text}</p>
  </div>`;
}

function timeTicketHTML(e) {
  const canEdit = isForeman() || (e.user_id === state.user.id && e.status === "очікує");
  const pending = e.status === "очікує";
  return `
  <div style="background:${CARD};color:${INK};border-radius:10px;padding:14px 16px;margin-top:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div class="font-mono" style="font-size:12px;opacity:0.6;">${fmtShort(e.date)}${isForeman() ? "" : " · " + esc(e.author_name || e.author_email)}</div>
      <span style="font-size:11px;padding:2px 9px;border-radius:9999px;background:${pending ? "rgba(242,100,48,0.12)" : "rgba(91,140,90,0.15)"};color:${pending ? "#B84B22" : "#3F6B3E"};">${pending ? t("statusPending") : t("statusConfirmed")}</span>
    </div>

    ${canEdit ? `
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
        <input type="time" data-checkin-id="${e.id}" value="${(e.check_in||"").slice(0,5)}" style="flex:1;padding:8px 10px;border-radius:8px;border:1px solid rgba(26,26,24,0.15);font-size:13px;box-sizing:border-box;" />
        <span style="opacity:0.4;">→</span>
        <input type="time" data-checkout-id="${e.id}" value="${(e.check_out||"").slice(0,5)}" style="flex:1;padding:8px 10px;border-radius:8px;border:1px solid rgba(26,26,24,0.15);font-size:13px;box-sizing:border-box;" />
      </div>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;opacity:0.75;margin-bottom:10px;">
        <input type="checkbox" data-lunch-id="${e.id}" ${e.lunch_break ? "checked" : ""} /> ${t("lunchLabelShort")}
      </label>
    ` : `
      <div style="font-size:14px;margin-bottom:6px;">${(e.check_in||"").slice(0,5)} → ${(e.check_out||"").slice(0,5)}${e.lunch_break ? " · " + t("lunchLabelShort") : ""}</div>
    `}

    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div class="font-mono" style="font-size:13px;font-weight:600;">${computeHoursLabel(e)}</div>
      <div style="display:flex;gap:6px;">
        ${isForeman() && pending ? `<button data-confirm-id="${e.id}" style="font-size:11px;padding:5px 10px;border-radius:6px;border:1px solid rgba(91,140,90,0.4);background:rgba(91,140,90,0.1);color:#3F6B3E;">${t("confirmBtn")}</button>` : ""}
        ${isForeman() ? `<button data-deletehours-id="${e.id}" style="font-size:11px;padding:5px 10px;border-radius:6px;border:1px solid rgba(192,57,43,0.35);background:rgba(192,57,43,0.06);color:#C0392B;">🗑</button>` : ""}
      </div>
    </div>
  </div>`;
}

function hoursHTML() {
  const addBtn = `<button id="addHoursBtn" class="font-display" style="width:100%;padding:12px;border-radius:10px;background:${ORANGE};color:#fff;font-weight:600;letter-spacing:0.03em;border:none;font-size:13px;margin-bottom:4px;">${t("addHoursBtn")}</button>`;
  const searchBox = isForeman() ? `
    <input id="hoursSearchInput" type="text" value="${esc(state.hoursSearch)}" placeholder="${t("searchPh")}" style="width:100%;margin-top:12px;padding:10px 14px;border-radius:8px;border:none;background:${CARD};color:${INK};font-size:16px;box-sizing:border-box;" />` : "";

  let list = state.timeEntries;
  const q = state.hoursSearch.trim().toLowerCase();
  if (isForeman() && q) {
    list = list.filter(e => (e.author_name || "").toLowerCase().includes(q) || (e.author_email || "").toLowerCase().includes(q));
  }

  if (!list.length) return addBtn + searchBox + emptyStateHTML(t("emptyHours"));

  const months = {};
  list.forEach(e => { const monthKey = e.date.slice(0,7); (months[monthKey] = months[monthKey] || []).push(e); });
  const monthKeys = Object.keys(months).sort((a,b) => a < b ? 1 : -1);

  const monthsHTML = monthKeys.map(monthKey => {
    const entriesInMonth = months[monthKey];
    const [y, m] = monthKey.split("-").map(Number);
    const monthLabel = `${MONTHS_NOM[lang][m-1]} ${y}`;
    const monthTotal = entriesInMonth.reduce((sum, e) => sum + computeHoursMinutes(e), 0);

    const byWorker = {};
    entriesInMonth.forEach(e => { const key = e.author_name || e.author_email; (byWorker[key] = byWorker[key] || []).push(e); });
    const workerNames = Object.keys(byWorker).sort((a,b) => a.localeCompare(b, "uk"));

    const workersHTML = workerNames.map(name => {
      const wEntries = byWorker[name].sort((a,b) => a.date < b.date ? 1 : -1);
      const wTotal = wEntries.reduce((sum, e) => sum + computeHoursMinutes(e), 0);
      return `
        <div style="margin-top:14px;">
          ${isForeman() ? `<div style="display:flex;align-items:center;justify-content:space-between;padding:0 2px;margin-bottom:2px;">
            <span style="font-size:13px;font-weight:600;color:#fff;">${esc(name)}</span>
            <span class="font-mono" style="font-size:12px;color:${CYAN};opacity:0.8;">${minutesLabel(wTotal)}</span>
          </div>` : ""}
          <div class="tickets-grid">${wEntries.map(timeTicketHTML).join("")}</div>
        </div>`;
    }).join("");

    return `
      <div style="margin-top:24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span class="font-mono" style="font-size:12px;text-transform:uppercase;color:${CYAN};opacity:0.8;">${monthLabel}</span>
          <span class="font-mono" style="font-size:12px;color:${ORANGE};font-weight:600;">${t("togetherLabel")}: ${minutesLabel(monthTotal)}</span>
        </div>
        ${workersHTML}
      </div>`;
  }).join("");

  return addBtn + searchBox + monthsHTML;
}

function hoursFormHTML() {
  return `
  <div style="position:fixed;inset:0;z-index:50;display:flex;align-items:flex-end;justify-content:center;">
    <div id="hoursBackdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.55);"></div>
    <div style="position:relative;width:100%;max-width:448px;border-radius:16px 16px 0 0;padding:20px;padding-bottom:32px;background:${CARD};color:${INK};">
      <div style="width:40px;height:4px;border-radius:9999px;background:rgba(0,0,0,0.15);margin:0 auto 16px;"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <h2 class="font-display" style="font-size:18px;font-weight:600;">${t("hoursFormTitle")}</h2>
        <button id="closeHoursForm" style="background:none;border:none;font-size:18px;opacity:0.5;">✕</button>
      </div>

      <label class="font-mono" style="display:block;font-size:11px;text-transform:uppercase;opacity:0.5;margin-bottom:4px;">${t("fieldDate")}</label>
      <input id="hDate" type="date" value="${todayISO()}" max="${todayISO()}" class="font-mono" style="width:100%;margin-bottom:16px;padding:10px 12px;border-radius:8px;border:1px solid rgba(26,26,24,0.15);font-size:14px;box-sizing:border-box;" />

      <div style="display:flex;gap:10px;margin-bottom:16px;">
        <div style="flex:1;">
          <label class="font-mono" style="display:block;font-size:11px;text-transform:uppercase;opacity:0.5;margin-bottom:4px;">${t("checkInLabel")}</label>
          <input id="hCheckIn" type="time" value="08:00" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(26,26,24,0.15);font-size:14px;box-sizing:border-box;" />
        </div>
        <div style="flex:1;">
          <label class="font-mono" style="display:block;font-size:11px;text-transform:uppercase;opacity:0.5;margin-bottom:4px;">${t("checkOutLabel")}</label>
          <input id="hCheckOut" type="time" value="17:00" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(26,26,24,0.15);font-size:14px;box-sizing:border-box;" />
        </div>
      </div>

      <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:16px;">
        <input id="hLunch" type="checkbox" /> ${t("lunchLabel")}
      </label>

      ${state.hoursFormError ? `<div style="color:#C0392B;font-size:12px;margin-bottom:12px;">${esc(state.hoursFormError)}</div>` : ""}

      <button id="hoursSaveBtn" class="font-display" ${state.hoursSaving ? "disabled" : ""} style="width:100%;padding:12px;border-radius:8px;background:${ORANGE};color:#fff;font-weight:600;letter-spacing:0.03em;border:none;font-size:14px;opacity:${state.hoursSaving?0.6:1};">
        ${state.hoursSaving ? t("savingBtn") : t("saveEntryBtn")}
      </button>
    </div>
  </div>`;
}

function attachHoursFormHandlers() {
  document.getElementById("hoursBackdrop").onclick = () => setState({ showHoursForm: false });
  document.getElementById("closeHoursForm").onclick = () => setState({ showHoursForm: false });
  document.getElementById("hoursSaveBtn").onclick = () => {
    const date = document.getElementById("hDate").value;
    const check_in = document.getElementById("hCheckIn").value;
    const check_out = document.getElementById("hCheckOut").value;
    const lunch_break = document.getElementById("hLunch").checked;
    if (!date || !check_in || !check_out) { setState({ hoursFormError: t("fillDateInOut") }); return; }
    addTimeEntry({ date, check_in, check_out, lunch_break });
  };
}

function projectCardHTML(p) {
  const isDone = p.status === "завершено";
  const count = state.entries.filter(e => e.project_id === p.id).length;
  return `
  <div style="background:${CARD};color:${INK};border-radius:10px;padding:16px;margin-top:12px;opacity:${isDone ? 0.7 : 1};">
    <div style="display:flex;align-items:start;justify-content:space-between;gap:10px;">
      <div style="min-width:0;">
        <div class="font-display" style="font-weight:600;font-size:15px;">${esc(p.name)}</div>
        ${p.address ? `<div style="font-size:12px;opacity:0.6;margin-top:2px;">${esc(p.address)}</div>` : ""}
        <div class="font-mono" style="font-size:11px;opacity:0.5;margin-top:6px;">${count} ${t("entriesCountLabel")}</div>
      </div>
      <span style="font-size:11px;padding:2px 9px;border-radius:9999px;flex-shrink:0;background:${isDone ? "rgba(107,114,128,0.15)" : "rgba(91,140,90,0.15)"};color:${isDone ? "#6B7280" : "#3F6B3E"};">${isDone ? t("statusDone") : t("statusActive")}</span>
    </div>
    ${isForeman() ? `
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button data-project-toggle-id="${p.id}" data-project-toggle-status="${isDone ? "активний" : "завершено"}" style="flex:1;font-size:12px;padding:7px 0;border-radius:8px;border:1px solid rgba(127,179,211,0.35);background:rgba(127,179,211,0.08);color:${CYAN};">
        ${isDone ? t("reopenProjectBtn") : t("closeProjectBtn")}
      </button>
      <button data-project-delete-id="${p.id}" style="font-size:12px;padding:7px 12px;border-radius:8px;border:1px solid rgba(192,57,43,0.35);background:rgba(192,57,43,0.06);color:#C0392B;">🗑</button>
    </div>` : ""}
  </div>`;
}

function projectsHTML() {
  const addBtn = isForeman() ? `<button id="addProjectBtn" class="font-display" style="width:100%;padding:12px;border-radius:10px;background:${ORANGE};color:#fff;font-weight:600;letter-spacing:0.03em;border:none;font-size:13px;margin-bottom:4px;">${t("newProjectBtn")}</button>` : "";

  const active = state.projects.filter(p => p.status === "активний");
  const done = state.projects.filter(p => p.status === "завершено");

  if (!state.projects.length) return addBtn + emptyStateHTML(t("emptyProjects"));

  let html = addBtn;
  html += `<div class="tickets-grid">${active.map(projectCardHTML).join("")}</div>`;
  if (done.length) {
    html += `<div style="margin-top:24px;">
      <div class="font-mono" style="font-size:12px;text-transform:uppercase;color:${CYAN};opacity:0.6;">${t("doneProjectsTitle")}</div>
      <div class="tickets-grid">${done.map(projectCardHTML).join("")}</div>
    </div>`;
  }
  return html;
}

function projectFormHTML() {
  return `
  <div style="position:fixed;inset:0;z-index:50;display:flex;align-items:flex-end;justify-content:center;">
    <div id="projectBackdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.55);"></div>
    <div style="position:relative;width:100%;max-width:448px;border-radius:16px 16px 0 0;padding:20px;padding-bottom:32px;background:${CARD};color:${INK};">
      <div style="width:40px;height:4px;border-radius:9999px;background:rgba(0,0,0,0.15);margin:0 auto 16px;"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <h2 class="font-display" style="font-size:18px;font-weight:600;">${t("newProjectTitle")}</h2>
        <button id="closeProjectForm" style="background:none;border:none;font-size:18px;opacity:0.5;">✕</button>
      </div>

      <label class="font-mono" style="display:block;font-size:11px;text-transform:uppercase;opacity:0.5;margin-bottom:4px;">${t("fieldProjectName")}</label>
      <input id="pName" type="text" placeholder="${t("projectNamePh")}" style="width:100%;margin-bottom:16px;padding:10px 12px;border-radius:8px;border:1px solid rgba(26,26,24,0.15);font-size:14px;box-sizing:border-box;" />

      <label class="font-mono" style="display:block;font-size:11px;text-transform:uppercase;opacity:0.5;margin-bottom:4px;">${t("fieldProjectAddress")}</label>
      <input id="pAddress" type="text" placeholder="${t("projectAddressPh")}" style="width:100%;margin-bottom:8px;padding:10px 12px;border-radius:8px;border:1px solid rgba(26,26,24,0.15);font-size:14px;box-sizing:border-box;" />

      ${state.projectFormError ? `<div style="color:#C0392B;font-size:12px;margin:8px 0 12px;">${esc(state.projectFormError)}</div>` : ""}

      <button id="projectSaveBtn" class="font-display" ${state.projectSaving ? "disabled" : ""} style="width:100%;padding:12px;border-radius:8px;background:${ORANGE};color:#fff;font-weight:600;letter-spacing:0.03em;border:none;font-size:14px;margin-top:8px;opacity:${state.projectSaving?0.6:1};">
        ${state.projectSaving ? t("savingBtn") : t("saveEntryBtn")}
      </button>
    </div>
  </div>`;
}

function attachProjectFormHandlers() {
  document.getElementById("projectBackdrop").onclick = () => setState({ showProjectForm: false });
  document.getElementById("closeProjectForm").onclick = () => setState({ showProjectForm: false });
  document.getElementById("projectSaveBtn").onclick = () => {
    const name = document.getElementById("pName").value.trim();
    const address = document.getElementById("pAddress").value.trim();
    if (!name) { setState({ projectFormError: t("fillProjectName") }); return; }
    createProject({ name, address: address || null });
  };
}

function adminHTML() {
  if (!state.profiles.length) return emptyStateHTML(t("loadingPeople"));
  const rows = state.profiles.map(p => {
    const isMe = state.user && p.id === state.user.id;
    const foreman = p.role === "бригадир";
    return `
    <div style="background:${CARD};color:${INK};border-radius:10px;padding:14px 16px;margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
      <div style="min-width:0;">
        <div style="font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.full_name || p.email)}${isMe ? " " + t("adminYou") : ""}</div>
        <div class="font-mono" style="font-size:11px;opacity:0.55;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.email)} · ${foreman ? t("roleForeman") : t("roleWorker")}</div>
      </div>
      <button data-role-id="${p.id}" data-role-next="${foreman ? "робітник" : "бригадир"}" style="flex-shrink:0;font-size:12px;padding:7px 12px;border-radius:8px;border:1px solid ${foreman ? "rgba(192,57,43,0.35)" : "rgba(242,100,48,0.4)"};background:${foreman ? "rgba(192,57,43,0.06)" : "rgba(242,100,48,0.1)"};color:${foreman ? "#C0392B" : "#B84B22"};">
        ${foreman ? t("adminDemote") : t("adminMakeForeman")}
      </button>
    </div>`;
  }).join("");
  return `<div class="tickets-grid" style="margin-top:8px;">${rows}</div>`;
}

function renderApp() {
  const todayEntries = state.entries.filter(e => e.date === todayISO());
  const groups = {};
  state.entries.forEach(e => { (groups[e.date] = groups[e.date] || []).push(e); });
  const groupedDates = Object.keys(groups).sort((a,b) => a < b ? 1 : -1);

  let contentHTML = "";
  if (state.view === "today") {
    contentHTML = todayEntries.length === 0
      ? emptyStateHTML(t("emptyToday"))
      : `<div class="tickets-grid">${todayEntries.map(ticketHTML).join("")}</div>`;
  } else if (state.view === "journal") {
    contentHTML = groupedDates.length === 0
      ? emptyStateHTML(t("emptyJournal"))
      : groupedDates.map(date => `
        <div style="margin-top:24px;">
          <div class="font-mono" style="font-size:12px;text-transform:uppercase;color:${CYAN};opacity:0.8;">
            ${fmtLong(date)} <span style="opacity:0.5;">· ${groups[date].length}</span>
          </div>
          <div class="tickets-grid">${groups[date].map(ticketHTML).join("")}</div>
        </div>`).join("");
  } else if (state.view === "projects") {
    contentHTML = projectsHTML();
  } else if (state.view === "hours") {
    contentHTML = hoursHTML();
  } else if (state.view === "admin") {
    contentHTML = adminHTML();
  }

  const navItems = [
    ["projects", "🏗️", t("navProjects")],
    ["today", "📋", t("navToday")],
    ["journal", "📖", t("navJournal")],
    ["hours", "⏱️", t("navHours")],
  ];
  if (isForeman()) navItems.push(["admin", "🧑‍🤝‍🧑", t("navPeople")]);

  const navHTML = navItems.map(([key, icon, label]) => `
    <button data-tab="${key}" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 0;background:none;border:none;">
      <span style="font-size:18px;opacity:${state.view===key?1:0.55};">${icon}</span>
      <span style="font-size:11px;color:${state.view===key?ORANGE:CYAN};opacity:${state.view===key?1:0.55};">${label}</span>
    </button>`).join("");

  root.innerHTML = `
  <div style="background:${BG};min-height:100vh;background-image:linear-gradient(rgba(127,179,211,0.09) 1px, transparent 1px),linear-gradient(90deg, rgba(127,179,211,0.09) 1px, transparent 1px);background-size:26px 26px;position:relative;">
    <div class="app-shell" style="min-height:100vh;position:relative;display:flex;flex-direction:column;">

      <div style="position:sticky;top:0;z-index:20;padding:24px 20px 16px;background:rgba(15,35,56,0.92);backdrop-filter:blur(6px);">
        <div class="header-row" style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span>👷</span>
              <h1 class="font-display app-title" style="color:#fff;font-size:20px;letter-spacing:0.03em;">${APP_NAME}</h1>
            </div>
            <p class="font-mono" style="color:${CYAN};opacity:0.75;font-size:12px;margin-top:2px;">${fmtLong(todayISO())} · ${isForeman() ? t("roleForeman") : t("roleWorker")}</p>
          </div>
          <div class="header-actions" style="display:flex;align-items:center;gap:10px;">
            ${langToggleHTML()}
            <div style="width:36px;height:36px;border-radius:9999px;background:rgba(242,100,48,0.18);color:${ORANGE};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;" title="${esc(displayName())}">
              ${esc(displayName().slice(0,1).toUpperCase())}
            </div>
            <button id="signOutBtn" style="background:none;border:none;color:${CYAN};opacity:0.6;font-size:11px;">${t("signOut")}</button>
          </div>
        </div>
        ${state.error ? `<div style="margin-top:10px;background:#C0392B;color:#fff;font-size:12px;padding:8px 12px;border-radius:8px;">${esc(state.error)}</div>` : ""}
      </div>

      <div class="content-safe" style="flex:1;padding:0 20px;">${contentHTML}</div>

      ${isForeman() && (state.view === "today" || state.view === "journal") ? `<button id="fabBtn" class="fab-safe" style="position:absolute;z-index:30;border-radius:9999px;background:${ORANGE};width:56px;height:56px;right:20px;box-shadow:0 8px 20px rgba(0,0,0,0.35);border:none;color:#fff;font-size:26px;">+</button>` : ""}

      <div style="position:fixed;bottom:0;left:0;right:0;z-index:20;display:flex;justify-content:center;">
        <div class="app-shell safe-bottom" style="width:100%;display:flex;flex-wrap:wrap;background:rgba(15,35,56,0.96);border-top:1px solid rgba(127,179,211,0.15);backdrop-filter:blur(6px);">
          ${navHTML}
        </div>
      </div>

      ${state.showForm ? formHTML() : ""}
      ${state.showHoursForm ? hoursFormHTML() : ""}
      ${state.showProjectForm ? projectFormHTML() : ""}
    </div>
  </div>`;

  attachLangToggle();

  const fab = document.getElementById("fabBtn");
  if (fab) fab.onclick = () => setState({ showForm: true, formError: null });

  document.getElementById("signOutBtn").onclick = signOut;

  document.querySelectorAll("[data-tab]").forEach(btn => {
    btn.onclick = () => {
      const tab = btn.dataset.tab;
      hoursSearchActive = false;
      setState({ view: tab });
      if (tab === "admin") loadProfiles();
      if (tab === "hours") loadTimeEntries();
      if (tab === "projects") loadProjects();
    };
  });

  document.querySelectorAll("[data-delete-id]").forEach(btn => {
    btn.onclick = () => { if (confirm(t("confirmDeleteEntry"))) deleteEntry(Number(btn.dataset.deleteId)); };
  });

  document.querySelectorAll("[data-role-id]").forEach(btn => {
    btn.onclick = () => setRole(btn.dataset.roleId, btn.dataset.roleNext);
  });

  const addHoursBtn = document.getElementById("addHoursBtn");
  if (addHoursBtn) addHoursBtn.onclick = () => setState({ showHoursForm: true, hoursFormError: null });

  const hoursSearchInput = document.getElementById("hoursSearchInput");
  if (hoursSearchInput) {
    hoursSearchInput.oninput = (e) => { hoursSearchActive = true; state.hoursSearch = e.target.value; render(); };
    if (hoursSearchActive) {
      hoursSearchInput.focus();
      hoursSearchInput.setSelectionRange(hoursSearchInput.value.length, hoursSearchInput.value.length);
    }
  }

  document.querySelectorAll("[data-checkin-id]").forEach(inp => {
    inp.onchange = () => updateTimeEntry(Number(inp.dataset.checkinId), { check_in: inp.value });
  });
  document.querySelectorAll("[data-checkout-id]").forEach(inp => {
    inp.onchange = () => updateTimeEntry(Number(inp.dataset.checkoutId), { check_out: inp.value });
  });
  document.querySelectorAll("[data-lunch-id]").forEach(inp => {
    inp.onchange = () => updateTimeEntry(Number(inp.dataset.lunchId), { lunch_break: inp.checked });
  });
  document.querySelectorAll("[data-confirm-id]").forEach(btn => {
    btn.onclick = () => confirmTimeEntry(Number(btn.dataset.confirmId));
  });
  document.querySelectorAll("[data-deletehours-id]").forEach(btn => {
    btn.onclick = () => { if (confirm(t("confirmDeleteHours"))) deleteTimeEntry(Number(btn.dataset.deletehoursId)); };
  });

  const addProjectBtn = document.getElementById("addProjectBtn");
  if (addProjectBtn) addProjectBtn.onclick = () => setState({ showProjectForm: true, projectFormError: null });

  document.querySelectorAll("[data-project-toggle-id]").forEach(btn => {
    btn.onclick = () => setProjectStatus(Number(btn.dataset.projectToggleId), btn.dataset.projectToggleStatus);
  });
  document.querySelectorAll("[data-project-delete-id]").forEach(btn => {
    btn.onclick = () => { if (confirm(t("confirmDeleteProject"))) deleteProject(Number(btn.dataset.projectDeleteId)); };
  });

  if (state.showForm) attachFormHandlers();
  if (state.showHoursForm) attachHoursFormHandlers();
  if (state.showProjectForm) attachProjectFormHandlers();
}

let formState = { date: todayISO(), projectId: null, weather: "sun", workTypes: [], workers: "", description: "" };
let hoursSearchActive = false;

function formHTML() {
  const activeProjects = state.projects.filter(p => p.status === "активний");

  if (!activeProjects.length) {
    return `
    <div style="position:fixed;inset:0;z-index:50;display:flex;align-items:flex-end;justify-content:center;">
      <div id="backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.55);"></div>
      <div style="position:relative;width:100%;max-width:448px;border-radius:16px 16px 0 0;padding:20px;padding-bottom:32px;background:${CARD};color:${INK};text-align:center;">
        <div style="width:40px;height:4px;border-radius:9999px;background:rgba(0,0,0,0.15);margin:0 auto 16px;"></div>
        <p style="font-size:14px;opacity:0.8;margin-bottom:16px;">${t("needActiveProject")}</p>
        <button id="goToProjectsBtn" class="font-display" style="width:100%;padding:12px;border-radius:8px;background:${ORANGE};color:#fff;font-weight:600;letter-spacing:0.03em;border:none;font-size:14px;">${t("newProjectBtn")}</button>
        <button id="closeForm" style="width:100%;margin-top:10px;background:none;border:none;color:${INK};opacity:0.5;font-size:13px;padding:8px;">✕</button>
      </div>
    </div>`;
  }

  const projectOptions = activeProjects.map(p => `<option value="${p.id}" ${formState.projectId === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("");

  const weatherBtns = WEATHER.map(([key,emoji]) => `
    <button data-weather="${key}" style="flex:1 1 64px;min-width:64px;padding:10px 0;border-radius:8px;border:1px solid ${formState.weather===key?ORANGE:'rgba(26,26,24,0.15)'};background:${formState.weather===key?'rgba(242,100,48,0.1)':'transparent'};display:flex;flex-direction:column;align-items:center;gap:2px;">
      <span style="font-size:16px;">${emoji}</span><span style="font-size:10px;opacity:${formState.weather===key?1:0.6};color:${INK};">${esc(tt(WEATHER_LABELS[key]))}</span>
    </button>`).join("");

  const typeChips = WORK_TYPES.map(tp => `
    <button data-type="${esc(tp)}" style="font-size:12px;padding:4px 10px;border-radius:9999px;border:1px solid ${formState.workTypes.includes(tp)?ORANGE:'rgba(26,26,24,0.15)'};background:${formState.workTypes.includes(tp)?'rgba(242,100,48,0.12)':'transparent'};color:${formState.workTypes.includes(tp)?'#B84B22':INK};">${esc(tt(WORK_TYPE_LABELS[tp] || [tp,tp]))}</button>`).join("");

  return `
  <div style="position:fixed;inset:0;z-index:50;display:flex;align-items:flex-end;justify-content:center;">
    <div id="backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.55);"></div>
    <div style="position:relative;width:100%;max-width:448px;border-radius:16px 16px 0 0;padding:20px;padding-bottom:32px;max-height:88vh;overflow-y:auto;background:${CARD};color:${INK};">
      <div style="width:40px;height:4px;border-radius:9999px;background:rgba(0,0,0,0.15);margin:0 auto 16px;"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <h2 class="font-display" style="font-size:18px;font-weight:600;">${t("newEntryTitle")}</h2>
        <button id="closeForm" style="background:none;border:none;font-size:18px;opacity:0.5;">✕</button>
      </div>

      <label class="font-mono" style="display:block;font-size:11px;text-transform:uppercase;opacity:0.5;margin-bottom:4px;">${t("fieldDate")}</label>
      <input id="fDate" type="date" value="${formState.date}" max="${todayISO()}" class="font-mono" style="width:100%;margin-bottom:16px;padding:10px 12px;border-radius:8px;border:1px solid rgba(26,26,24,0.15);font-size:14px;box-sizing:border-box;" />

      <label class="font-mono" style="display:block;font-size:11px;text-transform:uppercase;opacity:0.5;margin-bottom:4px;">${t("navProjects")}</label>
      <select id="fProject" style="width:100%;margin-bottom:16px;padding:10px 12px;border-radius:8px;border:1px solid rgba(26,26,24,0.15);font-size:14px;box-sizing:border-box;background:#fff;">${projectOptions}</select>

      <label class="font-mono" style="display:block;font-size:11px;text-transform:uppercase;opacity:0.5;margin-bottom:8px;">${t("fieldWeather")}</label>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">${weatherBtns}</div>

      <label class="font-mono" style="display:block;font-size:11px;text-transform:uppercase;opacity:0.5;margin-bottom:8px;">${t("fieldWorkTypes")}</label>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">${typeChips}</div>

      <label class="font-mono" style="display:block;font-size:11px;text-transform:uppercase;opacity:0.5;margin-bottom:4px;">${t("fieldWorkers")}</label>
      <input id="fWorkers" type="text" value="${esc(formState.workers)}" placeholder="${t("workersPh")}" style="width:100%;margin-bottom:16px;padding:10px 12px;border-radius:8px;border:1px solid rgba(26,26,24,0.15);font-size:14px;box-sizing:border-box;" />

      <label class="font-mono" style="display:block;font-size:11px;text-transform:uppercase;opacity:0.5;margin-bottom:4px;">${t("fieldDescription")}</label>
      <textarea id="fDesc" rows="4" placeholder="${t("descPh")}" style="width:100%;margin-bottom:8px;padding:10px 12px;border-radius:8px;border:1px solid rgba(26,26,24,0.15);font-size:14px;box-sizing:border-box;resize:none;">${esc(formState.description)}</textarea>

      ${state.formError ? `<div style="color:#C0392B;font-size:12px;margin-bottom:12px;">${state.formError}</div>` : ""}

      <button id="saveBtn" class="font-display" ${state.saving ? "disabled" : ""} style="width:100%;padding:12px;border-radius:8px;background:${ORANGE};color:#fff;font-weight:600;letter-spacing:0.03em;border:none;font-size:14px;margin-top:8px;opacity:${state.saving?0.6:1};">
        ${state.saving ? t("savingBtn") : t("saveEntryBtn")}
      </button>
    </div>
  </div>`;
}

function attachFormHandlers() {
  document.getElementById("backdrop").onclick = () => setState({ showForm: false });
  document.getElementById("closeForm").onclick = () => setState({ showForm: false });

  const goToProjects = document.getElementById("goToProjectsBtn");
  if (goToProjects) {
    goToProjects.onclick = () => setState({ showForm: false, view: "projects", showProjectForm: true, projectFormError: null });
    return; // немає активних проєктів — інших полів форми не існує
  }

  document.getElementById("fDate").onchange = (e) => formState.date = e.target.value;
  document.getElementById("fProject").onchange = (e) => formState.projectId = Number(e.target.value);
  document.getElementById("fWorkers").oninput = (e) => formState.workers = e.target.value;
  document.getElementById("fDesc").oninput = (e) => formState.description = e.target.value;

  if (formState.projectId === null) {
    const sel = document.getElementById("fProject");
    formState.projectId = Number(sel.value);
  }

  document.querySelectorAll("[data-weather]").forEach(btn => {
    btn.onclick = () => { formState.weather = btn.dataset.weather; render(); };
  });
  document.querySelectorAll("[data-type]").forEach(btn => {
    btn.onclick = () => {
      const tp = btn.dataset.type;
      formState.workTypes = formState.workTypes.includes(tp) ? formState.workTypes.filter(x=>x!==tp) : [...formState.workTypes, tp];
      render();
    };
  });

  document.getElementById("saveBtn").onclick = () => {
    if (!formState.projectId || !formState.description.trim()) { setState({ formError: t("fillRequired") }); return; }
    saveEntry({
      date: formState.date,
      project_id: formState.projectId,
      weather: formState.weather,
      work_types: formState.workTypes,
      workers: formState.workers.trim(),
      description: formState.description.trim(),
    });
    formState = { date: todayISO(), projectId: null, weather: "sun", workTypes: [], workers: "", description: "" };
  };
}
