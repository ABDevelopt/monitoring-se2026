// backend/lib/settings.js
// Baca/tulis konfigurasi aplikasi dari settings.json

const fs = require('fs');
const path = require('path');

const SETTINGS_FILE_PATH = path.join(__dirname, '..', '..', 'settings.json');

const defaultSettings = {
  appName: process.env.APP_NAME || 'Monitoring SE2026 PPU',
  ewsThresholdHari: Number(process.env.EWS_THRESHOLD_HARI) || 2,
  periodeMulai: process.env.PERIODE_MULAI || '2026-06-15',
  periodeSelesai: process.env.PERIODE_SELESAI || '2026-08-31',
};

function getSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Failed to read settings file, using defaults:', error);
  }
  return defaultSettings;
}

function saveSettings(settings) {
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (error) {
    console.error('Failed to write settings file:', error);
    throw new Error('Gagal menyimpan konfigurasi ke file.');
  }
}

module.exports = { getSettings, saveSettings };
