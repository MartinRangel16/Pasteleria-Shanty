// ================= CONFIGURACIÓN INICIAL =================
const DEBUG = true;
const GITHUB_PAGES = window.location.host.includes('github.io');
const STORAGE = GITHUB_PAGES ? localStorage : sessionStorage;

// Objeto para almacenar datos temporales
const datosEncuesta = {
    registro: null,
    respuestas: null
};

// ================= FUNCIONES UTILITARIAS =================

/**
 * Muestra un mensaje de error en la interfaz
 * @param {HTMLElement} elemento - Elemento donde aparecerá el error
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarError(elemento, mensaje) {
    const errorDiv = document.getElementById('error-message') || document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.className = 'error-message';
    errorDiv.textContent = mensaje;
    
    if (!document.getElementById('error-message')) {
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(errorDiv, container.firstChild);
    }

  // Auto-ocultar después de 5 segundos (solo en GitHub Pages)
    if (GITHUB_PAGES) {
    setTimeout(() => errorDiv.remove(), 5000);
    }
}

/**
 * Valida si un ticket ya fue registrado
 * @param {string} numTicket - Número de ticket a validar
 * @returns {Promise<{existe: boolean, datos?: any, mensaje?: string}>}
 */
async function validarTicket(numTicket) {
    try {
    const { data, error } = await supabase
        .from('encuestasCompletas')
        .select('id, registro->numTicket, registro->fechaRegistro')
        .eq('registro->>numTicket', numTicket)
        .limit(1);

    if (error) throw error;
    
    return {
        existe: data?.length > 0,
        datos: data?.[0],
        mensaje: data?.length > 0 
        ? `⚠ El ticket ${numTicket} ya fue registrado` 
        : '✓ Ticket válido'
    };
    } catch (error) {
    console.error("Error al validar ticket:", error);
    return {
        existe: true,
        mensaje: "❌ Error al verificar el ticket. Recarga la página."
    };
    }
}

// ================= MANEJO DE FORMULARIOS =================

// 📌 1. FORMULARIO DE REGISTRO (index.html)
if (document.getElementById('registroForm')) {
  // Validación en tiempo real del ticket
    document.getElementById('numTicket').addEventListener('blur', async function() {
    const numTicket = this.value.trim();
    if (!numTicket) return;

    const feedbackDiv = document.getElementById('ticketFeedback') || document.createElement('div');
    feedbackDiv.id = 'ticketFeedback';
    this.parentNode.appendChild(feedbackDiv);

    const validacion = await validarTicket(numTicket);
    feedbackDiv.textContent = validacion.mensaje;
    feedbackDiv.style.color = validacion.existe ? 'red' : 'green';
    document.getElementById('submitBtn').disabled = validacion.existe;
    });

  // Envío del formulario
    document.getElementById('registroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        numTicket: document.getElementById('numTicket').value.trim(),
        nombre: document.getElementById('nombre').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefono: document.getElementById('telefono').value.trim() || 'No proporcionado',
        conociste: document.getElementById('conociste').value,
        fechaRegistro: new Date().toISOString(),
        origen: GITHUB_PAGES ? 'GitHub Pages' : 'Local'
    };

    // Validar ticket
    const validacion = await validarTicket(formData.numTicket);
    if (validacion.existe) {
        mostrarError(document.getElementById('numTicket'), validacion.mensaje);
        return;
    }

    // Guardar en storage y redirigir
    datosEncuesta.registro = formData;
    STORAGE.setItem('datosRegistro', JSON.stringify(formData));
    window.location.href = 'encuesta.html';
    });
}

// 📌 2. FORMULARIO DE ENCUESTA (encuesta.html)
if (document.getElementById('encuestaForm')) {
  // Recuperar datos del registro
    const datosGuardados = STORAGE.getItem('datosRegistro');
    if (!datosGuardados) {
    mostrarError(document.querySelector('.container'), "❌ No se encontraron datos. Redirigiendo...");
    setTimeout(() => window.location.href = 'index.html', 2000);
    } else {
    datosEncuesta.registro = JSON.parse(datosGuardados);
    }

  // Envío de la encuesta
    document.getElementById('encuestaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Recoger respuestas
    datosEncuesta.respuestas = {
        p1: document.querySelector('input[name="p1"]:checked')?.value || 'No respondida',
        p2: document.querySelector('input[name="p2"]:checked')?.value || 'No respondida',
        p3: document.querySelector('input[name="p3"]:checked')?.value || 'No respondida',
        p4: document.querySelector('input[name="p4"]:checked')?.value || 'No respondida',
        p5: document.querySelector('input[name="p5"]:checked')?.value || 'No respondida',
        p6: document.querySelector('input[name="p6"]:checked')?.value || 'No respondida',
        p7: document.querySelector('input[name="p7"]:checked')?.value || 'No respondida',
        p8: document.querySelector('input[name="p8"]:checked')?.value || 'No respondida',
        sugerencias: document.querySelector('textarea[name="sugerencias"]').value || 'Sin sugerencias',
        fechaEncuesta: new Date().toISOString()
    };

    try {
      // Guardar en Supabase
        const { error } = await supabase
        .from('encuestasCompletas')
        .insert([datosEncuesta]);

        if (error) throw error;

      // Limpiar y redirigir
        STORAGE.removeItem('datosRegistro');
        window.location.href = 'cupon.html';
    } catch (error) {
        mostrarError(document.querySelector('.container'), "❌ Error al enviar. Intenta nuevamente.");
        console.error("Error al guardar encuesta:", error);
    }
    });
}

// 📌 3. PÁGINA DE CUPÓN (cupon.html)
if (window.location.pathname.includes('cupon.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
    STORAGE.removeItem('datosRegistro'); // Limpiar datos

    try {
      // Obtener un cupón disponible
        const { data: cupon, error } = await supabase
        .from('cupones')
        .select('*')
        .eq('usado', false)
        .limit(1)
        .single();

        if (error || !cupon) throw error;

      // Mostrar cupón
        document.getElementById('codigo-cupon').textContent = cupon.codigo;

      // Actualizar como usado
        await supabase
        .from('cupones')
        .update({ usado: true, fecha_uso: new Date().toISOString() })
        .eq('id', cupon.id);

      // Contar cupones restantes
        const { count } = await supabase
        .from('cupones')
        .select('*', { count: 'exact', head: true })
        .eq('usado', false);

        document.getElementById('disponibles').textContent = `Cupones disponibles: ${count}`;
    } catch (error) {
        document.getElementById('contenido-cupon').style.display = 'none';
        document.getElementById('sin-cupones').style.display = 'block';
    }
    });
}