# ⚽ Live Match Insights

> **Inteligência artificial e análise de dados para transformar informações de partidas de futebol em insights acionáveis em tempo real.**

O **Live Match Insights** é uma plataforma web desenvolvida para acompanhar partidas de futebol e utilizar dados da partida em conjunto com inteligência artificial para gerar análises, indicadores e insights sobre o comportamento do jogo.

A proposta é transformar um grande volume de informações — placar, eventos, estatísticas e contexto da partida — em uma experiência simples de interpretar, ajudando o usuário a entender **o que está acontecendo em campo e quais tendências podem estar se formando durante o jogo**.

> ⚠️ **Aviso:** o projeto possui caráter experimental e educacional. Os insights apresentados não constituem recomendação financeira ou garantia de resultado em apostas esportivas. Qualquer decisão relacionada a apostas é de responsabilidade exclusiva do usuário.

---

## 🚀 Objetivo

Durante uma partida, existe uma quantidade enorme de informações sendo gerada constantemente. O problema é transformar esses dados em contexto de forma rápida.

O Live Match Insights busca resolver isso através de uma interface centralizada capaz de:

* 📊 Exibir informações relevantes da partida
* ⚡ Acompanhar o contexto do jogo em tempo real
* 🤖 Utilizar IA para interpretar dados
* 🧠 Transformar estatísticas em insights compreensíveis
* 📈 Identificar tendências e mudanças no comportamento da partida
* 💬 Permitir uma interação mais natural com os dados através de um chatbot

A ideia central é simples:

**Dados → Contexto → Inteligência → Insight**

---

## ✨ Principais recursos

### ⚽ Análise de partidas

A plataforma foi projetada para analisar o contexto de uma partida e apresentar informações relevantes sobre seu desenvolvimento.

### 🤖 Assistente baseado em IA

O projeto utiliza o **AI SDK** e uma camada compatível com APIs de modelos de linguagem para possibilitar análises através de inteligência artificial.

O usuário pode utilizar a IA para interpretar informações da partida e obter respostas contextualizadas.

### 📊 Visualização de dados

Informações podem ser apresentadas através de componentes visuais e gráficos interativos, utilizando **Recharts**.

Isso permite transformar números brutos em informações mais fáceis de interpretar.

### 📈 Insights durante a partida

A proposta do sistema é identificar padrões e tendências que podem passar despercebidos quando o usuário observa apenas o placar.

Entre os possíveis contextos analisados estão:

* domínio territorial;
* volume ofensivo;
* sequência de eventos;
* pressão ofensiva;
* comportamento das equipes;
* evolução do jogo;
* alterações no cenário da partida.

### 💬 Interface conversacional

A utilização de um chatbot permite consultar os dados de uma maneira mais natural.

Em vez de procurar manualmente por diversas estatísticas, o usuário pode perguntar algo como:

> "Qual time está pressionando mais nos últimos minutos?"

ou:

> "O jogo está ficando mais ofensivo?"

A IA pode então utilizar o contexto disponível para produzir uma interpretação.

---

## 🧠 Conceito

O diferencial do projeto não está simplesmente em mostrar estatísticas.

A proposta é criar uma camada de **interpretação sobre os dados**.

```text
             PARTIDA
                │
                ▼
        ┌─────────────────┐
        │ Dados da partida│
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Processamento   │
        │ e contexto      │
        └────────┬────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
 ┌─────────────┐   ┌─────────────┐
 │ Estatísticas│   │ Inteligência│
 │ e eventos   │   │ Artificial  │
 └──────┬──────┘   └──────┬──────┘
        │                 │
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │     INSIGHTS    │
        └─────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │    Usuário      │
        └─────────────────┘
```

---

## 🛠️ Stack

O projeto utiliza uma stack moderna baseada em TypeScript e React.

### Front-end

* **React 19**
* **TypeScript**
* **Vite**
* **TanStack Router**
* **TanStack Start**
* **Tailwind CSS**
* **Radix UI**
* **Lucide React**
* **Motion**
* **Recharts**

### Inteligência Artificial

* **Vercel AI SDK**
* **AI SDK React**
* **OpenAI Compatible Provider**

### Formulários e validação

* **React Hook Form**
* **Zod**
* **@hookform/resolvers**

### Utilidades

* **date-fns**
* **nanoid**
* **clsx**
* **tailwind-merge**
* **Sonner**

### Desenvolvimento

* **ESLint**
* **Prettier**
* **TypeScript**
* **Vite**
* **Bun**

As dependências e scripts estão definidos no `package.json` do projeto.

---

## 📁 Estrutura do projeto

A aplicação está organizada principalmente dentro do diretório `src`.

```text
live-match-insights/
│
├── .lovable/
├── public/
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── routes/
│   │
│   ├── routeTree.gen.ts
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
│
├── AGENTS.md
├── bun.lock
├── bunfig.toml
├── components.json
├── eslint.config.js
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## ⚙️ Instalação

### Pré-requisitos

Antes de começar, tenha instalado:

* [Node.js](https://nodejs.org/)
* npm ou Bun
* Git

### Clone o repositório

```bash
git clone https://github.com/fmartins000/live-match-insights.git
cd live-match-insights
```

### Instale as dependências

Com npm:

```bash
npm install
```

Ou utilizando Bun:

```bash
bun install
```

### Execute em desenvolvimento

```bash
npm run dev
```

ou:

```bash
bun run dev
```

Depois, acesse a URL apresentada pelo Vite no terminal.

---

## 📜 Scripts disponíveis

| Comando             | Descrição                                |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Inicia o servidor de desenvolvimento     |
| `npm run build`     | Gera o build de produção                 |
| `npm run build:dev` | Gera build utilizando o modo development |
| `npm run preview`   | Executa uma prévia do build              |
| `npm run lint`      | Executa o ESLint                         |
| `npm run format`    | Formata o projeto utilizando Prettier    |

Esses scripts são definidos diretamente no `package.json`.

---

## 🔐 Variáveis de ambiente

Caso sejam utilizadas integrações externas de IA ou APIs de dados, configure as respectivas credenciais através de variáveis de ambiente.

Exemplo:

```env
VITE_API_URL=
VITE_AI_API_KEY=
VITE_FOOTBALL_API_KEY=
```

> **Importante:** nunca publique chaves privadas diretamente no código-fonte ou no repositório.

Caso novas integrações sejam adicionadas ao projeto, recomenda-se documentar aqui todas as variáveis necessárias.

---

## 🔄 Fluxo da aplicação

O fluxo conceitual do Live Match Insights pode ser representado da seguinte forma:

```text
Usuário
   │
   ▼
Seleciona uma partida
   │
   ▼
Dados da partida
   │
   ├──────────────► Estatísticas
   │
   ├──────────────► Eventos
   │
   └──────────────► Contexto temporal
                         │
                         ▼
                  Processamento
                         │
                         ▼
                  Motor de IA
                         │
                         ▼
                    Insights
                         │
                         ▼
                      Usuário
```

---

## 🎯 Casos de uso

O projeto pode ser utilizado por diferentes perfis de usuários.

### 📊 Analistas

Para acompanhar rapidamente tendências e mudanças no comportamento das equipes.

### ⚽ Fãs de futebol

Para entender melhor o que está acontecendo durante uma partida além do simples placar.

### 🔎 Scouts

Como ferramenta complementar para identificar padrões de comportamento e desempenho.

### 📈 Entusiastas de apostas esportivas

Para utilizar dados e contexto como parte de sua própria análise.

> A plataforma não garante resultados e não deve ser interpretada como um sistema de recomendação financeira.

---

## 🗺️ Roadmap

Algumas evoluções naturais para o projeto incluem:

* [ ] Integração com API de dados de futebol em tempo real
* [ ] Histórico completo de partidas
* [ ] Comparação entre equipes
* [ ] Estatísticas avançadas
* [ ] Gráficos de pressão ofensiva
* [ ] Momentum da partida
* [ ] Sistema de alertas
* [ ] Insights automáticos durante eventos importantes
* [ ] Histórico das conversas com a IA
* [ ] Análise pós-jogo
* [ ] Sistema de favoritos
* [ ] Dashboard personalizado
* [ ] PWA para dispositivos móveis
* [ ] Autenticação de usuários
* [ ] Sistema de planos/assinaturas

---

## 🔒 Segurança

Alguns cuidados importantes para evolução do projeto:

* Nunca expor API Keys no front-end.
* Utilizar variáveis de ambiente para credenciais.
* Validar dados recebidos de APIs externas.
* Implementar rate limiting em endpoints públicos.
* Evitar confiar cegamente em respostas produzidas por IA.
* Registrar erros de integração sem armazenar informações sensíveis.

---

## 🤖 Desenvolvimento com Lovable

O projeto foi inicialmente criado utilizando o **Lovable** e permanece conectado ao repositório GitHub.

Alterações realizadas no Lovable podem ser sincronizadas com o repositório, e alterações enviadas para a branch principal podem retornar ao ambiente do Lovable.

Por esse motivo, evite reescrever o histórico Git já publicado através de `force push`, `rebase`, `amend` ou `squash` de commits existentes.

---

## 🤝 Contribuição

Contribuições são bem-vindas.

Para contribuir:

```bash
# Fork do projeto

# Clone seu fork
git clone https://github.com/SEU-USUARIO/live-match-insights.git

# Crie uma branch
git checkout -b feature/nova-funcionalidade

# Faça suas alterações
git add .
git commit -m "feat: adiciona nova funcionalidade"

# Envie a branch
git push origin feature/nova-funcionalidade
```

Depois, abra um **Pull Request**.

---

## 📌 Status

**Em desenvolvimento 🚧**

O projeto está em evolução e novas funcionalidades podem ser adicionadas conforme a arquitetura de dados, IA e análise de partidas for expandida.

---

## 👨‍💻 Autor

**Felipe Martins**

GitHub:
https://github.com/fmartins000

---

## 📄 Licença

Este projeto ainda não possui uma licença open source definida.

Caso o projeto seja disponibilizado oficialmente como código aberto, recomenda-se adicionar uma licença como **MIT** ou outra que corresponda aos objetivos do projeto.

---

## ⭐ Contribua

Se este projeto for útil para você, considere deixar uma ⭐ no repositório.

**Live Match Insights** — transformando dados de futebol em contexto e contexto em inteligência.
