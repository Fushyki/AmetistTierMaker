<div align="center">
  <img src="public/ametist-logo.png" alt="Ametist Logo" width="90" height="90" />
  
  # Ametist Tier Maker
  
  <p>
    <b>A plataforma definitiva de criação, organização e personalização de Tier Lists modernas, responsivas e multidimensionais.</b>
  </p>
  
  <a href="https://ametist-tier-maker.vercel.app/">
    <img src="https://img.shields.io/badge/Acessar_o_Site-b062eb?style=for-the-badge&logo=vercel&logoColor=white" alt="Acessar o Site Agora" />
  </a>
  <br/><br/>

  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Dnd_Kit-4F46E5?style=for-the-badge&logo=javascript&logoColor=white" alt="Dnd Kit" />
</div>

<br/>

## A Motivação

Durante anos, os criadores de conteúdo, comunidades de jogos e entusiastas dependeram de ferramentas tradicionais de tier list (como o popular *Tiermaker*). No entanto, essas ferramentas carregam vícios graves:

* **Interface Parada nos Anos 2000:** Layouts rígidos, poluídos por anúncios intrusivos e sem refinamento estético.
* **Falta de Suporte a Múltiplas Colunas:** A maior limitação dos criadores tradicionais é a incapacidade de subdividir ranks. Você não consegue avaliar múltiplos critérios (ex: *DPS*, *Sub-DPS*, *Suporte* ou *Early Game / Late Game*) na mesma linha sem criar listas separadas.
* **Experiência Mobile Sofrível:** Arrastar e soltar itens em smartphones costuma travar a rolagem da página, desconfigurar elementos ou simplesmente falhar no toque.
* **Exportações Limitadas:** Imagens de baixa qualidade, sem opções de proporção para redes sociais ou que geram arquivos pesados demais para compartilhamento em mensageiros como o Discord.

O **Ametist Tier Maker** nasceu para ser a resposta definitiva a essas limitações: uma ferramenta contemporânea, construída com foco em **design premium (Dark Mode & Glassmorphism)**, **arquitetura Mobile-First**, **sistema multidimensional de múltiplas colunas** e **integração nativa com a nuvem**.

<br/>

## Principais Diferenciais e Funcionalidades

### 1. Sistema Multidimensional de Múltiplas Colunas
* **Modo Clássico e Modo Avançado:** Escolha entre o rankeamento tradicional por linhas ou ative de **1 a 4 colunas verticais independentes** por linha de tier.
* **Sub-rótulos Customizáveis:** Nomeie cada coluna livremente (ex: *Build A*, *Build B*, *PVP*, *PVE*) para criar análises profundas em um único quadro.
* **Organização Matricial:** Posicione e ordene personagens exatamente no quadrante desejado.

### 2. Experiência Mobile-First Nativa
* **Toque Inteligente (Tap-to-Move):** No celular, basta tocar no item para abrir uma **Barra Flutuante de Seleção** que permite posicionar ou devolver itens ao banco com um único toque.
* **Controles Retráteis:** Painel de ferramentas expansível que prioriza o espaço visual do tabuleiro em telas menores.
* **Grids e Abas Otimizadas:** Navegação lateral suave por toque em categorias, modelos e abas de perfil.

### 3. Exportação Gráfica com Seletor de Resolução
* **Layouts Horizontal e Vertical:** Exporte o resultado no formato clássico ou em um card vertical elegante para stories, feeds e fóruns.
* **Otimização de Tamanho (Discord vs 4K Ultra HD):**
  * **Otimizado (Web / Discord):** Renderização nítida em alta definição com peso controlado (< 2.5MB) para envio direto em qualquer mensageiro.
  * **Ultra HD (4K):** Renderização de altíssima densidade de pixels (`pixelRatio: 2`) com acabamento nítido para monitores grandes e impressões.
* **Marca D'Água e Identidade Visual:** Renderização limpa através do motor de composição em Canvas.

### 4. Integração Dinâmica com APIs Externas & Web Scraping
* **Importação Automática sem Custo de Armazenamento:** Conecte endpoints JSON públicos ou feeds de dados externos (como bancos de dados de *Honkai: Star Rail* e *Genshin Impact*).
* **Renderização Direta via CDN:** O sistema utiliza URLs diretas e caching inteligente do navegador, mantendo o banco leve e veloz.

### 5. Modo Copa do Mundo (Torneio Mata-Mata)
* **Chaveamento Dinâmico:** Módulo dedicado para criar confrontos diretos estilo eliminatórias da Copa do Mundo.
* **Propagação Automática:** Vencedores de cada partida avançam automaticamente para as oitavas, quartas, semi e grande final.

### 6. Personalização Visual & Temas Globais
* **Paleta de Cores Dinâmica:** Alterne em tempo real entre temas como *Ametista*, *Safira*, *Esmeralda*, *Rubi*, *Âmbar* e *Cyberpunk*.
* **Densidade de Interface:** Alterne entre modo Compacto e Confortável conforme o tamanho da sua tela.

### 7. Sincronização em Nuvem e Galeria Comunitária
* **Autenticação Segura:** Login e cadastro gerenciados pelo Supabase Auth com criptografia robusta.
* **Galeria de Modelos:** Publique modelos para a comunidade ou salve-os como privados para uso exclusivo no seu painel.
* **Salvamento Híbrido:** Backup instantâneo local (`localStorage`) sincronizado com o banco PostgreSQL.

<br/>

## Arquitetura e Tecnologias

A aplicação foi estruturada seguindo boas práticas de desacoplamento, performance e tipagem semântica:

| Camada | Tecnologia | Finalidade |
| :--- | :--- | :--- |
| **Interface / SPA** | React 18 + Vite | Renderização reativa de alto desempenho e ciclo de build instantâneo. |
| **Drag & Drop** | `@dnd-kit/core` & `@dnd-kit/sortable` | Motor de arrasto com suporte avançado a sensores de ponteiro e toque. |
| **Estilização** | CSS3 Vanilla + CSS Variables | Glassmorphism, temas dinâmicos e arquitetura responsiva sem overhead de bibliotecas pesadas. |
| **Iconografia** | `lucide-react` | Vetores SVG modernos e consistentes em toda a interface. |
| **Renderizador de Imagem** | `html2canvas` + Custom Canvas Engine | Composição gráfica para exportação em PNG de alta resolução. |
| **Backend & Autenticação** | Supabase (BaaS) | Autenticação via JWT, gerenciamento de sessões e API REST segura. |
| **Banco de Dados** | PostgreSQL com RLS e JSONB | Estruturas relacionais seguras com flexibilidade de documentos para os tabuleiros. |

<br/>

## Estrutura de Pastas

```text
AmetistTierMaker/
├── public/               # Ícones, capas e assets estáticos
├── src/
│   ├── assets/           # Imagens e marcas visuais
│   ├── components/       # Componentes reutilizáveis
│   │   ├── tierlist/     # Tabuleiro, inventário, controles e modais de exportação
│   │   ├── Navbar.jsx    # Barra de navegação responsiva
│   │   └── Footer.jsx    # Rodapé institucional
│   ├── contexts/         # Gerenciadores de estado global (Auth, Theme)
│   ├── data/             # Coleções de dados locais, times da copa e temas
│   ├── pages/            # Telas da aplicação (Home, Tierlist, TemplateMaker, Copa, Profile, Login)
│   ├── services/         # Cliente Supabase e conectores
│   ├── styles/           # Folhas de estilo modularizadas
│   └── utils/            # Utilitários (notificações, exportador de imagens, validadores)
├── index.html            # Ponto de entrada com meta tags OpenGraph otimizadas
├── package.json          # Manifesto de dependências e scripts
└── vite.config.js        # Configurações de compilação e divisão de chunks
```

<br/>

## Como Executar o Projeto Localmente

### Pré-requisitos
* Node.js (versão 18 ou superior)
* Gerenciador de pacotes npm, yarn ou pnpm

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Fushyki/AmetistTierMaker.git
   cd AmetistTierMaker
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima-publica
   VITE_ADMIN_EMAILS=seu-email@dominio.com
   ```

4. **Inicie o ambiente de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a URL informada no terminal (geralmente `http://localhost:5173`).

5. **Gerar build de produção:**
   ```bash
   npm run build
   ```

<br/>

## Segurança & Privacidade

* **Isolamento de Credenciais:** Nenhuma chave secreta (`service_role`) está presente no frontend ou nos commits do repositório.
* **Row Level Security (RLS):** Todas as tabelas no PostgreSQL são protegidas por políticas que restringem leitura e escrita apenas aos proprietários dos dados.
* **Criptografia de Senhas:** Autenticação delegada ao Supabase Auth, utilizando padrões criptográficos de ponta (bcrypt/Argon2).

<br/>

---

<div align="center">
  <p>Desenvolvido com foco em excelência por <a href="https://github.com/Fushyki"><b>Davi Batista (Fushyki)</b></a>.</p>
</div>
