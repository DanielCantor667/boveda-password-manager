const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tczfwoysbqcicqkblkdn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjemZ3b3lzYnFjaWNxa2Jsa2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTM4OTUsImV4cCI6MjA5NTI4OTg5NX0.MeDtHzbBapHid99nBKv8kNYJT8iSWbWfK1hVXdQp3KE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = supabase;
