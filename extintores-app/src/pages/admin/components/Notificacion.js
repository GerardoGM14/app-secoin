import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export function mostrarNotificacion({ icon = 'info', titulo = '', mensaje = '', posicion = 'top-end' }) {
  Swal.fire({
    icon,
    title: titulo,
    text: mensaje,
    toast: true,
    position: posicion,
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    customClass: {
      popup: 'rounded-xl shadow-md'
    }
  });
}
