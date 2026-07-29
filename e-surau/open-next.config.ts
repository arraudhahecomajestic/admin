import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Konfigurasi lalai — sesuai untuk kebanyakan aplikasi Next.js.
  // Cache incremental boleh ditambah kemudian (R2/KV) jika perlu.
});
