// script.js - Versión mejorada con validaciones y seguridad
/*********************
 * CONFIGURACIÓN FIREBASE
 *********************/
const DEBUG = true;

// Objeto global para almacenar datos temporalmente
const datosEncuesta = {
    registro: null,
    respuestas: null
};

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
        const querySnapshot = await db.collection('encuestasCompletas')
            .where('registro.numTicket', '==', numTicket)
            .limit(1)
            .get();

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return {
                existe: true,
                datos: doc.data(),
                mensaje: `El ticket ${numTicket} ya fue registrado el ${doc.data().registro.fechaRegistro.toDate().toLocaleDateString()}`
            };
        }
        return { existe: false };
    } catch (error) {
        console.error("Error al validar ticket:", error);
        return {
            existe: true,
            mensaje: "Error al verificar el ticket. Por favor intenta nuevamente."
        };
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
        const telefono = document.getElementById('telefono').value || 'No proporcionado';
        const conociste = document.getElementById('conociste').value;


        // Validar si el ticket ya existe
        const validacionTicket = await validarTicket(numTicket);

        if (validacionTicket.existe) {
            mostrarError(document.getElementById('numTicket'), validacionTicket.mensaje);
            document.getElementById('numTicket').focus();
            return;
        }

        try {
            // Guardar datos en el objeto temporal
            datosEncuesta.registro = {
                numTicket,
                nombre,
                email,
                telefono,
                conociste,
                fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Guardar en sessionStorage
            sessionStorage.setItem('datosRegistro', JSON.stringify(datosEncuesta.registro));

            // Redirigir a la encuesta
            window.location.href = 'encuesta.html';
        } catch (error) {
            console.error("Error al guardar registro: ", error);
            mostrarError(document.getElementById('submitBtn'),
                "Ocurrió un error al registrar tus datos. Por favor intenta nuevamente.");
        }
    });
}

// Manejar encuesta (encuesta.html)
if (window.location.pathname.includes('encuesta.html')) {
    // script para evitar la navegación hacia atrás en encuesta.html
    window.history.pushState(null, null, document.URL);
    window.addEventListener('popstate', function () {
        window.history.pushState(null, null, document.URL);
    });

    // Recuperar datos de registro si existen
    const datosGuardados = sessionStorage.getItem('datosRegistro');
    if (datosGuardados) {
        datosEncuesta.registro = JSON.parse(datosGuardados);
    }

    document.getElementById('encuestaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        ocultarError();

        if (!datosEncuesta.registro) {
            mostrarError(document.querySelector('form'),
                "No se encontraron datos de registro. Por favor completa el formulario de registro primero.");
            setTimeout(() => window.location.href = 'index.html', 3000);
            return;
        }

        // Recoger respuestas de la encuesta
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
            fechaEncuesta: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            // Guardar datos completos en Firestore
            await db.collection('encuestasCompletas').add(datosEncuesta);

            // Limpiar sessionStorage
            sessionStorage.removeItem('datosRegistro');

            // Redirigir a página de agradecimiento
            window.location.href = 'cupon.html';
        } catch (error) {
            console.error("Error al guardar encuesta: ", error);
            mostrarError(document.querySelector('form'),
                "Ocurrió un error al enviar tu encuesta. Por favor intenta nuevamente.");
        }
    });
}

// Página de agradecimiento (cupon.html)
if (window.location.pathname.includes('cupon.html')) {
    // script para evitar la navegación hacia atrás en cupon.html
    window.history.pushState(null, null, document.URL);
    window.addEventListener('popstate', function () {
        window.history.pushState(null, null, document.URL);
    });

    document.addEventListener('DOMContentLoaded', () => {
        // Mostrar mensaje simple de agradecimiento
        const agradecimientoDiv = document.getElementById('agradecimiento');
        if (agradecimientoDiv) {
            agradecimientoDiv.innerHTML = `
                <h2>¡Gracias por completar nuestra encuesta!</h2>
                <p>Tu opinión es muy valiosa para nosotros.</p>
                <p>Número de ticket registrado: ${sessionStorage.getItem('lastTicket') || 'No disponible'}</p>
            `;
        }
        // Limpiar sessionStorage
        sessionStorage.removeItem('datosRegistro');
    });
}
//////////////////////////////////

const canvas = document.getElementById('rasparCanvas');
const ctx = canvas.getContext('2d');
const imagenRascar = new Image();
imagenRascar.src = 'imagenes/rasca_shanty.png'; // Reemplaza con la ruta de tu imagen

imagenRascar.onload = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.drawImage(imagenRascar, 0, 0, canvas.width, canvas.height);
};

function raspar(e) {
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (e.touches) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    }

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    ctx.fill();
}

canvas.addEventListener('mousemove', (e) => {
    if (e.buttons !== 0) {
        raspar(e);
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    raspar(e);
}, { passive: false });
