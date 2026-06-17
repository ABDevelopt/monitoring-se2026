// backend/lib/excel.js
// Dikonversi dari TypeScript ke CommonJS

const ExcelJS = require('exceljs');

async function exportToExcel(type, data) {
  const workbook = new ExcelJS.Workbook();
  const sheetName =
    type === 'subsls' ? 'Rekap per Sub-SLS'
    : type === 'sls' ? 'Rekap per SLS'
    : type === 'kecamatan' ? 'Rekap per Kecamatan'
    : type === 'harian' ? 'Rekap Harian'
    : 'Peringatan Kendala';

  const worksheet = workbook.addWorksheet(sheetName);

  let columns = [];
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

  worksheet.columns = columns;
  worksheet.addRows(data);
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4F72' } };
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF0D2D44' } },
      right: { style: 'thin', color: { argb: 'FF0D2D44' } },
    };
  });

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10 };
      const columnKey = columns[colNumber - 1] && columns[colNumber - 1].key;
      if (['no', 'idSubSls', 'subSls', 'tanggal', 'tglLaporTerakhir', 'hariGap'].includes(columnKey || '')) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (typeof cell.value === 'number') {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      if (columnKey && ['persentase', 'persentaseSubSls', 'persentaseUsaha'].includes(columnKey)) {
        cell.numFmt = '0.00%';
        if (typeof cell.value === 'number') cell.value = cell.value / 100;
      } else if (columnKey && ['totalMuatan','selesai','jumlahSubSls','progres','tidakSelesai','belumLapor','totalSls','totalSubSls','subSlsSelesai','subSlsProgres','subSlsTdkSelesai','usahaSelesai','jumlahKorlap','jumlahPml','jumlahPcl'].includes(columnKey)) {
        cell.numFmt = '#,##0';
      }

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };

      if (columnKey === 'statusTerakhir' || columnKey === 'status' || columnKey === 'jenisAlert') {
        const val = String(cell.value || '').toLowerCase();
        let colorArgb = '';
        let fontColorArgb = 'FF000000';
        if (val === 'selesai') { colorArgb = 'FFE2F0D9'; fontColorArgb = 'FF385723'; }
        else if (val === 'progres' || val.includes('stagnan')) { colorArgb = 'FFFCE4D6'; fontColorArgb = 'FFC65911'; }
        else if (val === 'tidak_selesai' || val === 'tidak selesai' || val.includes('tidak aktif') || val.includes('bermasalah')) { colorArgb = 'FFF8CBAD'; fontColorArgb = 'FFC00000'; }
        else if (val.includes('risiko')) { colorArgb = 'FFFFF2CC'; fontColorArgb = 'FF7F6000'; }
        if (colorArgb) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorArgb } };
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: fontColorArgb } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

module.exports = { exportToExcel };
