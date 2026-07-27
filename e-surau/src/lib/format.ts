// Nombor telefon Malaysia → format antarabangsa piawai (60XXXXXXXXX), tanpa dash/ruang.
// Contoh: "0124030663" → "60124030663", "019-3509417" → "60193509417", "6019-2385485" → "60192385485".
export function noTelefon(raw: string | null | undefined): string {
  const d = (raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("60")) return d;
  if (d.startsWith("0")) return "60" + d.slice(1);
  return "60" + d;
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
