# RAG Evaluation Playground

Test and debug your RAG pipelines with failure mode diagnosis.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/rag-eval-playground&env=GROQ_API_KEY&envDescription=Get%20your%20free%20Groq%20API%20key%20from%20console.groq.com)

## Features

- 📄 **Upload Documents**: PDF, TXT, or Markdown files (max 3 files, 5MB each)
- ❓ **Test Questions**: Use sample questions or provide your own
- ⚙️ **Configure Pipeline**: 5 adjustable knobs for RAG parameters
- 📊 **A/B Comparison**: Compare your config against a baseline
- 🎯 **Failure Diagnosis**: Categorized breakdown of issues
- 💡 **Recommendations**: Actionable fixes with tradeoff notes

## Quick Start

### 1. Get a Groq API Key (Free)

Visit [console.groq.com](https://console.groq.com) and create a free account to get your API key.

### 2. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/rag-eval-playground.git
cd rag-eval-playground
npm install
```

### 3. Configure Environment

```bash
cp .env.local.example .env.local
# Edit .env.local and add your GROQ_API_KEY
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Configuration Knobs

| Setting | Options | Description |
|---------|---------|-------------|
| **Chunk Size** | 300, 500, 800, 1200 | How to split documents |
| **Search Type** | Semantic, Keyword, Hybrid | Retrieval method |
| **Top-K** | 3, 5, 8 | Number of chunks to retrieve |
| **Abstain Threshold** | 0.3 - 0.7 | When to say "I don't know" |
| **Strict Citations** | On/Off | Require evidence for claims |

## Failure Modes

The app diagnoses these failure types:

- **Retrieval Miss**: Relevant information not found
- **Context Dilution**: Too much irrelevant context
- **Hallucination**: Answer without evidence
- **Over-abstain**: Refused when evidence existed
- **Perfect**: Grounded and correctly cited

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **LLM**: Groq (Llama 3.3 70B)
- **State**: Zustand
- **Deploy**: Vercel (free tier)

## License

MIT
