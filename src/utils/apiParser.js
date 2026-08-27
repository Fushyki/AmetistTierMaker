/**
 * Navega em um objeto JSON usando uma string de caminho (ex: "data.characters")
 */
const getNestedValue = (obj, path) => {
  if (!path) return obj;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

/**
 * Baixa e converte uma API customizada em itens de Tier List
 */
export const fetchAndParseAPI = async (apiConfig) => {
  try {
    const pages = apiConfig.pagesToFetch || 1;
    let allItems = [];

    for (let p = 1; p <= pages; p++) {
      let currentUrl = (apiConfig.url || "").trim().replace(/\r?\n|\r/g, '').replace(/\s+/g, '');
      if (currentUrl.includes('[PAGE]')) {
        currentUrl = currentUrl.replace('[PAGE]', p);
      }
      
      try {
        const res = await fetch(currentUrl);
        if (!res.ok) {
          console.warn(`Página ${p} retornou erro ${res.status}. Encerrando paginação.`);
          break; // Stop fetching more pages if we hit a 404, 429, etc.
        }
        const data = await res.json();

        // Verifica se a API retornou um objeto de erro direto (ex: Wikipedia toomanyvalues)
        if (data.error) {
          throw new Error(data.error.info || data.error.message || 'A API retornou um erro interno.');
        }
        
        // 1. Achar a lista
        let listData = getNestedValue(data, apiConfig.arrayPath);
        
        // Se a API retornar um Objeto de Objetos, converte para Array
        if (listData && typeof listData === 'object' && !Array.isArray(listData)) {
          listData = Object.entries(listData).map(([key, value]) => ({
            _api_key_id: key,
            ...value
          }));
        }

        if (!Array.isArray(listData)) {
          console.warn(`Caminho não retornou lista na página ${p}. Encerrando.`);
          break;
        }

        // 2. Mapear para o formato
        const items = listData.map((item, index) => {
          let itemName = getNestedValue(item, apiConfig.namePath) || "Desconhecido";
          let itemImage = getNestedValue(item, apiConfig.imagePath) || "";
          
          if (typeof itemImage === 'string' && apiConfig.replaceFrom && apiConfig.replaceTo !== undefined) {
            itemImage = itemImage.replace(apiConfig.replaceFrom, apiConfig.replaceTo);
          }
          
          const finalImage = `${apiConfig.imageBaseUrl || ''}${itemImage}${apiConfig.imageSuffix || ''}`;
          
          return {
            id: `api-item-${p}-${item._api_key_id || index}`,
            nome: itemName,
            src: finalImage,
            tierId: null,
            colIndex: null,
            uploadIndex: Date.now() + index + (p * 1000)
          };
        }).filter(item => Boolean(item.src));

        allItems = [...allItems, ...items];
      } catch (pageError) {
        console.warn(`Erro na página ${p}:`, pageError);
        throw pageError;
      }

      if (!(apiConfig.url || "").includes('[PAGE]') || pages === 1) {
        break; // Não faz loop se não for url paginada
      }
      
      // Delay de segurança anti-rate-limit (ex: Jikan limite 3/sec)
      if (p < pages) await new Promise(r => setTimeout(r, 600));
    }

    if (allItems.length === 0) {
      throw new Error("Nenhum item válido com imagem foi encontrado com essas configurações.");
    }

    return allItems;
  } catch (error) {
    console.error("Erro no apiParser:", error);
    throw error;
  }
};
