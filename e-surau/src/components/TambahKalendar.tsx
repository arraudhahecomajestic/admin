"use client";

// Butang "Tambah ke Kalendar" untuk kariah selepas RSVP.
// Tiada integrasi — hanya jana pautan Google Calendar + fail .ics (Apple/Outlook)
// terus dari butiran program. Masa dianggap waktu tempatan (floating).

function duaAngka(n: number) {
  return String(n).padStart(2, "0");
}

// Cuba baca masa bebas (cth "8:30 PAGI", "2.00 petang", "8 malam").
// Pulang { jam, minit } atau null jika tak dapat dibaca.
function bacaMasa(masa?: string | null): { jam: number; minit: number } | null {
  if (!masa) return null;
  const m = masa.match(/(\d{1,2})(?:[:.](\d{2}))?\s*(pagi|tengah\s*hari|tengahari|petang|malam)?/i);
  if (!m) return null;
  let jam = parseInt(m[1], 10);
  const minit = m[2] ? parseInt(m[2], 10) : 0;
  const bhg = (m[3] || "").toLowerCase().replace(/\s+/g, "");
  if (jam > 23 || minit > 59) return null;
  if (/petang|malam/.test(bhg) && jam < 12) jam += 12;
  else if (/tengahari|tengah/.test(bhg) && jam < 12) jam = 12;
  else if (/pagi/.test(bhg) && jam === 12) jam = 0;
  return { jam, minit };
}

// Bina rentetan tempatan YYYYMMDDTHHMMSS (tanpa Z = waktu tempatan).
function capMasa(tarikh: string, jam: number, minit: number) {
  const [y, mo, d] = tarikh.split("-").map((x) => parseInt(x, 10));
  return `${y}${duaAngka(mo)}${duaAngka(d)}T${duaAngka(jam)}${duaAngka(minit)}00`;
}
function capTarikh(tarikh: string, tambahHari = 0) {
  const [y, mo, d] = tarikh.split("-").map((x) => parseInt(x, 10));
  const dt = new Date(Date.UTC(y, mo - 1, d + tambahHari));
  return `${dt.getUTCFullYear()}${duaAngka(dt.getUTCMonth() + 1)}${duaAngka(dt.getUTCDate())}`;
}

export default function TambahKalendar({
  tajuk,
  tarikh,
  masa,
  lokasi,
  keterangan,
}: {
  tajuk: string;
  tarikh: string; // YYYY-MM-DD
  masa?: string | null;
  lokasi?: string | null;
  keterangan?: string | null;
}) {
  if (!tarikh) return null;

  const t = bacaMasa(masa);
  let mula: string, tamat: string, adaMasa: boolean;
  if (t) {
    adaMasa = true;
    mula = capMasa(tarikh, t.jam, t.minit);
    // tamat = +2 jam (mudah, tanpa lompat hari yang rumit)
    let jT = t.jam + 2;
    let hariT = 0;
    if (jT >= 24) { jT -= 24; hariT = 1; }
    tamat = hariT ? capMasa(capTarikhKeIso(tarikh, 1), jT, t.minit) : capMasa(tarikh, jT, t.minit);
  } else {
    adaMasa = false;
    mula = capTarikh(tarikh, 0);
    tamat = capTarikh(tarikh, 1); // acara sehari penuh
  }

  const butiran = (keterangan || "").trim();
  const lok = (lokasi || "").trim();

  // 1) Pautan Google Calendar
  const gcal = new URL("https://calendar.google.com/calendar/render");
  gcal.searchParams.set("action", "TEMPLATE");
  gcal.searchParams.set("text", tajuk);
  gcal.searchParams.set("dates", `${mula}/${tamat}`);
  if (butiran) gcal.searchParams.set("details", butiran);
  if (lok) gcal.searchParams.set("location", lok);

  // 2) Fail .ics (Apple Calendar / Outlook)
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@arraudhahecomajestic`;
  const dtstamp = capTarikh(tarikh, 0) + "T000000Z";
  const badan = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Surau Ar-Raudhah//eSurau//MS",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    adaMasa ? `DTSTART:${mula}` : `DTSTART;VALUE=DATE:${mula}`,
    adaMasa ? `DTEND:${tamat}` : `DTEND;VALUE=DATE:${tamat}`,
    `SUMMARY:${esc(tajuk)}`,
    butiran ? `DESCRIPTION:${esc(butiran)}` : "",
    lok ? `LOCATION:${esc(lok)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  const icsHref = "data:text/calendar;charset=utf-8," + encodeURIComponent(badan);
  const namaFail = (tajuk || "program").replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".ics";

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-2 text-center text-sm font-semibold text-slate-700">Tambah ke Kalendar Anda</div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <a
          href={gcal.toString()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          📅 Google Calendar
        </a>
        <a
          href={icsHref}
          download={namaFail}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
           Apple / Lain (.ics)
        </a>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">iPhone guna &ldquo;.ics&rdquo;, Android guna &ldquo;Google Calendar&rdquo;.</p>
    </div>
  );
}

// Tolong: tarikh ISO + tambah hari, pulang "YYYY-MM-DD".
function capTarikhKeIso(tarikh: string, tambahHari: number) {
  const [y, mo, d] = tarikh.split("-").map((x) => parseInt(x, 10));
  const dt = new Date(Date.UTC(y, mo - 1, d + tambahHari));
  return `${dt.getUTCFullYear()}-${duaAngka(dt.getUTCMonth() + 1)}-${duaAngka(dt.getUTCDate())}`;
}
