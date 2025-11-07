# TinyLLaMA Voice Companion

Web client for chatting with an Ollama-hosted TinyLLaMA model with optional text-to-speech playback. Built with Next.js so it can be deployed directly to Vercel.

## Requirements

- Node.js 18+ (Next.js requirement)
- Access to an Ollama instance that exposes the `/api/chat` endpoint (default: `http://localhost:11434/api/chat`)

## Local Development

```bash
npm install
npm run dev
```

Then visit http://localhost:3000.

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `OLLAMA_URL` | `http://localhost:11434/api/chat` | Base URL for the Ollama `/api/chat` endpoint |
| `OLLAMA_MODEL` | `tinyllama` | The model name to request from Ollama |

Create a `.env.local` file when running locally, or configure the variables in Vercel.

## Production Build

```bash
npm run build
npm run start
```

The production bundle uses an API route (`/api/chat`) that proxies requests to Ollama, so no client secrets are exposed.

## Features

- Chat interface with conversation history.
- Voice playback using the Web Speech API (auto-detects support).
- Error handling and ability to clear session history.
