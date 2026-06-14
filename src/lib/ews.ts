// src/lib/ews.ts
import { SubSls, Laporan } from '@prisma/client';
import { getSettings } from './settings';

export interface EWSAlert {
  subSlsId: number;
  idSubSls: string; // e.g. "6409010001000100"
  namaPcl: string;
  namaPml: string;
  namaKorlap: string;
  totalMuatan: number;
  selesai: number;
  persentase: number;
  jenisAlert: 'tidak_aktif' | 'stagnan' | 'bermasalah' | 'risiko';
  tingkatKekritisan: 'kritis' | 'perhatian' | 'risiko'; // kritis (merah), perhatian (oranye), risiko (kuning)
  pesan: string;
  hariGap?: number;
  tanggalLaporTerakhir?: Date | null;
}

interface SubSlsWithReports extends SubSls {
  laporan: Laporan[];
  sls: {
    namaSls: string;
    desa: {
      namaDesa: string;
      kecamatan: {
        namaKec: string;
      };
    };
  };
}

/**
 * Mendeteksi alert EWS untuk satu Sub-SLS berdasarkan riwayat laporannya.
 */
export function detectAlert(
  subSls: SubSlsWithReports,
  currentDate: Date = new Date()
): EWSAlert | null {
  const settings = getSettings();
  const config = {
    thresholdHari: settings.ewsThresholdHari,
    periodeMulai: new Date(settings.periodeMulai),
    periodeSelesai: new Date(settings.periodeSelesai),
  };
  // Abaikan sub-SLS yang tidak memiliki muatan (lahan/area khusus)
  if (subSls.totalMuatanAssignment === 0) {
    return null;
  }

  const laporanSorted = [...subSls.laporan].sort(
    (a, b) => b.tanggal.getTime() - a.tanggal.getTime()
  );

  const totalMuatan = subSls.totalMuatanAssignment;
  const latestReport = laporanSorted[0];
  const selesai = latestReport ? latestReport.jumlahSelesai : 0;
  const persentase = totalMuatan > 0 ? (selesai / totalMuatan) * 100 : 100;

  // Jika sudah selesai 100%, tidak perlu memicu alert apapun
  if (persentase >= 100) {
    return null;
  }

  // 1. ALERT: Tidak Aktif (🔴 Kritis / Merah)
  // Tidak ada laporan sama sekali setelah masa pendataan dimulai,
  // atau laporan terakhir sudah lebih dari thresholdHari yang lalu.
  let hariGap = 0;
  let tanggalLaporTerakhir: Date | null = null;

  if (laporanSorted.length === 0) {
    // Hitung gap dari tanggal mulai sensus
    const startCompare = currentDate > config.periodeMulai ? config.periodeMulai : currentDate;
    const diffTime = Math.abs(currentDate.getTime() - startCompare.getTime());
    hariGap = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else {
    tanggalLaporTerakhir = latestReport.tanggal;
    const diffTime = Math.abs(currentDate.getTime() - latestReport.tanggal.getTime());
    hariGap = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Jika melewati batas hari lapor (misal 2 hari)
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

  // 2. ALERT: Bermasalah (🔴 Kritis / Merah)
  // Laporan berstatus "tidak_selesai" berturut-turut >= 2x
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

  // 3. ALERT: Stagnan (🟠 Perhatian / Oranye)
  // Progress 'jumlahSelesai' tidak bertambah selama 2 laporan terakhir
  if (laporanSorted.length >= 2) {
    const progressTerakhir = laporanSorted[0].jumlahSelesai;
    const progressSebelumnya = laporanSorted[1].jumlahSelesai;
    
    // Jika jumlah selesai stagnan dan belum mencapai muatan target
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

  // 4. ALERT: Risiko Tidak Selesai (🟡 Risiko / Kuning)
  // Muatan tinggi (>150 usaha), progress <30%, dan waktu sensus sudah jalan >50%
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
