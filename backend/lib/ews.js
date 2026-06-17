// backend/lib/ews.js
// Dikonversi dari TypeScript ke CommonJS

const { getSettings } = require('./settings');

/**
 * Mendeteksi alert EWS untuk satu Sub-SLS berdasarkan riwayat laporannya.
 */
function detectAlert(subSls, currentDate = new Date()) {
  const settings = getSettings();
  const config = {
    thresholdHari: settings.ewsThresholdHari,
    periodeMulai: new Date(settings.periodeMulai),
    periodeSelesai: new Date(settings.periodeSelesai),
  };

  if (subSls.totalMuatanAssignment === 0) return null;

  const laporanSorted = [...subSls.laporan].sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
  );

  const totalMuatan = subSls.totalMuatanAssignment;
  const latestReport = laporanSorted[0];
  const selesai = latestReport ? latestReport.jumlahSelesai : 0;
  const persentase = totalMuatan > 0 ? (selesai / totalMuatan) * 100 : 100;

  if (persentase >= 100) return null;

  let hariGap = 0;
  let tanggalLaporTerakhir = null;

  if (laporanSorted.length === 0) {
    const startCompare = currentDate > config.periodeMulai ? config.periodeMulai : currentDate;
    const diffTime = Math.abs(currentDate.getTime() - startCompare.getTime());
    hariGap = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else {
    tanggalLaporTerakhir = latestReport.tanggal;
    const diffTime = Math.abs(currentDate.getTime() - new Date(latestReport.tanggal).getTime());
    hariGap = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  if (hariGap >= config.thresholdHari) {
    return {
      subSlsId: subSls.id,
      idSubSls: subSls.idSubsls,
      namaPcl: subSls.namaPcl,
      namaPml: subSls.namaPml,
      namaKorlap: subSls.namaKorlap,
      totalMuatan,
      selesai,
      persentase,
      jenisAlert: 'tidak_aktif',
      tingkatKekritisan: 'kritis',
      pesan: laporanSorted.length === 0
        ? `Belum pernah lapor sejak sensus dimulai (${hariGap} hari yang lalu).`
        : `Tidak mengirimkan laporan harian selama ${hariGap} hari berturut-turut.`,
      hariGap,
      tanggalLaporTerakhir,
    };
  }

  if (laporanSorted.length >= 2) {
    const isLaporan1TidakSelesai = laporanSorted[0].status === 'tidak_selesai';
    const isLaporan2TidakSelesai = laporanSorted[1].status === 'tidak_selesai';
    if (isLaporan1TidakSelesai && isLaporan2TidakSelesai) {
      return {
        subSlsId: subSls.id,
        idSubSls: subSls.idSubsls,
        namaPcl: subSls.namaPcl,
        namaPml: subSls.namaPml,
        namaKorlap: subSls.namaKorlap,
        totalMuatan,
        selesai,
        persentase,
        jenisAlert: 'bermasalah',
        tingkatKekritisan: 'kritis',
        pesan: `Melaporkan kendala 'Tidak Selesai' selama 2 hari laporan berturut-turut. Kendala terakhir: "${latestReport.keterangan || '-'}"`,
        tanggalLaporTerakhir: latestReport.tanggal,
      };
    }
  }

  if (laporanSorted.length >= 2) {
    const progressTerakhir = laporanSorted[0].jumlahSelesai;
    const progressSebelumnya = laporanSorted[1].jumlahSelesai;
    if (progressTerakhir === progressSebelumnya && progressTerakhir < totalMuatan) {
      return {
        subSlsId: subSls.id,
        idSubSls: subSls.idSubsls,
        namaPcl: subSls.namaPcl,
        namaPml: subSls.namaPml,
        namaKorlap: subSls.namaKorlap,
        totalMuatan,
        selesai,
        persentase,
        jenisAlert: 'stagnan',
        tingkatKekritisan: 'perhatian',
        pesan: `Progress pencacahan stagnan di angka ${progressTerakhir} usaha selama 2 hari laporan terakhir.`,
        tanggalLaporTerakhir: latestReport.tanggal,
      };
    }
  }

  const totalHariSensus = Math.ceil((config.periodeSelesai.getTime() - config.periodeMulai.getTime()) / (1000 * 60 * 60 * 24));
  const hariBerjalan = Math.ceil((currentDate.getTime() - config.periodeMulai.getTime()) / (1000 * 60 * 60 * 24));

  if (totalHariSensus > 0) {
    const rasioWaktu = hariBerjalan / totalHariSensus;
    if (totalMuatan > 150 && persentase < 30 && rasioWaktu > 0.5) {
      return {
        subSlsId: subSls.id,
        idSubSls: subSls.idSubsls,
        namaPcl: subSls.namaPcl,
        namaPml: subSls.namaPml,
        namaKorlap: subSls.namaKorlap,
        totalMuatan,
        selesai,
        persentase,
        jenisAlert: 'risiko',
        tingkatKekritisan: 'risiko',
        pesan: `Muatan tinggi (${totalMuatan} usaha) dengan progress lambat (${persentase.toFixed(1)}%) padahal waktu sensus berjalan sudah ${Math.round(rasioWaktu * 100)}%.`,
        tanggalLaporTerakhir: latestReport ? latestReport.tanggal : null,
      };
    }
  }

  return null;
}

module.exports = { detectAlert };
