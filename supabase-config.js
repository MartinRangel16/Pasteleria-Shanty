// Configuración segura para GitHub Pages
(function() {
    // 1. Configuración de Supabase - Reemplaza con tus valores
    const supabaseUrl = 'https://wasjhyzmnbmfgmwgqfym.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhc2poeXptbmJtZmdtd2dxZnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMzQ0MTMsImV4cCI6MjA1OTkxMDQxM30.pf5IwTf40--nPZr_Msq_YQuC_pDgSA8Ck5X8HsvTDyw';
    
    
    // 2. Verificar si estamos en GitHub Pages
    const isGitHubPages = window.location.host.includes('github.io');
    
    // 3. Configuración adicional para producción
    const config = {
        auth: {
        // Para GitHub Pages necesitamos almacenar la sesión de manera diferente
        storage: isGitHubPages ? localStorage : sessionStorage,
        detectSessionInUrl: !isGitHubPages,
        autoRefreshToken: true,
        persistSession: true
        }
    };
    
    // 4. Crear e inicializar el cliente Supabase
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, config);
    
    console.log('Supabase configurado para:', isGitHubPages ? 'GitHub Pages' : 'Desarrollo local');
    })();






