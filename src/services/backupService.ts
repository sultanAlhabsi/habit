import { Share } from 'react-native';
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
 * Triggers native system share dialog with the backup JSON.
 */
export const exportBackupViaShare = async (payload: BackupPayload): Promise<boolean> => {
  try {
    const jsonString = JSON.stringify(payload, null, 2);
    const dateFormatted = dayjs(payload.exportedAt).format('YYYY-MM-DD');
    await Share.share({
      title: `نسخة احتياطية - إنجاز (${dateFormatted})`,
      message: jsonString,
    });
    return true;
  } catch (error) {
    console.warn('[BackupService] Share error:', error);
    return false;
  }
};

/**
 * Triggers native system share dialog with exported CSV content.
 */
export const exportCsvViaShare = async (
  csvContent: string,
  title = 'سجلات إنجاز - تقرير شامل'
): Promise<boolean> => {
  try {
    const todayStr = dayjs().format('YYYY-MM-DD');
    await Share.share({
      title: `${title} (${todayStr}).csv`,
      message: csvContent,
    });
    return true;
  } catch (error) {
    console.warn('[BackupService] CSV Share error:', error);
    return false;
  }
};

