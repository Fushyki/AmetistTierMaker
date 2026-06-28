import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const confirmAction = async (title, text, confirmButtonText = 'Sim, continuar', isDestructive = true) => {
  const result = await MySwal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: isDestructive ? '#d33' : '#b062eb',
    cancelButtonColor: '#3085d6',
    confirmButtonText: confirmButtonText,
    cancelButtonText: 'Cancelar',
    background: '#1a1a1c',
    color: '#ffffff',
    customClass: {
      popup: 'swal-custom-popup',
    },
  });

  return result.isConfirmed;
};
