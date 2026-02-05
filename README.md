# RAG Evaluation Playground

A premium tool to test, debug, and optimize RAG (Retrieval-Augmented Generation) pipelines with multi-provider support and failure mode diagnosis.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mohan25manu/rag-eval-playground&env=GROQ_API_KEY&envDescription=Shared%20API%20key%20for%20testing)

## 🌟 Features

- 🖥️ **Unified Dashboard**: Live configuration knobs and results on a single screen for rapid iteration.
- 🤖 **Multi-LLM Autodetect**: Supports **Groq, OpenAI, Anthropic, and Gemini**. Just paste your key and the system detects the provider instantly.
- 📄 **Document Handling**: PDF, TXT, and Markdown support (max 3 files).
- ⚙️ **Advanced Knobs**: 
  - **Chunk Size & Overlap %**: Control context continuity with dynamic overlap calculation.
  - **Search Type**: Semantic, Keyword, or Hybrid.
  - **Abstain Threshold**: Prevent hallucinations by setting confidence limits.
- 🎯 **Failure Diagnosis**: Automatically detects *Retrieval Misses*, *Context Dilution*, *Hallucinations*, and *Over-abstention*.
- 💡 **Actionable Recommendations**: Clear fixes with tradeoff analysis for every pipeline failure.

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js 18+** installed.
- **Git** installed.
- One of the following API keys (optional, but recommended to avoid rate limits):
  - [Groq](https://console.groq.com) (Free)
  - [OpenAI](https://platform.openai.com)
  - [Anthropic](https://console.anthropic.com)
  - [Google Gemini](https://aistudio.google.com)

### 2. Installation

```bash
git clone https://github.com/mohan25manu/rag-eval-playground.git
cd rag-eval-playground
npm install
```

### 3. Setup Environment

```bash
cp .env.local.example .env.local
# Edit .env.local and add your GROQ_API_KEY as a default fallback
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start testing.

## 🏗️ Project Architecture

This is a **Modern Web Application** built with:
- **Framework**: [Next.js 14/15](https://nextjs.org) (TypeScript, App Router)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) for efficient UI state.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) for a premium, dark-mode aesthetic.
- **Logic Layer**:
  - `src/lib/rag-engine.ts`: Core AI logic (Multi-provider orchestration).
  - `src/lib/chunker.ts`: Custom text splitting with overlap logic.
  - `src/lib/retriever.ts`: Hybrid search implementation.
  - `src/lib/evaluator.ts`: Failure mode classification engine.

> [!NOTE]
> This project is written entirely in **TypeScript/JavaScript** for seamless full-stack performance. There is no Python code—the "agents" are implemented as standardized LLM completions in the `lib` folder.

## 📊 Configuration Guide

| Setting | Range | Goal |
|---------|-------|------|
| **Chunk Size** | 300 - 1200 | Balancing context vs. noise. |
| **Chunk Overlap** | 5% - 40% | Maintaining continuity across boundaries. |
| **Search Type** | Semantic / Hybrid | Optimizing retrieval precision. |
| **Top-K** | 3 - 8 | Determining how much evidence to feed the LLM. |
| **Abstain** | 0.1 - 0.9 | Tuning the "I don't know" threshold. |

## 🛡️ License

MIT
