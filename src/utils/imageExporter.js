import { toast } from './notifications';
import { getThemeById } from '../data/themes';

/**
 * Exporta o tabuleiro como imagem PNG de alta fidelidade nos formatos:
 * - 'landscape' (16:9 clássico para PC/Twitter/YouTube)
 * - 'story' (9:16 vertical otimizado para TikTok/Instagram Stories/Reels)
 */
export async function exportBoardAsImage(filename = 'minha-tierlist.png', elementId = 'board', format = 'landscape', options = {}) {
  const boardElement = document.getElementById(elementId);
  if (!boardElement) {
    toast.error('Elemento do tabuleiro não encontrado.');
    return;
  }

  let stagingContainer = null;

  try {
    toast.loading(format === 'story' ? 'Renderizando Story 9:16...' : 'Renderizando Imagem 16:9...', { id: 'img-export' });
    const htmlToImage = await import('html-to-image');
    boardElement.classList.add('clean-mode');

    let dataUrl;

    if (format === 'story') {
      const themeName = options.theme || 'ametist';
      const themeObj = getThemeById(themeName);
      const accent = themeObj.accentColor || '#b062eb';

      // Contêiner de isolamento 100% fora da tela (evita qualquer glitch visual no monitor)
      stagingContainer = document.createElement('div');
      stagingContainer.id = 'story-export-staging';
      stagingContainer.style.position = 'fixed';
      stagingContainer.style.top = '0';
      stagingContainer.style.left = '-15000px';
      stagingContainer.style.width = '1120px';
      stagingContainer.style.minHeight = '2000px';
      stagingContainer.style.overflow = 'hidden';
      stagingContainer.style.pointerEvents = 'none';
      stagingContainer.style.zIndex = '-999999';

      const storyWrapper = document.createElement('div');
      storyWrapper.id = 'story-export-temp';
      storyWrapper.className = `tierlist-container theme-${themeName}`;
      storyWrapper.style.width = '1080px';
      storyWrapper.style.minHeight = '1920px';
      storyWrapper.style.padding = '80px 45px';
      storyWrapper.style.backgroundColor = '#0b0b0f';
      storyWrapper.style.backgroundImage = `radial-gradient(circle at 50% 12%, ${accent}33 0%, transparent 50%), radial-gradient(circle at 50% 88%, ${accent}22 0%, transparent 50%)`;
      storyWrapper.style.display = 'flex';
      storyWrapper.style.flexDirection = 'column';
      storyWrapper.style.justifyContent = 'space-between';
      storyWrapper.style.alignItems = 'center';
      storyWrapper.style.fontFamily = "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif";
      storyWrapper.style.color = '#ffffff';
      storyWrapper.style.boxSizing = 'border-box';

      // Header
      const header = document.createElement('div');
      header.style.textAlign = 'center';
      header.style.marginBottom = '25px';
      header.style.width = '100%';
      header.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 18px;">
          <img src="/ametist-logo.png" style="width: 64px; height: 64px; object-fit: contain; filter: drop-shadow(0 0 14px ${accent}aa);" crossorigin="anonymous" />
          <img src="/ametist-text.png" style="height: 42px; object-fit: contain;" crossorigin="anonymous" />
        </div>
        <h1 style="font-size: 2.5rem; margin: 0 0 8px 0; font-weight: 900; color: #ffffff; text-shadow: 0 0 20px ${accent}88; text-transform: uppercase; letter-spacing: 1.5px; word-break: break-word;">
          ${options.title || 'Minha Tier List'}
        </h1>
        <p style="font-size: 1.15rem; color: #b5b5c3; margin: 0; font-weight: 600; letter-spacing: 0.5px;">
          Classificação Oficial
        </p>
      `;

      // Clone Board
      const boardClone = boardElement.cloneNode(true);
      boardClone.id = 'board-story-clone';
      boardClone.className = `${boardElement.className} clean-mode`;
      boardClone.style.width = '100%';
      boardClone.style.maxWidth = '990px';
      boardClone.style.margin = '0 auto';
      boardClone.style.backgroundColor = 'rgba(18, 18, 24, 0.95)';
      boardClone.style.border = `2px solid ${accent}88`;
      boardClone.style.borderRadius = '18px';
      boardClone.style.padding = '20px';
      boardClone.style.boxShadow = `0 20px 50px rgba(0,0,0,0.85), 0 0 35px ${accent}33`;

      // Esconder botões de controle e edição no clone
      const buttonsToHide = boardClone.querySelectorAll('button, .tier-settings, .add-tier-row-btn, .group-actions');
      buttonsToHide.forEach(btn => {
        btn.style.display = 'none';
      });

      // Footer
      const footer = document.createElement('div');
      footer.style.textAlign = 'center';
      footer.style.marginTop = '25px';
      footer.style.width = '100%';
      footer.innerHTML = `
        <div style="display: inline-flex; align-items: center; gap: 8px; background: ${accent}22; border: 1.5px solid ${accent}77; padding: 10px 28px; border-radius: 30px; margin-bottom: 10px; box-shadow: 0 0 20px ${accent}33;">
          <span style="font-size: 1.05rem; font-weight: 800; color: ${accent}; letter-spacing: 2px; text-transform: uppercase;">
            AMETIST TIER MAKER
          </span>
        </div>
        <div style="font-size: 0.95rem; color: #888899; letter-spacing: 0.5px;">
          ametist-tier-maker.vercel.app
        </div>
      `;

      storyWrapper.appendChild(header);
      storyWrapper.appendChild(boardClone);
      storyWrapper.appendChild(footer);
      stagingContainer.appendChild(storyWrapper);
      document.body.appendChild(stagingContainer);

      // Esperar todas as imagens terminarem o carregamento
      const allImages = Array.from(storyWrapper.querySelectorAll('img'));
      await Promise.all(allImages.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 1500);
        });
      }));

      await new Promise(r => setTimeout(r, 120));

      dataUrl = await htmlToImage.toPng(storyWrapper, {
        pixelRatio: 1.8,
        cacheBust: true,
        backgroundColor: '#0b0b0f'
      });
    } else {
      dataUrl = await htmlToImage.toPng(boardElement, {
        backgroundColor: '#141417',
        pixelRatio: 2,
        cacheBust: true,
      });
    }

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
    toast.success(format === 'story' ? 'Story 9:16 gerado com sucesso!' : 'Imagem 16:9 gerada com sucesso!', { id: 'img-export' });
  } catch (error) {
    console.error('Erro ao salvar imagem:', error);
    toast.error('Houve um erro ao gerar a imagem: ' + (error.message || error), { id: 'img-export' });
  } finally {
    boardElement.classList.remove('clean-mode');
    if (stagingContainer && stagingContainer.parentNode) {
      stagingContainer.parentNode.removeChild(stagingContainer);
    }
  }
}
