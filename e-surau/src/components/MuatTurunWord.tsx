"use client";

import { zipSync, strToU8 } from "fflate";
import { tarikhMs } from "@/lib/format";

type Orang = { nama: string; jawatan: string };

function pisah(blok?: string): Orang[] {
  return (blok || "").split("\n").map((s) => s.trim()).filter(Boolean).map((line) => {
    const mm = line.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
    return mm ? { nama: mm[1].trim(), jawatan: mm[2].trim() } : { nama: line, jawatan: "" };
  });
}

const esc = (s: any) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---- Penjana OOXML ringkas ----
function run(text: string, o: { b?: boolean; i?: boolean; sz?: number } = {}) {
  const rpr = `<w:rPr>${o.b ? "<w:b/>" : ""}${o.i ? "<w:i/>" : ""}${o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : ""}</w:rPr>`;
  return `<w:r>${rpr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}
function para(
  content: string,
  o: { align?: string; after?: number; left?: number; hanging?: number; b?: boolean; sz?: number } = {},
) {
  const runs = content.startsWith("<w:r") ? content : run(content, { b: o.b, sz: o.sz });
  const ind = o.left || o.hanging ? `<w:ind ${o.left ? `w:left="${o.left}"` : ""} ${o.hanging ? `w:hanging="${o.hanging}"` : ""}/>` : "";
  const pPr = `<w:pPr>${o.align ? `<w:jc w:val="${o.align}"/>` : ""}<w:spacing w:after="${o.after ?? 120}"/>${ind}</w:pPr>`;
  return `<w:p>${pPr}${runs}</w:p>`;
}
function cell(inner: string, w?: number, valign?: string) {
  const tcPr = `<w:tcPr>${w ? `<w:tcW w:w="${w}" w:type="dxa"/>` : ""}${valign ? `<w:vAlign w:val="${valign}"/>` : ""}</w:tcPr>`;
  return `<w:tc>${tcPr}${inner}</w:tc>`;
}
function tableNoBorder(rows: string[], widths?: number[]) {
  const grid = widths ? `<w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>` : "";
  const none = `<w:tblBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/>${none}</w:tblPr>${grid}${rows.join("")}</w:tbl>`;
}
const spacer = () => para("", { after: 0 });

function senaraiKehadiran(tajuk: string, orang: Orang[]): string {
  if (!orang.length) return "";
  const head = para(tajuk, { b: true, after: 60 });
  const rows = orang.map((o, i) =>
    `<w:tr>${cell(para(`${i + 1}.`, { after: 0 }), 600)}${cell(para(o.nama, { after: 0 }), 5200)}${cell(para(o.jawatan ? "-" : "", { after: 0 }), 400)}${cell(para(o.jawatan, { after: 0 }), 3200)}</w:tr>`,
  );
  return head + tableNoBorder(rows, [600, 5200, 400, 3200]) + spacer();
}

function tableBordered(rows: string[][]): string {
  const bd = `<w:tblBorders><w:top w:val="single" w:sz="4" w:color="999999"/><w:left w:val="single" w:sz="4" w:color="999999"/><w:bottom w:val="single" w:sz="4" w:color="999999"/><w:right w:val="single" w:sz="4" w:color="999999"/><w:insideH w:val="single" w:sz="4" w:color="999999"/><w:insideV w:val="single" w:sz="4" w:color="999999"/></w:tblBorders>`;
  const trs = rows.map((r, ri) => {
    const head = ri === 0;
    const total = !head && /jumlah/i.test(r[0] || "");
    const cells = r.map((c, ci) => {
      const kanan = ci === r.length - 1 && ci !== 0;
      const shd = head ? `<w:shd w:val="clear" w:color="auto" w:fill="EEEEEE"/>` : "";
      return `<w:tc><w:tcPr>${shd}</w:tcPr>${para(run(c, { b: head || total }), { align: kanan ? "right" : "left", after: 0 })}</w:tc>`;
    });
    return `<w:tr>${cells.join("")}</w:tr>`;
  });
  const n = Math.max(1, rows[0]?.length || 1);
  const cols = n === 2 ? [5600, 2800] : Array.from({ length: n }, () => Math.round(8400 / n));
  const grid = `<w:tblGrid>${cols.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblInd w:w="540" w:type="dxa"/>${bd}</w:tblPr>${grid}${trs.join("")}</w:tbl>`;
}

function badanMinit(minit: string): string {
  const lines = (minit || "").split("\n");
  const keluar: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i].trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
        if (!cells.every((c) => /^:?-+:?$/.test(c) || c === "")) rows.push(cells);
        i++;
      }
      if (rows.length) keluar.push(tableBordered(rows) + spacer());
      continue;
    }
    if (!t) { keluar.push(para("", { after: 60 })); i++; continue; }
    if (/^tindakan\s*:/i.test(t)) {
      const rest = t.replace(/^tindakan\s*:\s*/i, "");
      keluar.push(para(run("Tindakan: ", { b: true }) + run(rest), { align: "right", after: 160 }));
    } else if (/^\d+\.\d+\.\d+/.test(t)) {
      keluar.push(para(t, { left: 1080, after: 80 }));
    } else if (/^\d+\.\d+/.test(t)) {
      keluar.push(para(t, { left: 540, after: 100 }));
    } else if (/^\d+\.(\s|$)/.test(t)) {
      keluar.push(para(t, { b: true, after: 60 }));
    } else {
      keluar.push(para(t, { left: 540, after: 100 }));
    }
    i++;
  }
  return keluar.join("");
}

export default function MuatTurunWord({ m, nama }: { m: any; nama: string }) {
  function jana() {
    const jenisU = String(m.jenis || "").toUpperCase();
    const tajukAtas = jenisU && jenisU !== "AJK" ? `MINIT MESYUARAT ${jenisU}` : "MINIT MESYUARAT";
    const namaU = String(nama || "").toUpperCase();
    const baris2 = `JAWATANKUASA KARIAH ${namaU}${m.bil ? ` BIL. ${m.bil}` : ""}`;

    const bersemuka = pisah(m.kehadiran);
    const online = pisah(m.kehadiran_online);
    const tidakHadir = pisah(m.tidak_hadir);

    const metaRow = (k: string, v: string) =>
      `<w:tr>${cell(para(k, { after: 0 }), 1600)}${cell(para(":", { after: 0 }), 300)}${cell(para(v || "-", { after: 0 }), 7400)}</w:tr>`;
    const meta = tableNoBorder(
      [metaRow("Tarikh", m.tarikh ? tarikhMs(m.tarikh) : ""), metaRow("Masa", m.masa || ""), metaRow("Tempat", m.tempat || "")],
      [1600, 300, 7400],
    );

    const garis = `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="999999"/></w:pBdr><w:spacing w:before="60" w:after="180"/></w:pPr></w:p>`;

    // Blok tandatangan
    const tt = (label: string, orang: string, jawatan: string) =>
      [
        para(label, { after: 240 }),
        para("...................................................", { after: 40 }),
        para(String(orang || "").toUpperCase(), { b: true, after: 0 }),
        para(jawatan, { after: 0 }),
        para(nama, { after: 120 }),
        para("Tarikh:", { after: 0 }),
      ].join("");
    const ttRow = `<w:tr>${cell(tt("Disediakan oleh;", m.pencatat || "Setiausaha", "Setiausaha"), 4700)}${cell(tt("Disahkan oleh;", m.pengerusi || "Pengerusi", "Pengerusi"), 4700)}</w:tr>`;
    const tandatangan = tableNoBorder([ttRow], [4700, 4700]);

    const body =
      para(tajukAtas, { align: "center", b: true, sz: 28, after: 20 }) +
      para(baris2, { align: "center", b: true, sz: 24, after: 160 }) +
      meta +
      garis +
      senaraiKehadiran("KEHADIRAN BERSEMUKA", bersemuka) +
      senaraiKehadiran("KEHADIRAN DALAM TALIAN", online) +
      senaraiKehadiran("TIDAK HADIR BERSEBAB", tidakHadir) +
      garis +
      badanMinit(m.minit || "") +
      spacer() + spacer() +
      tandatangan;

    const sectPr = `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>`;
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}${sectPr}</w:body></w:document>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
    const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`;

    const zip = zipSync({
      "[Content_Types].xml": strToU8(contentTypes),
      "_rels/.rels": strToU8(rels),
      "word/document.xml": strToU8(documentXml),
      "word/_rels/document.xml.rels": strToU8(docRels),
      "word/styles.xml": strToU8(styles),
    });

    const blob = new Blob([zip], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const namaFail = `Minit ${String(m.tajuk || "Mesyuarat")}${m.bil ? " Bil " + m.bil : ""}`.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
    a.href = url;
    a.download = `${namaFail}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={jana}
      className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
      title="Muat turun minit dalam format Word (.docx)"
    >
      Muat Turun Word
    </button>
  );
}
