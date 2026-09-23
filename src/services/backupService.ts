import * as FileSystem from 'expo-file-system/legacy';
import { Share, Platform } from 'react-native';
import dayjs from 'dayjs';
import {
  BackupPayload,
  ValidationResult,
  createBackupPayload,
  validateBackupJson,
  mergeBackupData,
} from '../utils/backupUtils.ts';

export * from '../utils/backupUtils.ts';

/**
 * Triggers native system share dialog with the backup JSON file.
 * Writes to a temporary file in cacheDirectory to avoid Android Binder 1MB transaction buffer overflow.
 */
export const exportBackupViaShare = async (payload: BackupPayload): Promise<boolean> => {
  try {
    const jsonString = JSON.stringify(payload, null, 2);
    const dateFormatted = dayjs(payload.exportedAt).format('YYYY-MM-DD');
    const fileName = `enjaz_backup_${dateFormatted}.json`;

    if (FileSystem.cacheDirectory) {
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Share.share(
        Platform.OS === 'ios'
          ? { url: fileUri, title: `نسخة احتياطية - إنجاز (${dateFormatted})` }
          : { title: `نسخة احتياطية - إنجاز (${dateFormatted})`, url: fileUri }
      );
      return true;
    }
    // Fallback to text message only if filesystem is unavailable
    await Share.share({ title: `نسخة احتياطية - إنجاز (${dateFormatted})`, message: jsonString });
    return true;
  } catch (error) {
    console.warn('[BackupService] Share error:', error);
    return false;
  }
};

/**
 * Triggers native system share dialog with exported CSV content.
 * Writes to a temporary file in cacheDirectory and ensures UTF-8 BOM (\uFEFF)
 * is prepended so Arabic text renders flawlessly in Excel.
 */
export const exportCsvViaShare = async (
  csvContent: string,
  title = 'سجلات إنجاز - تقرير شامل'
): Promise<boolean> => {
  try {
    const todayStr = dayjs().format('YYYY-MM-DD');
    const cleanTitle = (title || 'تقرير_إنجاز').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_');
    const fileName = `${cleanTitle}_${todayStr}.csv`;

    // Ensure UTF-8 BOM is present so Excel on Windows/Mac renders Arabic flawlessly
    const contentWithBOM = csvContent.startsWith('\uFEFF') ? csvContent : '\uFEFF' + csvContent;

    if (FileSystem.cacheDirectory) {
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, contentWithBOM, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Share.share(
        Platform.OS === 'ios'
          ? { url: fileUri, title: `${title} (${todayStr})` }
          : { title: `${title} (${todayStr})`, url: fileUri }
      );
      return true;
    }
    await Share.share({ title: `${title} (${todayStr}).csv`, message: contentWithBOM });
    return true;
  } catch (error) {
    console.warn('[BackupService] CSV Share error:', error);
    return false;
  }
};

/**
 * Opens system document picker to select a backup JSON file, reads it and validates its format.
 */
export const pickAndReadBackupFile = async (): Promise<{
  canceled?: boolean;
  valid?: boolean;
  data?: any;
  error?: string;
  fileName?: string;
}> => {
  try {
    let DocumentPicker: any = null;
    try {
      DocumentPicker = require('expo-document-picker');
    } catch {
      DocumentPicker = null;
    }

    if (!DocumentPicker || typeof DocumentPicker.getDocumentAsync !== 'function') {
      return { valid: false, error: 'أداة اختيار الملفات غير متوفرة في النظام الحالي.' };
    }

    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/json', '*/*'],
      copyToCacheDirectory: true,
    });

    if (res.canceled || !res.assets || res.assets.length === 0) {
      return { canceled: true };
    }

    const asset = res.assets[0];
    const fileContent = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const validation = validateBackupJson(fileContent);
    if (!validation.valid) {
      return { valid: false, error: validation.error, fileName: asset.name };
    }

    return { valid: true, data: validation.data, fileName: asset.name };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.' };
  }
};


