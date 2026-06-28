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
    const res = await fetch(apiConfig.url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    
    // 1. Achar a lista
    let listData = getNestedValue(data, apiConfig.arrayPath);
    
    // Se a API retornar um Objeto de Objetos (ex: Genshin), converte para Array
    if (listData && typeof listData === 'object' && !Array.isArray(listData)) {
      listData = Object.entries(listData).map(([key, value]) => ({
        _api_key_id: key, // salva a chave original caso precise
        ...value
      }));
    }

    if (!Array.isArray(listData)) {
      throw new Error("O caminho especificado não retornou uma lista ou objeto iterável.");
    }

    // 2. Mapear para o formato AmetistTierMaker
    const items = listData.map((item, index) => {
      // Nome
      let itemName = getNestedValue(item, apiConfig.namePath) || "Desconhecido";
      
      // Imagem
      let itemImage = getNestedValue(item, apiConfig.imagePath) || "";
      
      // Regras de substituição na imagem (opcional)
      if (apiConfig.replaceFrom && apiConfig.replaceTo !== undefined) {
        itemImage = itemImage.replace(apiConfig.replaceFrom, apiConfig.replaceTo);
      }
      
      // Montagem final da imagem
      const finalImage = `${apiConfig.imageBaseUrl || ''}${itemImage}${apiConfig.imageSuffix || ''}`;
      
      return {
        id: `api-item-${item._api_key_id || index}`,
        nome: itemName,
        src: finalImage,
        tierId: null,
        colIndex: null,
        uploadIndex: Date.now() + index
      };
    });

    return items;
  } catch (error) {
    console.error("Erro no apiParser:", error);
    throw error;
  }
};
