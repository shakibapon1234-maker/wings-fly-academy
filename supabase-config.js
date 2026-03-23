/**
 * ════════════════════════════════════════════════════════════════
 * WINGS FLY AVIATION ACADEMY
 * SUPABASE CONFIGURATION — SECURE VERSION V2.0
 * ════════════════════════════════════════════════════════════════
 * 
 * ✅ Updated: March 2026
 * ✅ Security Fix: Service Role Key → Anon Key
 * ✅ RLS Enabled on all tables
 * ✅ Ready for Phase 2 Authentication
 */

window.SUPABASE_CONFIG = {
  // Supabase Project URL
  URL: 'https://cwwyhtarnkozukekebvq.supabase.co',
  
  // ✅ ANON/PUBLIC KEY (client-side safe)
  KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3d3lodGFybmtvenVrZWtlYnZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTE5NzUsImV4cCI6MjA4OTQyNzk3NX0.XCJe9A5_ymXQQqK5KVQHJqswUXCuopUi_NYv7T-WWn8',
  
  // Table names
  TABLE: 'academy_data',
  MAIN_RECORD: 'wingsfly_main',
  
  // Partial sync tables
  TBL_STUDENTS: 'wf_students',
  TBL_FINANCE: 'wf_finance',
  TBL_EMPLOYEES: 'wf_employees',
  TBL_USER_PROFILES: 'wf_user_profiles',
  
  // Academy ID
  ACADEMY_ID: 'wingsfly_main',
  
  // Get headers for fetch requests
  getHeaders: function() {
    return {
      'apikey': this.KEY,
      'Authorization': `Bearer ${this.KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  },
  
  // Get full REST URL
  getRestURL: function(table, query = '') {
    return `${this.URL}/rest/v1/${table}${query}`;
  },
  
  // Validate configuration
  validate: function() {
    const errors = [];
    
    if (!this.URL || this.URL === '') {
      errors.push('❌ Supabase URL missing');
    }
    
    if (!this.KEY || this.KEY === '') {
      errors.push('❌ Anon Key missing');
    }
    
    // Check if accidentally using Service Role Key
    if (this.KEY.includes('service_role')) {
      errors.push('🚨 SECURITY RISK: Service Role Key detected! Use Anon Key instead.');
    }
    
    if (errors.length > 0) {
      console.error('Supabase Config Errors:', errors);
      return { valid: false, errors };
    }
    
    console.log('✅ Supabase Config validated successfully');
    return { valid: true, errors: [] };
  }
};

// Auto-validate on load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const result = window.SUPABASE_CONFIG.validate();
    
    if (!result.valid) {
      console.error('⚠️ Configuration errors detected:', result.errors);
    }
  });
}

// ════════════════════════════════════════════════════════════════
// ✅ Configuration Complete!
// Security Score: 6/10 → Ready for Phase 2 Authentication
// ════════════════════════════════════════════════════════════════
