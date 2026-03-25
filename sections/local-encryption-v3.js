/**
 * ════════════════════════════════════════════════════════════════
 * WINGS FLY AVIATION ACADEMY
 * PHASE 3: SYNCHRONOUS LOCALSTORAGE ENCRYPTION HOOK
 * ════════════════════════════════════════════════════════════════
 * 
 * Intercepts localStorage.setItem and getItem globally.
 * Encrypts/Decrypts 'wingsfly_data' transparently using CryptoJS.
 * Requires: crypto-js library
 */

(function () {
  'use strict';

  if (!window.CryptoJS) {
    console.warn('[StorageEncryption] CryptoJS not found! Data will not be encrypted.');
    return;
  }

  if (window._wfEncryptionHookLoaded) return;
  window._wfEncryptionHookLoaded = true;

  const ENC_PREFIX = 'WF_ENC_V1::';

  // Use the secret key from config-secret.js, or a fallback.
  function getEncryptionKey() {
    return window.WINGS_SECRET_KEY || 'WingsFlyDefaultFallbackSecureKey2026';
  }

  // Preserve original methods
  const originalSetItem = Storage.prototype.setItem;
  const originalGetItem = Storage.prototype.getItem;

  // ── HOOK GETITEM ──
  Storage.prototype.getItem = function (key) {
    const rawValue = originalGetItem.call(this, key);

    // Only decrypt our target keys
    if (key === 'wingsfly_data' || key === 'wf_audit_logs') {
      if (typeof rawValue === 'string' && rawValue.startsWith(ENC_PREFIX)) {
        try {
          // It's encrypted, let's decrypt
          const encryptedText = rawValue.slice(ENC_PREFIX.length);
          const decryptedBytes = window.CryptoJS.AES.decrypt(encryptedText, getEncryptionKey());
          const decryptedJSON = decryptedBytes.toString(window.CryptoJS.enc.Utf8);
          
          if (!decryptedJSON) {
            throw new Error('Decryption resulted in empty string (wrong key or broken data).');
          }
          return decryptedJSON;
        } catch (e) {
          console.error(`[StorageEncryption] Failed to decrypt ${key}:`, e);
          // Return null if we can't decrypt so app doesn't crash on garbage data.
          // Emergency restore will kick in if it's wingsfly_data.
          return null; 
        }
      }
    }

    // Return as is for everything else
    return rawValue;
  };

  // ── HOOK SETITEM ──
  Storage.prototype.setItem = function (key, value) {
    if ((key === 'wingsfly_data' || key === 'wf_audit_logs') && typeof value === 'string') {
      try {
        const encryptedText = window.CryptoJS.AES.encrypt(value, getEncryptionKey()).toString();
        originalSetItem.call(this, key, ENC_PREFIX + encryptedText);
        return; // Success
      } catch (e) {
        console.error(`[StorageEncryption] Failed to encrypt ${key}:`, e);
        // Fallback to storing plaintext securely
      }
    }

    // Store normally
    originalSetItem.call(this, key, value);
  };

  console.log('[StorageEncryption] 🔐 LocalStorage Hook Active: wingsfly_data is now encrypted');

  // Trigger immediate encryption on load if plaintext exists!
  try {
    const existingUnencrypted = originalGetItem.call(window.localStorage, 'wingsfly_data');
    if (existingUnencrypted && existingUnencrypted.startsWith('{')) {
      console.log('[StorageEncryption] Found plaintext wingsfly_data. Encrypting now...');
      Storage.prototype.setItem.call(window.localStorage, 'wingsfly_data', existingUnencrypted);
      console.log('[StorageEncryption] ✅ Migration to encrypted storage complete.');
    }
  } catch(e) { /* ignore */ }

})();
