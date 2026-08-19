import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const configured = !!(
  window.SUPABASE_URL && window.SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
  window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
);

export const supabase = createClient(
  window.SUPABASE_URL || "https://placeholder.supabase.co",
  window.SUPABASE_ANON_KEY || "placeholder"
);
