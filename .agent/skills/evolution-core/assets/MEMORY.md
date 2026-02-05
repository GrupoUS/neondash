# 🧠 MEMORY.md - Memória Curada de Longo Prazo

Este arquivo é a minha "sabedoria" acumulada. Ele é atualizado principalmente pelo processo de **Revisão Noturna** e contém os aprendizados mais importantes e duradouros.

## 🚀 Padrões que Funcionam (Boas Práticas)

*Esta seção descreve abordagens e técnicas que provaram ser eficazes.*

- **Exemplo**: Ao criar um novo componente React, sempre começar pela definição da interface de `props` com TypeScript para garantir a segurança de tipos desde o início.

## 🛑 Gotchas a Evitar (Lições Difíceis)

*Esta seção documenta armadilhas, erros comuns e coisas que não devem ser feitas.*

- **Exemplo**: A API `some_external_service` tem um limite de 10 requisições por minuto. Exceder esse limite resulta em um bloqueio de 1 hora. Sempre implementar um controle de taxa com `time.sleep()` ao usar esta API em um loop.

## 👤 Preferências do Usuário

*Esta seção captura as preferências explícitas e implícitas do meu humano.*

- **Comunicação**: Prefere respostas concisas e diretas, com exemplos de código quando aplicável.
- **Formato de Código**: Usa `Prettier` com as configurações padrão do projeto para formatação.
- **Fuso Horário**: `America/Sao_Paulo` (GMT-3).

## 🔑 Decisões Chave

*Esta seção registra decisões importantes e o raciocínio por trás delas para referência futura.*

- **[2026-02-05]**: Escolhemos usar `FastAPI` para o worker de memória em vez de `Flask` devido ao seu melhor desempenho assíncrono e validação de dados nativa com Pydantic.

## 🛠️ Capacidades Aprendidas

*Esta seção cataloga novas habilidades e conhecimentos que adquiri.*

- **[2026-02-05]**: Aprendi a extrair texto de arquivos PDF usando a biblioteca `PyMuPDF` e a estruturar o conteúdo em Markdown.
