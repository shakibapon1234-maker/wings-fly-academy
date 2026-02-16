// ===================================
// SUPABASE CONFIGURATION - CORRECTED
// Wings Fly Aviation Academy
// ===================================

const SUPABASE_CONFIG = {
  // Your Project URL
  url: 'https://gtoldrlbxjrwshubplfp.supabase.co',
  
  // Your anon public key (CORRECT KEY)
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk'
};

// Export for use in sync code
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

console.log('✅ Supabase config loaded');
console.log('📍 Project URL:', SUPABASE_CONFIG.url);
console.log('🔑 API Key configured successfully');
