import { render } from "./render.js";

const STRINGS = {
  appSubtitle: ["Щоденник робіт на об'єкті","Deník prací na stavbě"],
  emailPh: ["Email","Email"],
  firstNamePh: ["Ім'я","Jméno"],
  lastNamePh: ["Прізвище","Příjmení"],
  passwordPh: ["Пароль","Heslo"],
  signInBtn: ["УВІЙТИ","PŘIHLÁSIT SE"],
  signUpBtn: ["ЗАРЕЄСТРУВАТИСЯ","REGISTROVAT"],
  toggleToSignup: ["Немає акаунту? Зареєструватися","Nemáte účet? Zaregistrujte se"],
  toggleToSignin: ["Вже є акаунт? Увійти","Už máte účet? Přihlaste se"],
  fillEmailPass: ["Заповніть email і пароль.","Vyplňte email a heslo."],
  fillNames: ["Заповніть ім'я і прізвище.","Vyplňte jméno a příjmení."],
  loading: ["Завантаження...","Načítání..."],
  navToday: ["Сьогодні","Dnes"],
  navJournal: ["Журнал","Deník"],
  navHours: ["Години","Hodiny"],
  navPeople: ["Люди","Lidé"],
  roleForeman: ["бригадир","mistr"],
  roleWorker: ["робітник","dělník"],
  signOut: ["Вийти","Odhlásit"],
  newEntryTitle: ["НОВИЙ ЗАПИС","NOVÝ ZÁZNAM"],
  fieldDate: ["Дата","Datum"],
  fieldSite: ["Об'єкт / ділянка","Objekt / úsek"],
  sitePh: ["Напр. Корпус 2, 3-й поверх","Např. Budova 2, 3. patro"],
  fieldWeather: ["Погода","Počasí"],
  fieldWorkTypes: ["Види робіт","Druh prací"],
  fieldWorkers: ["Склад бригади","Složení čety"],
  workersPh: ["Напр. Іванов, Петренко + 3 підсобники","Např. Novák, Svoboda + 3 pomocníci"],
  fieldDescription: ["Що зроблено","Co bylo uděláno"],
  descPh: ["Опишіть обсяги та результат робіт за день...","Popište rozsah a výsledek prací za den..."],
  fillRequired: ["Заповніть об'єкт і опис виконаних робіт.","Vyplňte objekt a popis prací."],
  saveEntryBtn: ["ЗБЕРЕГТИ ЗАПИС","ULOŽIT ZÁZNAM"],
  savingBtn: ["ЗБЕРЕЖЕННЯ...","UKLÁDÁNÍ..."],
  emptyToday: ["Записів на сьогодні ще немає.","Dnes zatím žádné záznamy."],
  emptyJournal: ["Журнал поки порожній.","Deník je zatím prázdný."],
  emptyHours: ["Записів про години ще немає.","Zatím žádné záznamy o hodinách."],
  deleteEntryBtn: ["🗑 Видалити запис","🗑 Smazat záznam"],
  confirmDeleteEntry: ["Точно видалити цей запис? Це не можна скасувати.","Opravdu smazat tento záznam? Nelze vrátit zpět."],
  workersFallback: ["склад не вказано","složení neuvedeno"],
  addHoursBtn: ["+ ДОДАТИ ГОДИНИ","+ PŘIDAT HODINY"],
  searchPh: ["Пошук по імені...","Hledat podle jména..."],
  hoursFormTitle: ["ГОДИНИ РОБОТИ","PRACOVNÍ DOBA"],
  checkInLabel: ["Прихід","Příchod"],
  checkOutLabel: ["Вихід","Odchod"],
  lunchLabel: ["Була обідня перерва (−30 хв від годин)","Byla polední přestávka (−30 min)"],
  lunchLabelShort: ["Обідня перерва (−30 хв)","Polední přestávka (−30 min)"],
  fillDateInOut: ["Заповніть дату, прихід і вихід.","Vyplňte datum, příchod a odchod."],
  statusPending: ["очікує","čeká"],
  statusConfirmed: ["підтверджено","potvrzeno"],
  confirmBtn: ["Підтвердити","Potvrdit"],
  confirmDeleteHours: ["Точно видалити цей запис годин?","Opravdu smazat tento záznam o hodinách?"],
  togetherLabel: ["Разом","Celkem"],
  hUnit: ["год","h"],
  minUnit: ["хв","min"],
  adminYou: ["(ви)","(vy)"],
  adminMakeForeman: ["Зробити бригадиром","Udělat mistrem"],
  adminDemote: ["Понизити","Snížit"],
  loadingPeople: ["Завантаження списку людей...","Načítání seznamu lidí..."],
};

export let lang = localStorage.getItem("linaro-lang") || "uk";

export function t(key) {
  const pair = STRINGS[key];
  if (!pair) return key;
  return lang === "cs" ? pair[1] : pair[0];
}

export function tt(pair) { return lang === "cs" ? pair[1] : pair[0]; }

export function setLang(l) {
  lang = l;
  localStorage.setItem("linaro-lang", l);
  render();
}
