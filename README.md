# Lima Buku UPKP

Web belajar mandiri untuk UPKP Kementerian Keuangan: 5 buku (Etika PNS, Nilai-Nilai Kemenkeu, Pengelolaan Keuangan Negara, Tata Aturan Kepegawaian, Wawasan Kebangsaan), 47 bab materi dengan mode hafalan & kartu balik, 783 latihan soal acak berpembahasan (termasuk soal kasus panjang), pencarian kata kunci, dan pelacak progres.

Situs statis murni (HTML + CSS + JS tanpa build step).

## Struktur
```
index.html
assets/app.css        tampilan
assets/app.js         aplikasi (routing, materi, kuis, pencarian)
data/books/*.js       materi per buku (format mini-markdown di dalam JS)
favicon.ico, favicon.svg, apple-touch-icon.png, icon-192/512.png, site.webmanifest   ikon tab & address bar
data/questions/q*.js  bank soal per buku
data/questions/k*.js  soal kasus panjang per buku (ditambahkan ke bank yang sama)
```

## Jalankan lokal
```
python3 -m http.server 8000
# buka http://localhost:8000
```

## Deploy ke Vercel
1. Push folder ini ke repo GitHub baru.
2. Di vercel.com → Add New → Project → Import repo tersebut.
3. Framework Preset: **Other**. Build Command: kosongkan. Output Directory: `.` (root).
4. Deploy.

## Menambah / mengubah soal
Tiap soal di `data/questions/qN-*.js` berformat:
```
["idBab", "H|P|K|A", "Pertanyaan", ["JAWABAN BENAR", "pengecoh 1", "pengecoh 2", "pengecoh 3"], "Pembahasan"]
```
Jawaban benar selalu di posisi pertama; aplikasi mengacak urutan pilihan saat ditampilkan.

Untuk soal kasus, tulis narasi kasus lalu ` || ` lalu pertanyaannya. Teks sebelum ` || ` tampil sebagai kotak "Kasus" (gunakan ` // ` untuk memisah paragraf). Tambahkan soal baru di akhir array agar ID soal lama (dan progres pengguna) tidak bergeser.

Progres (bab dibaca, riwayat jawaban, tanda soal) tersimpan otomatis di localStorage browser masing-masing perangkat dan tetap ada walaupun browser ditutup (kecuali mode incognito atau data browser dihapus).

**Kode progres**: tombol kunci di header, kartu "Cara belajar" di beranda, atau footer membuka menu *Simpan & pulihkan progres*. Pengguna menyalin kode (diawali `LB5Z-`, terkompresi) di perangkat lama, lalu menempelkannya di perangkat baru. Tidak ada server/database; kode berisi data progres itu sendiri.
