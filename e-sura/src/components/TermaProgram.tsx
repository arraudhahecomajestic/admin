// Terma, Kebenaran & Penepian Liabiliti untuk pendaftaran program.
// Dipapar di borang pendaftaran; ibu bapa/penjaga bersetuju bila menanda kotak kebenaran.
// Melindungi surau dari tuntutan tidak wajar (aktiviti fizikal, peralatan, kecemasan, dll).
export default function TermaProgram() {
  const terma: { t: string; d: string }[] = [
    { t: "Maklumat benar", d: "Saya mengesahkan semua maklumat peserta, kesihatan, alahan, ubat dan kontak kecemasan adalah benar & lengkap. Sebarang maklumat penting yang tidak didedahkan adalah tanggungjawab saya." },
    { t: "Risiko aktiviti", d: "Saya faham program melibatkan aktiviti fizikal serta penggunaan peralatan (termasuk busur/anak panah dalam zon terkawal dan/atau komponen elektronik & peranti). Risiko lazim masih boleh berlaku walaupun langkah keselamatan diambil." },
    { t: "Pematuhan arahan", d: "Anak saya wajib mematuhi arahan fasilitator dan tidak mengendalikan peralatan tanpa kebenaran. Penganjur boleh menghentikan penyertaan jika tingkah laku membahayakan diri atau orang lain." },
    { t: "Tindakan kecemasan", d: "Saya membenarkan urus setia memberi pertolongan cemas dan mendapatkan bantuan perubatan kecemasan yang munasabah, sambil menghubungi saya/kontak kecemasan secepat mungkin." },
    { t: "Penepian liabiliti", d: "Pihak surau, jawatankuasa dan tenaga pengajar akan mengambil langkah keselamatan yang munasabah. Penganjur TIDAK bertanggungjawab atas kecederaan, kehilangan atau kerugian akibat ketidakpatuhan arahan, penyalahgunaan peralatan, maklumat kesihatan yang tidak didedahkan, atau kecuaian peserta/penjaga." },
    { t: "Barang peribadi", d: "Saya bertanggungjawab menjaga barang peribadi & peranti peserta. Urus setia membantu urusan barang tercicir tetapi tidak menjamin keselamatan barang yang tidak dijaga." },
    { t: "Penghantaran & pengambilan", d: "Saya bertanggungjawab menghantar & mengambil peserta tepat pada masa. Peserta hanya dilepaskan kepada penjaga atau wakil yang dinyatakan." },
    { t: "Perubahan program", d: "Tentatif, lokasi atau kaedah pelaksanaan boleh berubah atas faktor cuaca, keselamatan, kemudahan atau arahan pihak berkuasa/pengurusan surau." },
    { t: "Data peribadi (PDPA)", d: "Saya bersetuju data (termasuk No. MyKid/MyKad jika diberi) digunakan secara terhad untuk pendaftaran, keselamatan, komunikasi, kehadiran, rekod bayaran & penyediaan sijil sahaja." },
  ];
  return (
    <details className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
      <summary className="cursor-pointer font-semibold text-slate-800">Terma, Kebenaran &amp; Penepian Liabiliti (sila baca sebelum bersetuju)</summary>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-xs text-slate-600">
        {terma.map((x, i) => (
          <li key={i}><b className="text-slate-700">{x.t}.</b> {x.d}</li>
        ))}
      </ol>
    </details>
  );
}
