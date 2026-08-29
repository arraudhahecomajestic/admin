// Tukar data URL (cth dari canvas tandatangan) → Blob TANPA fetch().
// Elak isu CSP connect-src yang boleh blok fetch('data:...').
export function dataURLtoBlob(dataurl: string): Blob {
  const [head, b64] = (dataurl || "").split(",");
  const mime = head.match(/:(.*?);/)?.[1] || "image/png";
  const bin = atob(b64 || "");
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// Nombor telefon Malaysia → format antarabangsa piawai (60XXXXXXXXX), tanpa dash/ruang.
// Contoh: "0124030663" → "60124030663", "019-3509417" → "60193509417", "6019-2385485" → "60192385485".
export function noTelefon(raw: string | null | undefined): string {
  const d = (raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("60")) return d;
  if (d.startsWith("0")) return "60" + d.slice(1);
  return "60" + d;
}

// Nombor telefon → format tempatan (0XXXXXXXXX), tanpa dash/ruang. Untuk simpanan.
// "+60 19-345 6789" → "0193456789", "6012..." → "012...", "12345678" → "012345678"? (tambah 0).
export function telefonLokal(raw: string | null | undefined): string {
  let d = (raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("60")) d = d.slice(2);
  if (!d.startsWith("0")) d = "0" + d;
  return d;
}

// Nombor telefon → paparan kemas dengan dash. Mudah baca & seragam.
// "0194453411" → "019-4453411", "0342991234" → "03-42991234".
export function telefonPapar(raw: string | null | undefined): string {
  const d = telefonLokal(raw);
  if (!d) return "—";
  if (d.startsWith("01") && d.length >= 10) return d.slice(0, 3) + "-" + d.slice(3); // mobil 01X
  if (d.startsWith("0")) return d.slice(0, 2) + "-" + d.slice(2); // talian tetap 0X
  return d;
}

// Nama → huruf besar setiap perkataan (Title Case), penghubung bin/binti kekal huruf kecil.
// "NOR ALWANI BINTI MOHAMAD" → "Nor Alwani binti Mohamad"; "huda bt basuri" → "Huda bt Basuri".
export function namaKemas(raw: string | null | undefined): string {
  const s = (raw || "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  const kecil = new Set(["bin", "binti", "bt", "bte", "al", "a/l", "a/p", "a/k"]);
  return s
    .split(" ")
    .map((w, i) => {
      const lw = w.toLowerCase();
      if (i > 0 && kecil.has(lw)) return lw;
      // hormati sempang & apostrof (cth: Abdul-Rahman, Dato')
      return w
        .split(/([-'])/)
        .map((p) => (p === "-" || p === "'" ? p : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()))
        .join("");
    })
    .join(" ");
}

export function rm(nilai: number | string | null | undefined): string {
  const n = Number(nilai ?? 0);
  const v = isNaN(n) ? 0 : n;
  try {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(v);
  } catch {
    return `RM${v.toFixed(2)}`;
  }
}

// Nombor → perkataan Bahasa Melayu (untuk baucer/resit)
const _satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "lapan", "sembilan", "sepuluh", "sebelas"];
function _ratus(n: number): string {
  let s = "";
  const r = Math.floor(n / 100), b = n % 100;
  if (r) s += r === 1 ? "seratus" : _satuan[r] + " ratus";
  if (b) {
    if (s) s += " ";
    if (b < 12) s += _satuan[b];
    else if (b < 20) s += _satuan[b - 10] + " belas";
    else {
      const p = Math.floor(b / 10), u = b % 10;
      s += p === 1 ? "sepuluh" : _satuan[p] + " puluh";
      if (u) s += " " + _satuan[u];
    }
  }
  return s;
}
function _perkataan(n: number): string {
  if (n === 0) return "kosong";
  let s = "";
  const juta = Math.floor(n / 1000000); n %= 1000000;
  const ribu = Math.floor(n / 1000); n %= 1000;
  if (juta) s += (juta === 1 ? "satu juta" : _ratus(juta) + " juta");
  if (ribu) { if (s) s += " "; s += ribu === 1 ? "seribu" : _ratus(ribu) + " ribu"; }
  if (n) { if (s) s += " "; s += _ratus(n); }
  return s.trim();
}
export function ringgitPerkataan(amount: number | string | null | undefined): string {
  const sen100 = Math.round(Number(amount ?? 0) * 100);
  const ringgit = Math.floor(sen100 / 100), sen = sen100 % 100;
  let s = "Ringgit Malaysia " + _perkataan(ringgit);
  if (sen) s += " dan " + _perkataan(sen) + " sen";
  s += " sahaja";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function tarikhMs(d: string | Date | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "-";
  try {
    return date.toLocaleDateString("ms-MY", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}
