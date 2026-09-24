import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialErrorBoundaryState,
  getDerivedStateFromError,
} from '../src/components/common/errorBoundaryCore.ts';

test('ErrorBoundary: state transition and error recovery logic', () => {
  assert.equal(typeof getDerivedStateFromError, 'function');
  assert.equal(initialErrorBoundaryState.hasError, false);
  assert.equal(initialErrorBoundaryState.error, null);

  const testError = new Error('Test crash');
  const derivedState = getDerivedStateFromError(testError);

  assert.equal(derivedState.hasError, true);
  assert.equal(derivedState.error, testError);
});
