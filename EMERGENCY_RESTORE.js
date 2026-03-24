/**
 * Placeholder — full offline backup is not shipped in production builds.
 * Restore from Settings export, Supabase backup, or a developer copy of the backup bundle.
 */
(function () {
  'use strict';
  window.emergencyRestoreManual = function () {
    console.warn(
      '[EMERGENCY_RESTORE] No bundled dataset in this build. Use cloud backup, JSON export, or a local restore script from secure storage.'
    );
  };
})();
