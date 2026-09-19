import * as FileSystem from 'expo-file-system/legacy';
import { Share, Platform } from 'react-native';
import dayjs from 'dayjs';
import {
  BackupPayload,
  ValidationResult,
  createBackupPayload,
  validateBackupJson,
  mergeBackupData,
} from '../utils/backupUtils';

export * from '../utils/backupUtils';

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


