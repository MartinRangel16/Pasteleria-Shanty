import { createClient } from '@supabase/supabase-js';

// Asegúrate de reemplazar con tus credenciales en supabase-config.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================= FUNCIONES UTILITARIAS =================

function mostrarError(elemento, mensaje) {
    const errorDiv = document.getElementById('errorMessage') || document.createElement('div');
    errorDiv.id = 'errorMessage';
    errorDiv.className = 'error-message';
    errorDiv.textContent = mensaje;
    errorDiv.style.display = 'block';

    if (!document.getElementById('errorMessage')) {
        elemento.parentNode.insertBefore(errorDiv, elemento.nextSibling);
    }
}

function ocultarError() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) errorDiv.style.display = 'none';
}

// ================= VALIDACIÓN DE TICKETS =================

async function validarTicket(numTicket) {
    try {
        const { data, error } = await supabase
            .from('registros')
            .select('numTicket, fechaRegistro')
            .eq('numTicket', numTicket)
            .limit(1);

        if (error) {
            console.error("Error al validar ticket:", error);
            return { existe: true, mensaje: "Error al verificar el ticket. Por favor intenta nuevamente." };
        }

        if (data && data.length > 0) {
            return {
                existe: true,
                datos: data[0],
                mensaje: `El ticket ${numTicket} ya fue registrado el ${new Date(data[0].fechaRegistro).toLocaleDateString()}`
            };
        }

        return { existe: false };
    } catch (error) {
        console.error("Error inesperado al validar ticket:", error);
        return { existe: true, mensaje: "Error inesperado al verificar el ticket." };
    }
}

// Validación en tiempo real del ticket
if (document.getElementById('numTicket')) {
    document.getElementById('numTicket').addEventListener('blur', async function() {
        const numTicket = this.value.trim();
        const feedbackDiv = document.getElementById('ticketFeedback') || document.createElement('div');
        feedbackDiv.id = 'ticketFeedback';

        if (!document.getElementById('ticketFeedback')) {
            this.parentNode.appendChild(feedbackDiv);
        }

        if (numTicket.length > 0) {
            const validacion = await validarTicket(numTicket);
            if (validacion.existe) {
                feedbackDiv.textContent = '⚠ ' + validacion.mensaje;
                feedbackDiv.style.color = 'red';
                document.getElementById('submitBtn').disabled = true;
            } else {
                feedbackDiv.textContent = '✓ Ticket válido';
                feedbackDiv.style.color = 'green';
                document.getElementById('submitBtn').disabled = false;
            }
        } else {
            feedbackDiv.textContent = ''; // Limpiar el mensaje si el campo está vacío
        }
    });
}

// ================= MANEJO DE FORMULARIOS =================

// Manejar registro (index.html)
if (document.getElementById('registroForm')) {
    document.getElementById('registroForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        ocultarError();

        const numTicket = document.getElementById('numTicket').value;
        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const telefono = document.getElementById('telefono').value || null;
        const conociste = document.getElementById('conociste').value;

        const validacionTicket = await validarTicket(numTicket);

        if (validacionTicket.existe) {
            mostrarError(document.getElementById('numTicket'), validacionTicket.mensaje);
            document.getElementById('numTicket').focus();
            return;
        }

        try {
            const { data, error } = await supabase
                .from('registros')
                .insert([
                    { numTicket, nombre, email, telefono, conociste }
                ])
                .select('id'); // Seleccionamos el ID del registro insertado

            if (error) {
                console.error("Error al guardar registro:", error);
                mostrarError(document.getElementById('submitBtn'),
                    "Ocurrió un error al registrar tus datos. Por favor intenta nuevamente.");
                return;
            }

            // Guardar el ID del registro en sessionStorage para la encuesta
            sessionStorage.setItem('registroId', data[0].id);

            // Redirigir a la encuesta
            window.location.href = 'encuesta.html';

        } catch (error) {
            console.error("Error inesperado al guardar registro:", error);
            mostrarError(document.getElementById('submitBtn'),
                "Ocurrió un error inesperado al registrar tus datos.");
        }
    });
}

// Manejar encuesta (encuesta.html)
if (document.getElementById('encuestaForm')) {
    document.getElementById('encuestaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        ocultarError();

        const registroId = sessionStorage.getItem('registroId');
        if (!registroId) {
            mostrarError(document.querySelector('form'),
                "No se encontraron datos de registro. Por favor completa el formulario de registro primero.");
            setTimeout(() => window.location.href = 'index.html', 3000);
            return;
        }

        const respuestas = {
            registro_id: registroId,
            p1: document.querySelector('input[name="p1"]:checked')?.value || null,
            p2: document.querySelector('input[name="p2"]:checked')?.value || null,
            p3: document.querySelector('input[name="p3"]:checked')?.value || null,
            p4: document.querySelector('input[name="p4"]:checked')?.value || null,
            p5: document.querySelector('input[name="p5"]:checked')?.value || null,
            p6: document.querySelector('input[name="p6"]:checked')?.value || null,
            p7: document.querySelector('input[name="p7"]:checked')?.value || null,
            p8: document.querySelector('input[name="p8"]:checked')?.value || null,
            sugerencias: document.querySelector('textarea[name="sugerencias"]').value || null,
            fechaEncuesta: new Date().toISOString() // Puedes usar la hora del cliente o la del servidor al insertar
        };

        try {
            const { error } = await supabase
                .from('respuestas_encuesta')
                .insert([respuestas]);

            if (error) {
                console.error("Error al guardar encuesta:", error);
                mostrarError(document.querySelector('form'),
                    "Ocurrió un error al enviar tu encuesta. Por favor intenta nuevamente.");
                return;
            }

            // Limpiar sessionStorage después de enviar la encuesta
            sessionStorage.removeItem('registroId');

            // Redirigir a página de agradecimiento
            window.location.href = 'cupon.html';

        } catch (error) {
            console.error("Error inesperado al guardar encuesta:", error);
            mostrarError(document.querySelector('form'),
                "Ocurrió un error inesperado al enviar tu encuesta.");
        }
    });
}

// Página de agradecimiento (cupon.html) - Lógica básica de ejemplo
if (window.location.pathname.includes('cupon.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const contenidoCuponDiv = document.getElementById('contenido-cupon');
        const sinCuponesDiv = document.getElementById('sin-cupones');
        const codigoCuponDiv = document.getElementById('codigo-cupon');
        const disponiblesDiv = document.getElementById('disponibles');

        // Lógica de ejemplo para mostrar un cupón (necesitarás tu propia implementación)
        const mostrarCupon = true; // Simula si hay cupones disponibles

        if (mostrarCupon) {
            const codigoGenerado = Math.random().toString(36).substring(2, 10).toUpperCase();
            codigoCuponDiv.textContent = codigoGenerado;
            disponiblesDiv.textContent = 'Cupones disponibles: Muchos (simulado)';
            contenidoCuponDiv.style.display = 'block';
            sinCuponesDiv.style.display = 'none';
        } else {
            contenidoCuponDiv.style.display = 'none';
            sinCuponesDiv.style.display = 'block';
        }
    });
}
