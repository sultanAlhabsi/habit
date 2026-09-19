import test from 'node:test';
import assert from 'node:assert/strict';
import {
  showAppAlert,
  hideAppAlert,
  subscribeAlert,
  appAlert,
  showConfirmAlert,
} from '../src/services/alertService.ts';
import type { AlertOptions } from '../src/services/alertService.ts';

test('alertService: notifies subscribers when alert is shown and hidden', () => {
  let receivedAlert: AlertOptions | null = null;
  const unsubscribe = subscribeAlert((alert) => {
    receivedAlert = alert;
  });

  showAppAlert({
    title: 'تنبيه اختباري',
    message: 'هذه رسالة اختبارية',
  });

  assert.ok(receivedAlert !== null);
  assert.equal(receivedAlert?.title, 'تنبيه اختباري');
  assert.equal(receivedAlert?.message, 'هذه رسالة اختبارية');

  hideAppAlert();
  assert.equal(receivedAlert, null);

  unsubscribe();
});

test('alertService: correctly infers destructive type and trash icon for deletion alerts', () => {
  let receivedAlert: AlertOptions | null = null;
  const unsubscribe = subscribeAlert((alert) => {
    receivedAlert = alert;
  });

  showConfirmAlert({
    title: 'حذف العادة',
    message: 'هل أنت متأكد من حذف العادة؟',
    isDestructive: true,
    onConfirm: () => {},
  });

  assert.ok(receivedAlert !== null);
  assert.equal(receivedAlert?.type, 'destructive');
  assert.equal(receivedAlert?.icon, 'trash-outline');
  assert.equal(receivedAlert?.buttons?.length, 2);
  assert.equal(receivedAlert?.buttons?.[0].text, 'إلغاء');
  assert.equal(receivedAlert?.buttons?.[1].text, 'تأكيد');
  assert.equal(receivedAlert?.buttons?.[1].style, 'destructive');

  hideAppAlert();
  unsubscribe();
});

test('alertService: correctly infers error and warning types based on text content', () => {
  let receivedAlert: AlertOptions | null = null;
  const unsubscribe = subscribeAlert((alert) => {
    receivedAlert = alert;
  });

  appAlert('خطأ في الاتصال', 'تعذر تحميل البيانات');
  assert.equal(receivedAlert?.type, 'error');
  assert.equal(receivedAlert?.icon, 'alert-circle-outline');

  appAlert('تنبيه هام', 'يرجى حفظ البيانات أولاً');
  assert.equal(receivedAlert?.type, 'warning');
  assert.equal(receivedAlert?.icon, 'warning-outline');

  appAlert('تم الحفظ بنجاح', 'تمت العملية');
  assert.equal(receivedAlert?.type, 'success');
  assert.equal(receivedAlert?.icon, 'checkmark-circle-outline');

  hideAppAlert();
  unsubscribe();
});
