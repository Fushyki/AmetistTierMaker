<div align="center">

  <h1>Ametist Tier Maker</h1>
  
  <p>
    <b>Crie, personalize e salve suas Tier Lists definitivas na nuvem com design premium e alta performance.</b>
  </p>
  
  <a href="https://ametist-tier-maker.vercel.app/">
    <img src="https://img.shields.io/badge/Acessar_o_Site-b062eb?style=for-the-badge&logo=vercel&logoColor=white" alt="Acessar o Site Agora" />
  </a>
  <br/><br/>

  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
  ![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
</div>

<br/>

## Sobre o Projeto

O **Ametist Tier Maker** nasceu da frustração com os "Tiermakers" tradicionais da internet, que geralmente possuem layouts defasados e usabilidade engessada. O objetivo deste projeto foi construir do zero uma plataforma premium, responsiva e flexível, capaz de não apenas ranquear imagens, mas de integrar APIs externas (como as do universo de *Genshin Impact*), oferecer suporte nativo a dispositivos móveis e abrigar páginas de eventos temáticos sazonais.

Esta é uma aplicação Full-Stack construída de forma 100% autoral, focada em resolver desafios reais como **gerenciamento de estados complexos**, **interfaces interativas (Drag & Drop)** e **sincronização de dados em nuvem**.

---

## Funcionalidades Principais

* **Drag & Drop Avançado:** Interface interativa e fluida, totalmente otimizada para desktops e dispositivos móveis (touch) usando `@dnd-kit`.
* **Salvamento em Nuvem:** Sistema de contas e autenticação. Os usuários podem salvar seu progresso no banco de dados e continuar editando de qualquer dispositivo.
* **Integração Dinâmica de APIs:** Capacidade de puxar e carregar centenas de imagens em tempo real de APIs públicas (com suporte a paginação e proteção contra rate limits).
* **Templates da Comunidade:** Ferramenta para criação de modelos-base públicos, permitindo que outros usuários gerem suas listas a partir de um catálogo da comunidade.
* **Modo Copa do Mundo (Bracket Tournament):** Módulo exclusivo para montar chaveamentos de torneios no estilo mata-mata. Conta com lógica de propagação automática de vencedores e renderização visual por CSS.
* **Exportação de Alta Qualidade:** Converta o HTML/DOM diretamente para imagens `.png` em alta resolução usando o `html2canvas`.

---

## Arquitetura e Tecnologias

A arquitetura do projeto segue padrões rigorosos do mercado, dividida em camadas claras de responsabilidade:

### 1. Frontend (Interface)
* **React + Vite:** Escolhidos para garantir extrema velocidade no ciclo de desenvolvimento e construção (build). 
* **State Management (Context API & Hooks):** Controle de um fluxo intenso de dados assíncronos (imagens, matrizes de rankeamento e autenticação).
* **Vanilla CSS (Módulo de Estilos Globais):** A identidade visual (Glassmorphism, Neon Glow e Dark Mode) foi escrita puramente em CSS para provar domínio em estilização sem frameworks engessados.

### 2. Backend as a Service (BaaS)
* **Supabase:** Plataforma Serverless escolhida para gerenciar o backend sem a necessidade de manter uma API Node.js/Express. Fornece o sistema completo de Autenticação via JWT.
* **RLS (Row Level Security):** Políticas de segurança injetadas diretamente no banco de dados para garantir que um usuário nunca acesse ou edite os dados de outro.

### 3. Banco de Dados
* **PostgreSQL:** Banco de dados relacional poderoso utilizado para armazenar os *Profiles*, *Templates* e as *Tier Lists* dos usuários.
* **Uso de JSONB:** O estado das tier lists (como as imagens e posições que mudam o tempo todo) é salvo estruturalmente como JSONB dentro do PostgreSQL, unindo a confiabilidade relacional com a flexibilidade NoSQL.

---

## Estrutura de Arquivos

O código fonte está organizado seguindo as melhores práticas do ecossistema React, promovendo escalabilidade:

```text
📦 src
 ┣ 📂 assets       # Imagens e vetores estáticos
 ┣ 📂 components   # Componentes modulares do React (Navbar, Drag&Drop, etc)
 ┣ 📂 contexts     # Contextos globais (como o AuthContext para Login)
 ┣ 📂 pages        # Telas completas roteáveis da aplicação (Home, Tierlist, Admin)
 ┣ 📂 services     # Clientes e configurações externas (Supabase)
 ┣ 📂 styles       # Estilos CSS globais e variáveis de tema
 ┣ 📂 utils        # Funções utilitárias reutilizáveis (alertas, parsers)
 ┣ 📜 App.jsx      # Ponto de entrada das rotas da aplicação
 ┗ 📜 main.jsx     # Ponto de entrada do renderizador DOM
```

---

## Como Rodar Localmente

Se você deseja clonar este projeto e rodá-lo na sua máquina, siga os passos abaixo:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Fushyki/AmetistTierMaker.git
   cd AmetistTierMaker
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto e adicione suas chaves do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```

4. **Inicie o servidor local:**
   ```bash
   npm run dev
   ```

---

## FAQ / Decisões Arquiteturais

<details>
<summary><b>1. Como o Drag & Drop funciona no Mobile sem quebrar?</b></summary>
A API nativa do HTML5 se comporta mal em navegadores mobile. Para contornar isso, implementamos a biblioteca `@dnd-kit`, que abstrai eventos de "Pointer" e de "Toque". Utilizamos o conceito de `DragOverlay` para que o elemento flutue em uma camada isolada (Z-index alto) sem afetar a geometria do resto da página durante o arrasto.
</details>

<details>
<summary><b>2. Como funciona a lógica de Sincronização Local x Nuvem?</b></summary>
Adotamos uma abordagem híbrida visando resiliência. Todo o progresso do usuário é salvo imediatamente no `localStorage` a cada milissegundo de edição. Se o navegador for fechado por acidente, nada é perdido. Caso o usuário queira salvar permanentemente, ele aciona o "Salvar na Nuvem", que envia o estado exato para o PostgreSQL via Supabase.
</details>

<details>
<summary><b>3. Como a plataforma lida com milhares de imagens?</b></summary>
Não armazenamos as imagens no nosso banco (o que geraria alto custo). Em vez disso, armazenamos as **URLs de origem** (seja de um link direto ou de uma API). O navegador do cliente faz o cache natural das imagens através de CDNs, tornando a ferramenta extremamente leve para o nosso backend.
</details>

---

<div align="center">
  <p>Desenvolvido por <a href="https://github.com/Fushyki">Davi Batista (Fushyki)</a>.</p>
</div>
