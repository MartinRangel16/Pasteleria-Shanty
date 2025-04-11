import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

async function validarTicket(numTicket) {
    try {
        const { data, error } = await supabase
            .from('registros')
            .select('numTicket')
            .eq('numTicket', numTicket)
            .limit(1);

        if (error) {
            console.error("Error al validar ticket:", error);
            return { existe: true, mensaje: "Error al verificar el ticket. Por favor intenta nuevamente." };
        }

        return { existe: data && data.length > 0, mensaje: data && data.length > 0 ? `El ticket ${numTicket} ya fue registrado.` : '' };
    } catch (error) {
        console.error("Error inesperado al validar ticket:", error);
        return { existe: true, mensaje: "Error inesperado al verificar el ticket." };
    }
}

if (document.getElementById('registroForm')) {
    const registroForm = document.getElementById('registroForm');
    const numTicketInput = document.getElementById('numTicket');
    const submitBtn = document.getElementById('submitBtn');
    const ticketFeedbackDiv = document.getElementById('ticketFeedback') || document.createElement('div');
    ticketFeedbackDiv.id = 'ticketFeedback';
    if (numTicketInput && !document.getElementById('ticketFeedback')) {
        numTicketInput.parentNode.appendChild(ticketFeedbackDiv);
    }

    if (numTicketInput) {
        numTicketInput.addEventListener('blur', async function() {
            const numTicket = this.value.trim();
            if (numTicket) {
                const validacion = await validarTicket(numTicket);
                if (validacion.existe) {
                    ticketFeedbackDiv.textContent = '⚠ ' + validacion.mensaje;
                    ticketFeedbackDiv.style.color = 'red';
                    if (submitBtn) submitBtn.disabled = true;
                } else {
                    ticketFeedbackDiv.textContent = '✓ Ticket válido';
                    ticketFeedbackDiv.style.color = 'green';
                    if (submitBtn) submitBtn.disabled = false;
                }
            } else {
                ticketFeedbackDiv.textContent = '';
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        ocultarError();

        const numTicket = parseInt(registroForm.querySelector('#numTicket').value);
        const nombre = registroForm.querySelector('#nombre').value;
        const email = registroForm.querySelector('#email').value;
        const telefono = parseInt(registroForm.querySelector('#telefono').value) || null;
        const conociste = registroForm.querySelector('#conociste').value;

        const validacionTicket = await validarTicket(numTicket);
        if (validacionTicket.existe) {
            mostrarError(numTicketInput, validacionTicket.mensaje);
            numTicketInput.focus();
            return;
        }

        try {
            const { data, error } = await supabase
                .from('registros')
                .insert([{ numTicket, nombre, email, telefono, conociste }])
                .select('id');

            if (error) {
                console.error("Error al registrar:", error);
                mostrarError(submitBtn, "Ocurrió un error al registrar. Intenta de nuevo.");
                return;
            }

            sessionStorage.setItem('registroId', data[0].id);
            window.location.href = 'encuesta.html';

        } catch (error) {
            console.error("Error inesperado al registrar:", error);
            mostrarError(submitBtn, "Ocurrió un error inesperado.");
        }
    });
}

if (document.getElementById('encuestaForm')) {
    const encuestaForm = document.getElementById('encuestaForm');
    encuestaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        ocultarError();

        const registroId = sessionStorage.getItem('registroId');
        if (!registroId) {
            mostrarError(encuestaForm, "No se encontró la información de registro. Por favor, regresa al formulario de registro.");
            setTimeout(() => window.location.href = 'index.html', 3000);
            return;
        }

        const respuestas = {
            registro_id: registroId,
            p1: encuestaForm.querySelector('input[name="p1"]:checked')?.value || null,
            p2: encuestaForm.querySelector('input[name="p2"]:checked')?.value || null,
            p3: encuestaForm.querySelector('input[name="p3"]:checked')?.value || null,
            p4: encuestaForm.querySelector('input[name="p4"]:checked')?.value || null,
            p5: encuestaForm.querySelector('input[name="p5"]:checked')?.value || null,
            p6: encuestaForm.querySelector('input[name="p6"]:checked')?.value || null,
            p7: encuestaForm.querySelector('input[name="p7"]:checked')?.value || null,
            p8: encuestaForm.querySelector('input[name="p8"]:checked')?.value || null,
            sugerencias: encuestaForm.querySelector('textarea[name="sugerencias"]').value || null,
            fechaEncuesta: new Date().toISOString()
        };

        try {
            const { error } = await supabase
                .from('respuestas_encuesta')
                .insert([respuestas]);

            if (error) {
                console.error("Error al guardar la encuesta:", error);
                mostrarError(encuestaForm, "Ocurrió un error al enviar la encuesta. Intenta de nuevo.");
                return;
            }

            sessionStorage.removeItem('registroId');
            window.location.href = 'cupon.html';

        } catch (error) {
            console.error("Error inesperado al guardar la encuesta:", error);
            mostrarError(encuestaForm, "Ocurrió un error inesperado al enviar la encuesta.");
        }
    });
}

if (window.location.pathname.includes('cupon.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const codigoCuponDiv = document.getElementById('codigo-cupon');
        if (codigoCuponDiv) {
            codigoCuponDiv.textContent = 'CUPON-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        }
        const disponiblesDiv = document.getElementById('disponibles');
        if (disponiblesDiv) {
            disponiblesDiv.textContent = 'Cupones disponibles: Muchos (Generado dinámicamente)';
        }
    });
}
