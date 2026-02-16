// ===================================
// SUPABASE CONFIGURATION
// Your Actual Credentials - Ready to Use!
// ===================================

const SUPABASE_CONFIG = {
  // Your Project URL
  url: 'https://gtoldrlbxjrwshubplfp.supabase.co',
  
  // Your anon public key
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmxieGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3OTg2NDAsImV4cCI6MjA1MzM3NDY0MH0.T5TrlL5xLUqzMUl7w-LChGxbICxTaRN0DuGnxZ-LLfs'
};

// Export for use in sync code
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

console.log('✅ Supabase config loaded');
console.log('📍 Using URL:', SUPABASE_CONFIG.url);
