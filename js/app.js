import { configured } from "./supabaseClient.js";
import { BG } from "./constants.js";
import { render } from "./render.js";
import { initAuth } from "./auth.js";

const root = document.getElementById("root");

if (!configured) {
  root.innerHTML = `
    <div style="background:${BG};min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;color:#fff;text-align:center;font-family:sans-serif;">
      <div style="max-width:360px;">
        <h1 style="font-size:20px;margin-bottom:12px;">⚠️ Налаштування не завершено</h1>
        <p style="font-size:14px;opacity:0.8;line-height:1.5;">
          Файл <code>config.js</code> ще містить приклад-заповнювачі замість справжніх URL і ключа Supabase.
          Відкрий config.js і встав свої дані з розділу Settings → API у Supabase.
        </p>
      </div>
    </div>`;
} else {
  render();
  initAuth();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(()=>{}));
  }
}
