// Logik kelayakan tanggungan untuk khairat kematian.
// Peraturan kariah Surau Ar Raudhah:
//   - Pasangan: sentiasa layak
//   - Ibu/Bapa yang ditanggung: layak
//   - Anak: layak jika 21 tahun ke bawah, ATAU OKU (tanpa had umur),
//           ATAU masih belajar sepenuh masa (hingga 25 tahun)

export type TanggunganInput = {
  hubungan?: string | null;
  tarikh_lahir?: string | null;
  no_kp?: string | null;
  oku?: boolean;
  masih_belajar?: boolean;
};

// Kira umur dari tarikh lahir; jika tiada, cuba dari 6 digit pertama No. KP/MyKid.
export function umurDari(tarikhLahir?: string | null, noKp?: string | null): number | null {
  let d: Date | null = null;
  if (tarikhLahir) {
    const t = new Date(tarikhLahir);
    if (!isNaN(t.getTime())) d = t;
  }
  if (!d && noKp) {
    const g = noKp.replace(/\D/g, "");
    if (g.length >= 6) {
      const yy = +g.slice(0, 2);
      const mm = +g.slice(2, 4);
      const dd = +g.slice(4, 6);
      if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
        const cy = new Date().getFullYear() % 100;
        const abad = yy <= cy ? 2000 : 1900;
        d = new Date(abad + yy, mm - 1, dd);
      }
    }
  }
  if (!d || isNaN(d.getTime())) return null;
  const now = new Date();
  let umur = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) umur--;
  return umur >= 0 && umur < 130 ? umur : null;
}

// Dapatkan tarikh lahir (YYYY-MM-DD) dari 6 digit pertama No. KP / MyKid.
export function tarikhLahirDariKp(noKp?: string | null): string | null {
  const g = (noKp || "").replace(/\D/g, "");
  if (g.length < 6) return null;
  const yy = +g.slice(0, 2);
  const mm = +g.slice(2, 4);
  const dd = +g.slice(4, 6);
  if (!(mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31)) return null;
  const cy = new Date().getFullYear() % 100;
  const abad = yy <= cy ? 2000 : 1900;
  return `${abad + yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

export function layakKhairat(t: TanggunganInput): { layak: boolean; sebab: string } {
  const h = (t.hubungan || "lain").toLowerCase();
  if (h === "pasangan") return { layak: true, sebab: "Pasangan" };
  if (h === "ibu" || h === "bapa") return { layak: true, sebab: "Ibu/Bapa ditanggung" };
  if (h === "anak") {
    if (t.oku) return { layak: true, sebab: "Anak OKU" };
    const umur = umurDari(t.tarikh_lahir, t.no_kp);
    if (umur === null) return { layak: true, sebab: "Anak — sila sahkan umur" };
    if (umur <= 21) return { layak: true, sebab: `Anak, ${umur} tahun` };
    if (t.masih_belajar && umur <= 25) return { layak: true, sebab: `Anak belajar, ${umur} tahun` };
    return { layak: false, sebab: `Anak ${umur} tahun — melebihi had umur` };
  }
  return { layak: false, sebab: "Bukan tanggungan layak khairat" };
}
