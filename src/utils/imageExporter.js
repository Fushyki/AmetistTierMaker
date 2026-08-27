import { toast } from './notifications';
import { getThemeById } from '../data/themes';

/**
 * Exporta o tabuleiro como imagem PNG de alta fidelidade nos formatos:
 * - 'landscape' (16:9 clássico para PC/Twitter/YouTube)
 * - 'story' (9:16 vertical otimizado para TikTok/Instagram Stories/Reels)
 */
export async function exportBoardAsImage(filename = 'minha-tierlist.png', elementId = 'board', format = 'landscape', options = {}) {
  try {
    const htmlToImage = await import('html-to-image');
    const boardElement = document.getElementById(elementId);
    if (!boardElement) {
      toast.error('Elemento do tabuleiro não encontrado.');
      return;
    }

    boardElement.classList.add('clean-mode');

    let dataUrl;

    if (format === 'story') {
      const themeObj = getThemeById(options.theme || 'ametist');
      const accent = themeObj.accentColor || '#b062eb';

      const storyWrapper = document.createElement('div');
      storyWrapper.id = 'story-export-temp';
      storyWrapper.style.position = 'fixed';
      storyWrapper.style.top = '-99999px';
      storyWrapper.style.left = '-99999px';
      storyWrapper.style.width = '1080px';
      storyWrapper.style.minHeight = '1920px';
      storyWrapper.style.padding = '80px 45px';
      storyWrapper.style.backgroundColor = '#0b0b0f';
      storyWrapper.style.backgroundImage = `radial-gradient(circle at 50% 15%, ${accent}44 0%, transparent 60%), radial-gradient(circle at 50% 85%, ${accent}25 0%, transparent 50%)`;
      storyWrapper.style.display = 'flex';
      storyWrapper.style.flexDirection = 'column';
      storyWrapper.style.justifyContent = 'space-between';
      storyWrapper.style.alignItems = 'center';
      storyWrapper.style.fontFamily = "'Segoe UI', -apple-system, sans-serif";
      storyWrapper.style.color = '#ffffff';
      storyWrapper.style.zIndex = '999999';
      storyWrapper.style.boxSizing = 'border-box';

      // Header
      const header = document.createElement('div');
      header.style.textAlign = 'center';
      header.style.marginBottom = '30px';
      header.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 20px;">
          <img src="/ametist-logo.png" style="width: 70px; height: 70px; object-fit: contain; filter: drop-shadow(0 0 16px ${accent}bb);" />
          <img src="/ametist-text.png" style="height: 48px; object-fit: contain;" />
        </div>
        <h1 style="font-size: 2.8rem; margin: 0 0 8px 0; font-weight: 900; color: #ffffff; text-shadow: 0 0 25px ${accent}aa; text-transform: uppercase; letter-spacing: 2px;">
          ${options.title || 'Minha Tier List'}
        </h1>
        <p style="font-size: 1.2rem; color: #b5b5c3; margin: 0; font-weight: 500;">
          Classificação Oficial
        </p>
      `;

      // Clone Board
      const boardClone = boardElement.cloneNode(true);
      boardClone.style.width = '100%';
      boardClone.style.maxWidth = '980px';
      boardClone.style.backgroundColor = 'rgba(18, 18, 24, 0.95)';
      boardClone.style.border = `2px solid ${accent}88`;
      boardClone.style.borderRadius = '20px';
      boardClone.style.padding = '25px';
      boardClone.style.boxShadow = `0 20px 60px rgba(0,0,0,0.85), 0 0 40px ${accent}33`;

      // Footer
      const footer = document.createElement('div');
      footer.style.textAlign = 'center';
      footer.style.marginTop = '30px';
      footer.innerHTML = `
        <div style="display: inline-flex; align-items: center; gap: 8px; background: ${accent}22; border: 1px solid ${accent}77; padding: 10px 26px; border-radius: 30px; margin-bottom: 12px; box-shadow: 0 0 20px ${accent}33;">
          <span style="font-size: 1.05rem; font-weight: 800; color: ${accent}; letter-spacing: 2px; text-transform: uppercase;">
            AMETIST TIER MAKER
          </span>
        </div>
        <div style="font-size: 0.95rem; color: #777788; letter-spacing: 0.5px;">
          ametist-tier-maker.vercel.app
        </div>
      `;

      storyWrapper.appendChild(header);
      storyWrapper.appendChild(boardClone);
      storyWrapper.appendChild(footer);
      document.body.appendChild(storyWrapper);

      dataUrl = await htmlToImage.toPng(storyWrapper, {
        pixelRatio: 1.5,
        cacheBust: true
      });

      document.body.removeChild(storyWrapper);
    } else {
      dataUrl = await htmlToImage.toPng(boardElement, {
        backgroundColor: '#141417',
        pixelRatio: 2,
        cacheBust: true,
      });
    }

    boardElement.classList.remove('clean-mode');

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
    toast.success(format === 'story' ? 'Story 9:16 gerado com sucesso!' : 'Imagem 16:9 gerada com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar imagem:', error);
    toast.error('Houve um erro ao gerar a imagem: ' + (error.message || error));
  }
}
