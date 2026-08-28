<div align="center">
  <img src="public/ametist-logo.png" alt="Ametist Logo" width="90" height="90" />
  
  # Ametist Tier Maker
  
  <p>
    <b>A plataforma definitiva de criação, organização, duelos e personalização de Tier Lists modernas, responsivas e multidimensionais.</b>
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

* **Interface Desatualizada:** Layouts rígidos, poluídos por anúncios intrusivos e sem refinamento estético.
* **Falta de Suporte a Múltiplas Colunas:** Incapacidade de subdividir ranks para avaliar múltiplos critérios (ex: *DPS*, *Sub-DPS*, *Suporte* ou *Early Game / Late Game*) no mesmo quadro.
* **Experiência Mobile Sofrível:** Arrastar e soltar itens em smartphones costuma travar a rolagem da página ou falhar no toque.
* **Falta de Modos de Confronto Interativos:** Ausência de modos de duelo 1v1 ou torneios mata-mata com as imagens da lista.
* **Exportações Limitadas:** Imagens de baixa qualidade e sem otimização de peso para Discord ou resolução 4K.

O **Ametist Tier Maker** nasceu para superar essas limitações: uma suíte moderna construída com foco em **design premium (Dark Mode & Glassmorphism)**, **arquitetura Mobile-First**, **duelos interativos com chaveamento inteligente**, **sistema multidimensional de múltiplas colunas** e **integração nativa com nuvem**.

<br/>

## Principais Diferenciais e Funcionalidades

### 1. Sistema Multidimensional de Múltiplas Colunas
* **Modo Clássico e Modo Avançado:** Alterne entre o rankeamento tradicional por linhas ou ative de **1 a 4 colunas verticais independentes** por linha de tier.
* **Sub-rótulos Customizáveis:** Nomeie cada coluna livremente (ex: *Build A*, *Build B*, *PVP*, *PVE*) para análises aprofundadas.
* **Organização Matricial:** Posicione e ordene personagens no quadrante exato desejado.

### 2. Arena de Duelos & Batalhas 1v1
* **Torneio Mata-Mata (Eliminatórias):**
  * Seletor dinâmico de chaves (**8, 16, 32, 64, 128 ou Todas as Imagens**).
  * Algoritmo automático de **Fase Preliminar + Byes** para quantidades que não são potências de 2, permitindo que 100% das imagens compitam sem cortes.
  * Coroação do campeão com animações e registro automático no perfil do usuário.
* **Batalha de Tier List (Algoritmo $N \log_2 N$):**
  * Compare imagens 2 a 2 de forma ágil com estimativa realista de confrontos.
  * O algoritmo de ordenação comparativa calcula as pontuações e distribui os itens nos Tiers **S, A, B, C e D**.
  * **Exportação Instantânea:** Transfere o resultado com 1 clique diretamente para o Tabuleiro Oficial de Tier List, com todos os cards já posicionados.

### 3. Sistema Social, Curtidas & Favoritos
* **Curtidas em Tempo Real:** Botão de coração interativo em todos os modelos da comunidade, sincronizado com o Supabase.
* **Filtro de Popularidade:** Ordene modelos na Home por *Mais Recentes* ou *Mais Curtidos*.
* **Aba de Favoritos & Campeões no Perfil:** Painel dedicado para rever seus modelos favoritos e a galeria de personagens coroados nos seus torneios.
* **Permissões de Membros:** Bloqueio harmonioso de salvamento na nuvem e compartilhamento para visitantes com convite amigável para criação de conta.

### 4. Experiência Mobile-First & Fluidez Touch
* **Arena de Duelo em Grade Compacta (Mobile):** Os cards de confronto se ajustam lado a lado em 2 colunas no celular, permitindo duelos rápidos com os polegares sem rolar a tela.
* **Remoção de Delay de Toque (300ms):** Configuração `touch-action: manipulation` e `-webkit-tap-highlight-color: transparent` para resposta tátil instantânea.
* **Toque Inteligente (Tap-to-Move):** No tabuleiro mobile, toque na imagem e no tier desejado para posicionar rapidamente sem depender apenas do arrasto.
* **Controles Retráteis:** Painel expansível que maximiza o espaço visual do tabuleiro em smartphones.

### 5. Exportação Gráfica com Seletor de Resolução
* **Layouts Horizontal e Vertical:** Exporte o quadro no formato tradicional ou em card vertical para stories e redes sociais.
* **Otimização de Tamanho:**
  * **Otimizado (Web / Discord):** Renderização em alta definição com peso controlado (< 2.5MB) para envio direto sem erros de upload.
  * **Ultra HD (4K):** Renderização de altíssima densidade (`pixelRatio: 2`) para monitores de alta resolução e impressões.
* **Marca D'Água e Identidade Visual:** Renderização limpa pelo motor Canvas customizado.

### 6. Integração Dinâmica com APIs Externas & Web Scraping
* **Importação Automática:** Conecte endpoints JSON públicos ou feeds de dados externos (como bancos de dados de *Honkai: Star Rail* e *Genshin Impact*).
* **Renderização Direta via CDN:** Utiliza URLs diretas com cache eficiente do navegador, mantendo o banco leve e veloz.

### 7. Personalização Visual & Temas Globais
* **Paletas Dinâmicas:** Alterne entre temas globais: *Ametist*, *Cyberpunk*, *Gold*, *Emerald*, *Pastel* e *Monochrome*.
* **Iconografia Padronizada:** 100% dos ícones renderizados com vetores SVG modernos da biblioteca `lucide-react`.

<br/>

## Arquitetura e Tecnologias

| Camada | Tecnologia | Finalidade |
| :--- | :--- | :--- |
| **Interface / SPA** | React 18 + Vite | Renderização reativa de alto desempenho e ciclo de build instantâneo. |
| **Drag & Drop** | `@dnd-kit/core` & `@dnd-kit/sortable` | Motor de arrasto com suporte avançado a sensores de ponteiro e toque. |
| **Estilização** | CSS3 Vanilla + CSS Variables | Glassmorphism, temas dinâmicos e arquitetura responsiva sem overhead. |
| **Iconografia** | `lucide-react` | Vetores SVG modernos e consistentes em toda a interface. |
| **Renderizador Gráfico** | `html2canvas` + Custom Canvas Engine | Composição gráfica para exportação em PNG de alta resolução. |
| **Backend & Auth** | Supabase (BaaS) | Autenticação via JWT, gerenciamento de sessões e API REST segura. |
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
│   ├── hooks/            # Hooks customizados (useTierlistState, useHistory)
│   ├── pages/            # Telas da aplicação (Home, Tierlist, DueloX1, TemplateMaker, Copa, Profile, Login)
│   ├── services/         # Cliente Supabase e conectores
│   ├── styles/           # Folhas de estilo modularizadas
│   └── utils/            # Utilitários (likesManager, notificações, exportador de imagens, validadores)
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
