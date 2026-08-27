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

    const themeName = options.theme || 'ametist';
    const themeObj = getThemeById(themeName);
    const accent = themeObj.accentColor || '#b062eb';

    const isStory = format === 'story';
    const canvasWidth = isStory ? 1080 : 1920;
    const minCanvasHeight = isStory ? 1920 : 1080;

    // Contêiner de isolamento 100% fora da tela (evita glitch visual no monitor)
    stagingContainer = document.createElement('div');
    stagingContainer.id = 'export-staging-container';
    stagingContainer.style.position = 'fixed';
    stagingContainer.style.top = '0';
    stagingContainer.style.left = '-15000px';
    stagingContainer.style.width = `${canvasWidth}px`;
    stagingContainer.style.height = 'auto';
    stagingContainer.style.margin = '0';
    stagingContainer.style.padding = '0';
    stagingContainer.style.overflow = 'visible';
    stagingContainer.style.pointerEvents = 'none';
    stagingContainer.style.zIndex = '-999999';

    // Wrapper principal do Canvas
    const exportWrapper = document.createElement('div');
    exportWrapper.id = 'export-canvas-wrapper';
    exportWrapper.className = `theme-${themeName}`;
    exportWrapper.style.width = `${canvasWidth}px`;
    exportWrapper.style.minHeight = `${minCanvasHeight}px`;
    exportWrapper.style.margin = '0';
    exportWrapper.style.padding = isStory ? '70px 45px' : '55px 70px';
    exportWrapper.style.backgroundColor = '#0b0b0f';
    exportWrapper.style.backgroundImage = isStory
      ? `radial-gradient(circle at 50% 10%, ${accent}33 0%, transparent 50%), radial-gradient(circle at 50% 90%, ${accent}25 0%, transparent 50%)`
      : `radial-gradient(circle at 15% 15%, ${accent}28 0%, transparent 45%), radial-gradient(circle at 85% 85%, ${accent}1e 0%, transparent 45%), #0c0c10`;
    exportWrapper.style.display = 'flex';
    exportWrapper.style.flexDirection = 'column';
    exportWrapper.style.justifyContent = 'space-between';
    exportWrapper.style.alignItems = 'center';
    exportWrapper.style.fontFamily = "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif";
    exportWrapper.style.color = '#ffffff';
    exportWrapper.style.boxSizing = 'border-box';
    exportWrapper.style.border = 'none';

    // 1. HEADER
    const header = document.createElement('div');
    header.style.width = '100%';
    header.style.maxWidth = isStory ? '990px' : '1780px';
    header.style.margin = '0 auto';
    header.style.marginBottom = isStory ? '25px' : '24px';

    if (isStory) {
      header.style.textAlign = 'center';
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
    } else {
      header.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding-bottom: 18px; border-bottom: 1px solid ${accent}33;">
          <div style="display: flex; align-items: center; gap: 18px;">
            <img src="/ametist-logo.png" style="width: 58px; height: 58px; object-fit: contain; filter: drop-shadow(0 0 16px ${accent}aa);" crossorigin="anonymous" />
            <div>
              <h1 style="font-size: 2.3rem; margin: 0 0 4px 0; font-weight: 900; color: #ffffff; text-shadow: 0 0 20px ${accent}88; text-transform: uppercase; letter-spacing: 1.5px; word-break: break-word;">
                ${options.title || 'Minha Tier List'}
              </h1>
              <p style="font-size: 1.05rem; color: #a1a1b5; margin: 0; font-weight: 600; letter-spacing: 0.5px;">
                Classificação Oficial
              </p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; background: ${accent}1a; border: 1.5px solid ${accent}66; padding: 8px 24px; border-radius: 30px; box-shadow: 0 0 20px ${accent}22;">
            <img src="/ametist-text.png" style="height: 28px; object-fit: contain;" crossorigin="anonymous" />
          </div>
        </div>
      `;
    }

    // 2. CLONE DO TABULEIRO
    const boardClone = boardElement.cloneNode(true);
    boardClone.id = 'board';
    boardClone.className = `${boardElement.className} clean-mode`;
    boardClone.style.width = '100%';
    boardClone.style.maxWidth = isStory ? '990px' : '1780px';
    boardClone.style.margin = '0 auto';
    boardClone.style.backgroundColor = 'rgba(18, 18, 24, 0.95)';
    boardClone.style.border = `2px solid ${accent}88`;
    boardClone.style.borderRadius = '18px';
    boardClone.style.padding = isStory ? '20px' : '24px';
    boardClone.style.boxShadow = `0 20px 50px rgba(0,0,0,0.85), 0 0 35px ${accent}33`;

    // Esconder botões de controle e edição no clone
    const buttonsToHide = boardClone.querySelectorAll('button, .tier-settings, .add-tier-row-btn, .group-actions');
    buttonsToHide.forEach(btn => {
      btn.style.display = 'none';
    });

    // 3. FOOTER
    const footer = document.createElement('div');
    footer.style.width = '100%';
    footer.style.maxWidth = isStory ? '990px' : '1780px';
    footer.style.margin = '0 auto';
    footer.style.marginTop = isStory ? '25px' : '24px';

    if (isStory) {
      footer.style.textAlign = 'center';
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
    } else {
      footer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 0.95rem; color: #777788;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: ${accent}; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">AMETIST TIER MAKER</span>
            <span>•</span>
            <span style="color: #9999aa;">Classificação Personalizada</span>
          </div>
          <div style="letter-spacing: 0.5px; color: #888899;">
            ametist-tier-maker.vercel.app
          </div>
        </div>
      `;
    }

    // Montagem na Staging
    exportWrapper.appendChild(header);
    exportWrapper.appendChild(boardClone);
    exportWrapper.appendChild(footer);
    stagingContainer.appendChild(exportWrapper);
    document.body.appendChild(stagingContainer);

    // Esperar todas as imagens terminarem o carregamento
    const allImages = Array.from(exportWrapper.querySelectorAll('img'));
    await Promise.all(allImages.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 1500);
      });
    }));

    await new Promise(r => setTimeout(r, 120));

    const finalHeight = Math.max(minCanvasHeight, exportWrapper.scrollHeight || minCanvasHeight);

    const dataUrl = await htmlToImage.toPng(exportWrapper, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#0b0b0f',
      width: canvasWidth,
      height: finalHeight,
      canvasWidth: canvasWidth * 2,
      canvasHeight: finalHeight * 2,
      style: {
        margin: '0',
        top: '0',
        left: '0',
        position: 'static',
        transform: 'none',
        boxSizing: 'border-box'
      }
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
    toast.success(isStory ? 'Story 9:16 gerado com sucesso!' : 'Imagem 16:9 gerada com sucesso!', { id: 'img-export' });
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
