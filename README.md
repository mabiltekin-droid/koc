# OpenCode Question AI (B Plan MVP)

- Integrate multiple question banks into an online library
- Provide AI-assisted question solving with step-by-step explanations
- Analyze user weaknesses and propose adaptive practice plans
- Scalable architecture with a modular backend and React frontend

Current MVP scope:
- Backend with Express + TypeScript as a minimal API surface
- In-memory data stores for banks, questions, and attempts (to unblock fast iteration)
- AI service wrapper (OpenAI if API key is provided, otherwise mock)
- Simple vector store placeholder for semantic search (in-memory)
- Frontend with a minimal React interface to input questions and view solutions

Next steps:
- Wire up real PostgreSQL via Prisma (or TypeORM) when ready
- Connect a real vector DB (Weaviate, Pinecone) and implement embedding flows
- Expand bank import support (CSV/JSON/API)
- Implement user authentication and roles
