import toast from 'react-hot-toast';

/**
 * Exporta o tabuleiro como imagem PNG de alta fidelidade com modo limpo.
 */
export async function exportBoardAsImage(filename = 'minha-tierlist.png', elementId = 'board') {
  try {
    const htmlToImage = await import('html-to-image');
    const boardElement = document.getElementById(elementId);
    if (!boardElement) {
      toast.error('Elemento do tabuleiro não encontrado.');
      return;
    }

    boardElement.classList.add('clean-mode');

    const dataUrl = await htmlToImage.toPng(boardElement, {
      backgroundColor: '#161618',
      pixelRatio: 1,
      cacheBust: true,
    });

    boardElement.classList.remove('clean-mode');

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
    toast.success('Imagem exportada com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar imagem:', error);
    toast.error('Houve um erro ao gerar a imagem: ' + (error.message || error));
  }
}
