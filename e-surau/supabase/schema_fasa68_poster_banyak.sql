-- ============================================================
-- e-Surau · Skema Fasa 68 (Poster Program Berbilang / Swipe)
-- Jalankan di Supabase SQL Editor (selepas fasa 67).
-- ============================================================

-- Senarai URL poster program (boleh sampai 4 keping) untuk galeri swipe
-- di atas borang RSVP. Kekalkan poster_url (fasa 67) sebagai poster utama
-- untuk keserasian ke belakang — ia diselaraskan = poster_urls[1].
alter table program add column if not exists poster_urls text[] not null default '{}';

-- Isi poster_urls dari poster_url sedia ada (jika ada) supaya program lama
-- terus papar poster mereka dalam galeri baharu.
update program
set poster_urls = array[poster_url]
where poster_url is not null
  and (poster_urls is null or array_length(poster_urls, 1) is null);

-- Pautan Group WhatsApp khas program (pilihan). Selepas kariah siap RSVP,
-- butang "Sertai Group WhatsApp" dipapar supaya mereka boleh join terus.
alter table program add column if not exists wa_group text;
