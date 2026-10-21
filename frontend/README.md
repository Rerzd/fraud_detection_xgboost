# Frontend

The React 19, Vite and Tailwind CSS console for the fraud detection API.

This folder has no documentation of its own. The [project README](../README.md) covers the
quickstart, the five pages of the console (with screenshots), the API it talks to and the
configuration, including the one build-time variable, `VITE_API_URL`.

From the repository root:

| Command | What it does |
|---|---|
| `npm run dev` | Backend and this app together, on `localhost:8000` and `localhost:5173` |
| `npm run dev:web` | Only this app |
| `npm run test:web` | The Vitest suite |
| `npm run lint` | ESLint |
| `npm run build` | Production build into `frontend/dist` |

`src/api.js` is the only module that calls the backend; everything else goes through it.
