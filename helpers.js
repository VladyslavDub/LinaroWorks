import { lang, t } from "./i18n.js";
import { MONTHS, WEEKDAYS } from "./constants.js";

export const todayISO = () => new Date().toISOString().slice(0,10);

export const fmtLong = (iso) => {
  const d = new Date(iso+"T00:00:00");
  return `${d.getDate()} ${MONTHS[lang][d.getMonth()]}, ${WEEKDAYS[lang][d.getDay()]}`;
};

export const fmtShort = (iso) => {
  const d = new Date(iso+"T00:00:00");
  return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}`;
};

export const esc = (s) => (s||"").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

export function computeHoursMinutes(e) {
  const toMin = (tm) => { const [h,m] = tm.split(":").map(Number); return h*60+m; };
  let diff = toMin(e.check_out) - toMin(e.check_in);
  if (diff < 0) diff += 24*60;
  if (e.lunch_break) diff -= 30;
  return Math.max(diff, 0);
}

export function minutesLabel(total) {
  const h = Math.floor(total/60), m = total%60;
  return `${h} ${t("hUnit")}${m ? " " + m + " " + t("minUnit") : ""}`;
}

export function computeHoursLabel(e) { return minutesLabel(computeHoursMinutes(e)); }
