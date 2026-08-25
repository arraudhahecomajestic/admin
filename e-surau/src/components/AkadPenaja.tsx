import { NAMA_SURAU, NO_PENDAFTARAN } from "@/lib/tetapan";
import { namaPakej } from "@/lib/penaja";
import { rm } from "@/lib/format";

type Butiran = {
  syarikat?: string;
  pakej?: string;
  tempoh?: number;
  jumlah?: number;
  tarikh?: string;
  ref?: string;
};

export default function AkadPenaja({ butiran }: { butiran?: Butiran }) {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-slate-800 shadow-sm print:border-0 print:shadow-none">
      <div className="border-b-2 border-surau pb-4 text-center">
        <div className="text-[11px] font-bold uppercase tracking-widest text-surau-dark">Akad Penajaan</div>
        <h1 className="mt-1 text-lg font-bold leading-snug text-slate-900">
          Perjanjian Tajaan Rakan Surau<br />{NAMA_SURAU}
        </h1>
        <div className="mt-1 text-xs text-slate-500">No. Pendaftaran JAIS: {NO_PENDAFTARAN}</div>
      </div>

      {butiran && (
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg bg-surau/5 p-4 text-sm">
          <div><span className="text-slate-500">Penaja:</span> <b>{butiran.syarikat || "—"}</b></div>
          <div><span className="text-slate-500">Pakej:</span> <b>{butiran.pakej ? namaPakej(butiran.pakej) : "—"}</b></div>
          <div><span className="text-slate-500">Tempoh:</span> <b>{butiran.tempoh ? `${butiran.tempoh} bulan` : "—"}</b></div>
          <div><span className="text-slate-500">Jumlah:</span> <b>{butiran.jumlah ? rm(butiran.jumlah) : "—"}</b></div>
          <div><span className="text-slate-500">Tarikh:</span> <b>{butiran.tarikh || "—"}</b></div>
          <div><span className="text-slate-500">Rujukan:</span> <b>{butiran.ref || "—"}</b></div>
        </div>
      )}

      <p className="mt-4 text-sm leading-relaxed">
        Dengan nama Allah Yang Maha Pemurah lagi Maha Penyayang. Akad ini dibuat antara <b>{NAMA_SURAU}</b> ("Surau") dan pihak penaja ("Penaja") yang meneruskan bayaran tajaan melalui portal e-Surau. Tujuan tajaan ini adalah untuk <b>menampung kos operasi sistem pengurusan surau digital (e-Surau)</b> — termasuk hosting, pangkalan data, domain &amp; AI — serta <b>pembangunan &amp; penambahbaikan masa hadapan</b> kemudahan surau, demi kemaslahatan ahli kariah.
      </p>

      <h2 className="mt-5 text-sm font-bold text-surau-dark">Terma &amp; Syarat</h2>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
        <li><b>Tujuan dana.</b> Semua sumbangan tajaan disalurkan bagi menampung kos operasi sistem e-Surau dan pembangunan surau, diuruskan secara telus dalam modul Kewangan surau.</li>
        <li><b>Pakej &amp; bayaran.</b> Penaja memilih pakej (Emas / Perak / Gangsa / Direktori Rakan Surau) dan tempoh (3/6/9/12 bulan). Bayaran dibuat pendahuluan bagi tempoh dipilih melalui gerbang pembayaran yang disediakan.</li>
        <li><b>Tempoh &amp; paparan.</b> Logo dan/atau penyenaraian Penaja dipaparkan sepanjang tempoh yang dibayar sahaja, dan akan <b>luput secara automatik</b> apabila tamat tempoh. Faedah setiap pakej adalah seperti jadual pakej semasa.</li>
        <li><b>Kandungan.</b> Penaja bertanggungjawab memastikan logo, maklumat &amp; tawaran adalah sah, tidak menyalahi undang-undang dan <b>mematuhi prinsip Syariah</b>. Surau berhak menolak atau menarik keluar kandungan yang tidak sesuai.</li>
        <li><b>Bukan pelaburan.</b> Tajaan ini merupakan <b>sumbangan (sedekah)</b> menyokong dakwah &amp; operasi surau. Ia bukan pelaburan dan tidak menjanjikan sebarang pulangan kewangan.</li>
        <li><b>Bayaran balik.</b> Bayaran bagi tempoh yang sedang berjalan pada amnya <b>tidak dikembalikan</b>. Sebarang isu bayaran boleh dirujuk kepada pentadbir surau.</li>
        <li><b>Hak Surau.</b> Surau berhak menamatkan paparan tanpa bayaran balik sekiranya Penaja melanggar mana-mana terma di atas.</li>
        <li><b>Persetujuan.</b> Dengan menandakan persetujuan dan meneruskan bayaran, Penaja disifatkan telah membaca, memahami dan <b>bersetuju</b> dengan akad ini.</li>
      </ol>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
        Jazakumullahu khairan. Semoga sumbangan tuan/puan menjadi <b>sedekah jariah</b> yang berterusan pahalanya, dan setiap manfaat yang lahir daripada sistem ini menjadi saham akhirat buat para penaja. Aamiin.
      </div>
    </div>
  );
}
