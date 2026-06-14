// src/lib/excel.ts
import ExcelJS from 'exceljs';

export interface SubSlsExcelRow {
  no: number;
  kecamatan: string;
  desa: string;
  sls: string;
  idSubSls: string;
  korlap: string;
  pml: string;
  pcl: string;
  totalMuatan: number;
  selesai: number;
  persentase: number;
  statusTerakhir: string;
  tglLaporTerakhir: string;
  keterangan: string;
}

export interface SlsExcelRow {
  no: number;
  kecamatan: string;
  desa: string;
  sls: string;
  jumlahSubSls: number;
  totalMuatan: number;
  selesai: number;
  progres: number;
  tidakSelesai: number;
  belumLapor: number;
  persentaseSubSls: number;
  persentaseUsaha: number;
}

export interface KecamatanExcelRow {
  no: number;
  kecamatan: string;
  totalSls: number;
  totalSubSls: number;
  totalMuatan: number;
  subSlsSelesai: number;
  subSlsProgres: number;
  subSlsTdkSelesai: number;
  belumLapor: number;
  usahaSelesai: number;
  persentaseUsaha: number;
  jumlahKorlap: number;
  jumlahPml: number;
  jumlahPcl: number;
}

export interface HarianExcelRow {
  no: number;
  tanggal: string;
  kecamatan: string;
  desa: string;
  sls: string;
  subSls: string;
  korlap: string;
  pml: string;
  pcl: string;
  totalMuatan: number;
  selesai: number;
  status: string;
  keterangan: string;
}

export interface EwsExcelRow {
  no: number;
  namaPcl: string;
  namaPml: string;
  namaKorlap: string;
  kecamatan: string;
  subSls: string;
  totalMuatan: number;
  selesai: number;
  persentase: number;
  tglLaporTerakhir: string;
  hariGap: number;
  jenisAlert: string;
}

export async function exportToExcel(
  type: 'subsls' | 'sls' | 'kecamatan' | 'harian' | 'ews',
  data: any[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheetName =
    type === 'subsls'
      ? 'Rekap per Sub-SLS'
      : type === 'sls'
      ? 'Rekap per SLS'
      : type === 'kecamatan'
      ? 'Rekap per Kecamatan'
      : type === 'harian'
      ? 'Rekap Harian'
      : 'Peringatan Kendala';

  const worksheet = workbook.addWorksheet(sheetName);

  // Definisikan header dan tipe data
  let columns: Partial<ExcelJS.Column>[] = [];
  if (type === 'subsls') {
    columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Kecamatan', key: 'kecamatan', width: 15 },
      { header: 'Desa/Kelurahan', key: 'desa', width: 20 },
      { header: 'SLS / RT', key: 'sls', width: 25 },
      { header: 'ID Sub-SLS', key: 'idSubSls', width: 20 },
      { header: 'Korlap', key: 'korlap', width: 18 },
      { header: 'PML', key: 'pml', width: 18 },
      { header: 'PCL', key: 'pcl', width: 18 },
      { header: 'Total Muatan', key: 'totalMuatan', width: 15 },
      { header: 'Sudah Selesai', key: 'selesai', width: 15 },
      { header: '% Selesai', key: 'persentase', width: 12 },
      { header: 'Status Terakhir', key: 'statusTerakhir', width: 15 },
      { header: 'Tgl Lapor Terakhir', key: 'tglLaporTerakhir', width: 18 },
      { header: 'Keterangan', key: 'keterangan', width: 30 },
    ];
  } else if (type === 'sls') {
    columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Kecamatan', key: 'kecamatan', width: 15 },
      { header: 'Desa/Kelurahan', key: 'desa', width: 20 },
      { header: 'SLS / RT', key: 'sls', width: 25 },
      { header: 'Jumlah Sub-SLS', key: 'jumlahSubSls', width: 15 },
      { header: 'Total Muatan', key: 'totalMuatan', width: 15 },
      { header: 'Selesai', key: 'selesai', width: 12 },
      { header: 'Progres', key: 'progres', width: 12 },
      { header: 'Tidak Selesai', key: 'tidakSelesai', width: 15 },
      { header: 'Belum Lapor', key: 'belumLapor', width: 15 },
      { header: '% Selesai (Sub-SLS)', key: 'persentaseSubSls', width: 20 },
      { header: '% Selesai (Usaha)', key: 'persentaseUsaha', width: 18 },
    ];
  } else if (type === 'kecamatan') {
    columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Kecamatan', key: 'kecamatan', width: 15 },
      { header: 'Total SLS', key: 'totalSls', width: 12 },
      { header: 'Total Sub-SLS', key: 'totalSubSls', width: 15 },
      { header: 'Total Muatan', key: 'totalMuatan', width: 15 },
      { header: 'Sub-SLS Selesai', key: 'subSlsSelesai', width: 18 },
      { header: 'Sub-SLS Progres', key: 'subSlsProgres', width: 18 },
      { header: 'Sub-SLS Tdk Selesai', key: 'subSlsTdkSelesai', width: 20 },
      { header: 'Belum Lapor', key: 'belumLapor', width: 15 },
      { header: 'Usaha Selesai', key: 'usahaSelesai', width: 15 },
      { header: '% Usaha Selesai', key: 'persentaseUsaha', width: 18 },
      { header: 'Jumlah Korlap', key: 'jumlahKorlap', width: 15 },
      { header: 'Jumlah PML', key: 'jumlahPml', width: 15 },
      { header: 'Jumlah PCL', key: 'jumlahPcl', width: 15 },
    ];
  } else if (type === 'harian') {
    columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Kecamatan', key: 'kecamatan', width: 15 },
      { header: 'Desa/Kelurahan', key: 'desa', width: 20 },
      { header: 'SLS / RT', key: 'sls', width: 25 },
      { header: 'Sub-SLS', key: 'subSls', width: 20 },
      { header: 'Korlap', key: 'korlap', width: 18 },
      { header: 'PML', key: 'pml', width: 18 },
      { header: 'PCL', key: 'pcl', width: 18 },
      { header: 'Total Muatan', key: 'totalMuatan', width: 15 },
      { header: 'Selesai Dicacah', key: 'selesai', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Keterangan', key: 'keterangan', width: 30 },
    ];
  } else if (type === 'ews') {
    columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Nama PCL', key: 'namaPcl', width: 18 },
      { header: 'Nama PML', key: 'namaPml', width: 18 },
      { header: 'Nama Korlap', key: 'namaKorlap', width: 18 },
      { header: 'Kecamatan', key: 'kecamatan', width: 15 },
      { header: 'Sub-SLS', key: 'subSls', width: 20 },
      { header: 'Total Muatan', key: 'totalMuatan', width: 15 },
      { header: 'Selesai', key: 'selesai', width: 15 },
      { header: '% Selesai', key: 'persentase', width: 12 },
      { header: 'Tgl Lapor Terakhir', key: 'tglLaporTerakhir', width: 18 },
      { header: 'Hari Gap', key: 'hariGap', width: 12 },
      { header: 'Jenis Alert', key: 'jenisAlert', width: 20 },
    ];
  }

  worksheet.columns = columns as ExcelJS.Column[];

  // Masukkan data ke worksheet
  worksheet.addRows(data);

  // Freeze pane di baris pertama (header)
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Auto-filter di baris pertama
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  // Desain Header (Warna Biru BPS #1B4F72, Teks Putih, Bold)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B4F72' }, // Biru BPS
    };
    cell.font = {
      name: 'Arial',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }, // Putih
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF0D2D44' } },
      right: { style: 'thin', color: { argb: 'FF0D2D44' } },
    };
  });

  // Iterasi semua baris data untuk styling sel
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // Lewati header

    row.height = 20;

    row.eachCell((cell, colNumber) => {
      // Font standar
      cell.font = {
        name: 'Arial',
        size: 10,
      };

      // Alignment default (kiri untuk teks, kanan untuk angka, tengah untuk nomor/tanggal/status)
      const columnKey = columns[colNumber - 1].key;
      if (['no', 'idSubSls', 'subSls', 'tanggal', 'tglLaporTerakhir', 'hariGap'].includes(columnKey || '')) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (typeof cell.value === 'number') {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      // Format Angka dan Persentase
      if (columnKey && ['persentase', 'persentaseSubSls', 'persentaseUsaha'].includes(columnKey)) {
        cell.numFmt = '0.00%';
        // Karena data dimasukkan dalam bentuk persen mentah (misal 85.5 untuk 85.5%),
        // ExcelJS memerlukan nilai desimal (0.855) agar format % bekerja dengan benar.
        if (typeof cell.value === 'number') {
          cell.value = cell.value / 100;
        }
      } else if (columnKey && ['totalMuatan', 'selesai', 'jumlahSubSls', 'progres', 'tidakSelesai', 'belumLapor', 'totalSls', 'totalSubSls', 'subSlsSelesai', 'subSlsProgres', 'subSlsTdkSelesai', 'usahaSelesai', 'jumlahKorlap', 'jumlahPml', 'jumlahPcl'].includes(columnKey)) {
        cell.numFmt = '#,##0';
      }

      // Border halus untuk setiap sel
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };

      // Conditional Formatting untuk Kolom Status / Alert
      if (columnKey === 'statusTerakhir' || columnKey === 'status' || columnKey === 'jenisAlert') {
        const val = String(cell.value || '').toLowerCase();
        
        let colorArgb = '';
        let fontColorArgb = 'FF000000'; // hitam default

        if (val === 'selesai' || val.includes('100%')) {
          colorArgb = 'FFE2F0D9'; // Hijau soft
          fontColorArgb = 'FF385723';
        } else if (val === 'progres' || val.includes('stagnan')) {
          colorArgb = 'FFFCE4D6'; // Oranye/kuning soft
          fontColorArgb = 'FFC65911';
        } else if (val === 'tidak_selesai' || val === 'tidak selesai' || val.includes('tidak aktif') || val.includes('bermasalah')) {
          colorArgb = 'FFF8CBAD'; // Merah soft
          fontColorArgb = 'FFC00000';
        } else if (val.includes('risiko')) {
          colorArgb = 'FFFFF2CC'; // Kuning soft
          fontColorArgb = 'FF7F6000';
        }

        if (colorArgb) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: colorArgb },
          };
          cell.font = {
            name: 'Arial',
            size: 10,
            bold: true,
            color: { argb: fontColorArgb },
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
