# Storefront frontend (embedded in the root Vite app)

This project does **not** ship as a standalone package: the storefront UI lives in the main Cursor practice app:

- **`src/demos/EcommerceDemo.tsx`** — catalogue, cart, discount codes, mock checkout, order history.
- **`src/lib/ecommerceApi.ts`** — REST client pointing at **`VITE_ECOMMERCE_API_URL`** (defaults to `http://127.0.0.1:5004`).

## Run locally

1. Start the API (see **`../ecommerce_api/README.md`**).
2. In the repo root, set **`VITE_ECOMMERCE_API_URL`** (see `.env.example`) or use the default `5004` port.
3. From the repo root: **`npm install`** then **`npm run dev`**.
4. Open **`/demos/ecommerce`** or use **Ecommerce** under **Complete Interfaces** on the home page.
