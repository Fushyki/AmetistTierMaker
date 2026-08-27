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
    background: '#16161a',
    color: '#ffffff',
    customClass: {
      popup: 'swal-custom-popup',
    },
  });

  return result.isConfirmed;
};

export const promptInput = async ({
  title = 'Nome da Tier List',
  text = 'Digite um nome para a sua lista:',
  defaultValue = '',
  placeholder = 'Digite o nome aqui...',
  confirmButtonText = 'Confirmar',
  cancelButtonText = 'Cancelar'
} = {}) => {
  const result = await MySwal.fire({
    title,
    text,
    input: 'text',
    inputValue: defaultValue,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonColor: '#b062eb',
    cancelButtonColor: '#383842',
    confirmButtonText,
    cancelButtonText,
    background: '#16161a',
    color: '#ffffff',
    customClass: {
      popup: 'swal-custom-popup',
      input: 'swal-custom-input'
    },
    inputAttributes: {
      autocapitalize: 'off',
      autocorrect: 'off'
    },
    inputValidator: (value) => {
      if (!value || !value.trim()) {
        return 'O nome não pode ficar vazio.';
      }
    }
  });

  if (result.isConfirmed && result.value) {
    return result.value.trim();
  }
  return null;
};

