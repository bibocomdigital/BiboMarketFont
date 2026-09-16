# BiboMarket — Guide pour comprendre le projet

Tu as été invité à travailler sur **le frontend Next.js** de BiboMarket.  
Ce fichier explique le contexte, l’architecture, et **où toucher le code** sans te perdre.

Le `README.md` d’origine est le modèle Create Next App : il ne décrit pas le métier.

---

## 1. C’est quoi BiboMarket ?

**BiboMarket** (aussi écrit **BibocomMarket** dans l’interface) est une **marketplace sénégalaise** portée par **Bibocom Digital**.

L’idée : un seul site pour **acheter**, **vendre** et **fournir** des produits.

| Rôle | En français | Ce que la personne fait |
|------|-------------|-------------------------|
| `CLIENT` | Client | Parcourt les boutiques, achète, suit ses commandes |
| `MERCHANT` | Commerçant | Crée une boutique, publie des produits, reçoit des commandes |
| `SUPPLIER` | Fournisseur | Propose des services / produits côté fournisseur |

Langue de l’UI : **français**. Marché visé : **Sénégal** (Dakar).

Site public prévu : [https://bibocommarket.com](https://bibocommarket.com)

---

## 2. Où tu travailles (très important)

Sur ta machine, le dossier parent ressemble à ça :

```
Mono_Market/
├── init-web-frontend/     ← TU TRAVAILLES ICI (Next.js)
├── BiboMarketFontEnd/     ← ancien frontend Vite — ne pas modifier
└── BiboMarketBackEnd/     ← backend — ne pas modifier sauf demande
```

| Dossier | Rôle |
|---------|------|
| **`init-web-frontend`** | Frontend actuel, repo GitHub **BiboMarketFont** |
| `BiboMarketFontEnd` | Ancienne app **Vite + React**. Sert de référence, pas de cible |
| `BiboMarketBackEnd` | API. En local Docker, on utilise souvent une **image Hub**, pas forcément ce dossier |

Le nom GitHub **BiboMarketFont** (avec un « t ») est bien **ce frontend Next.js**. Ce n’est pas l’ancien `BiboMarketFontEnd`.

**Remote Git de ce projet :**  
[https://github.com/bibocomdigital/BiboMarketFont.git](https://github.com/bibocomdigital/BiboMarketFont.git)

Branche de travail habituelle : **`develop`**.  
Autres branches distantes vues : `main`, `staging`.

---

## 3. Stack technique

| Élément | Choix |
|---------|--------|
| Framework | **Next.js 16** (App Router) |
| UI | **React 19** |
| Styles | **Tailwind CSS 4** |
| Données serveur | **TanStack Query** |
| HTTP | **Axios** + encore beaucoup de `fetch` hérités |
| Formulaires | **react-hook-form** + **Zod** |
| Composants | Radix UI (style shadcn) |
| Langage | TypeScript |

Le serveur de dev local écoute sur le **port 8080** (`npm run dev`).

---

## 4. Comment le code est organisé

Next.js a besoin du dossier `app/` pour les **routes**.  
Le vrai code métier / UI est dans `src/`, en couches :

```
init-web-frontend/
├── app/                          # Routes (fichiers page.tsx très minces)
├── src/
│   ├── domain/                   # Règles pures : User, erreurs, constantes SEO
│   ├── application/              # Cas d’usage : login, logout, register
│   ├── infrastructure/           # HTTP, Axios, TanStack Query, services API
│   └── presentation/             # Pages, composants, hooks, SEO
├── public/                       # Images, favicon
├── docker-compose.yml
└── Dockerfile
```

### Comment une page est branchée

1. L’URL `/login` → fichier `app/login/page.tsx`
2. Ce fichier **importe** surtout `src/presentation/pages/Login.tsx`
3. La page utilise des composants dans `src/presentation/components/`
4. Les appels API passent par `src/infrastructure/services/` ou des hooks dans `src/presentation/hooks/`

**Pour changer l’écran de connexion**, tu modifies `src/presentation/pages/Login.tsx` (et le formulaire), pas le backend.

Astuce héritée de Vite : beaucoup d’imports `react-router-dom` (`Link`, `useNavigate`). Ils sont **redirigés** vers un adaptateur Next.js :

`src/presentation/lib/react-router-compat.tsx`

Tu peux continuer à voir `from "react-router-dom"` : ce n’est pas un vrai React Router.

---

## 5. Les pages importantes

| URL | À quoi ça sert |
|-----|----------------|
| `/` | Accueil : hero, produits, boutiques |
| `/login` | Connexion (téléphone ou email) |
| `/register` | Inscription (Client / Commerçant / Fournisseur) |
| `/verify-code` | Code reçu par email après inscription |
| `/boutique` et `/boutiques` | Liste des boutiques |
| `/boutique/[shopId]` | Fiche d’une boutique |
| `/cart` | Panier |
| `/client-dashboard` | Espace client |
| `/merchant-dashboard` | Espace commerçant |
| `/supplier-dashboard` | Espace fournisseur |
| `/profile` | Profil |
| `/commandes/[orderId]` | Détail d’une commande |
| `/commandes-recues` | Commandes reçues (commerçant) |
| `/whatsapp` | Messagerie type WhatsApp |
| `/about`, `/contact` | Pages vitrine |

Après login, redirection selon le rôle :

- commerçant → `/merchant-dashboard`
- fournisseur → `/supplier-dashboard`
- sinon → `/client-dashboard`

Il n’y a **pas de `middleware.ts` Next**. La session repose sur le **token dans `localStorage`**. Les pages « privées » ne sont pas vraiment verrouillées côté Next : c’est l’API qui refuse sans token.

---

## 6. Authentification (à retenir)

1. Login : `POST /auth/login` avec email **ou** téléphone + mot de passe
2. Le backend renvoie `{ token, user }`
3. Le frontend stocke **`token`** et **`user`** dans `localStorage`
4. Axios (et une partie des `fetch`) envoient `Authorization: Bearer …`

**Il n’y a pas de refresh token.**  
Si le JWT expire → 401, il faut se reconnecter. Pas de boucle refresh.

Fichier central : `src/infrastructure/services/authService.ts`

---

## 7. Comment le frontend parle au backend

Deux variables :

| Variable | Rôle |
|----------|------|
| `NEXT_PUBLIC_API_URL` | URL vue **par le navigateur** (préfixe `NEXT_PUBLIC_` = exposée au client) |
| `API_URL` | URL utilisée **côté serveur Next** (rewrites `/api/...`) |

Exemple local (`.env.example`) :

```
NEXT_PUBLIC_API_URL=http://localhost:8001/api
NEXT_PUBLIC_SITE_URL=http://localhost:8080
API_URL=http://localhost:8001/api
```

Avec **Docker Compose** du frontend :

- UI : `http://localhost:3006`
- API navigateur : `http://localhost:3005/api`
- Backend dans Compose : image `bibocomdigital/bibomarket-backend-develop:latest`

Dans `next.config.ts`, les appels `/api/...` du serveur Next sont **réécrits** vers l’API réelle.

TanStack Query (listes produits, boutiques, panier, etc.) :

- clés : `src/presentation/lib/query-keys.ts`
- client : `src/infrastructure/api/query-client.ts`
- hooks : `src/presentation/hooks/queries/` et `hooks/mutations/`

Politique de retry (idée) : on réessaie les erreurs réseau / 5xx, **pas** les 400/401/403/404.

---

## 8. Lancer le projet

### Option A — sans Docker (le plus simple pour l’UI)

```bash
cd init-web-frontend
cp .env.example .env          # adapte l’URL de l’API si besoin
npm install
npm run dev
```

Ouvre **http://localhost:8080**

Si le backend n’est pas démarré, l’accueil affiche un état « catalogue indisponible » (ce n’est pas un bug de page blanche).

### Option B — Docker Compose

```bash
cd init-web-frontend
docker compose up --build
```

- Frontend : **http://localhost:3006**
- Backend (image Hub) : **http://localhost:3005**

Attention : ne mélange pas un `.next` créé **dans Docker** avec un `npm run dev` **sur l’hôte**. Si Next plante avec une erreur de permission sur `.next`, supprime le cache :

```bash
rm -rf .next
npm run dev
```

---

## 9. Où modifier quoi (carte mentale)

| Tu veux… | Tu vas dans… |
|----------|----------------|
| Changer une page visible | `src/presentation/pages/` |
| Changer un formulaire / un bouton | `src/presentation/components/` |
| Changer une route URL | `app/.../page.tsx` (et parfois le layout) |
| Changer un appel API | `src/infrastructure/services/` |
| Changer le cache / retry | `src/infrastructure/api/` + hooks Query |
| Changer titres SEO | `src/presentation/seo/metadata.ts` |
| Couleurs marque (navy, etc.) | `app/globals.css` (`bibocom-primary`, …) |
| Docker / ports | `docker-compose.yml`, `Dockerfile` |

Couleurs de marque usuelles :

- Navy : `#0A2540` (`bibocom-primary`)
- Turquoise : `#8DD1E0` (`bibocom-secondary`)
- Corail : `#FF7E5F` (`bibocom-accent`)

---

## 10. Fonctionnalités déjà dans le produit

- Accueil avec recherche de produits et carrousel de boutiques
- Inscription / connexion (dont Google côté social)
- Panier et commandes
- Boutique du commerçant (création, produits, commandes reçues)
- Messages / écran type WhatsApp
- Notifications
- SEO (balises, sitemap, robots, JSON-LD)

Le dashboard **fournisseur** est plus léger que celui du commerçant : ne t’étonne pas s’il est moins fourni.

---

## 11. Pièges pour ne pas perdre de temps

1. **Mauvais dossier** — `BiboMarketFontEnd` (Vite) n’est pas le projet GitHub actuel.
2. **Mauvais remote** — `origin` doit être `BiboMarketFont.git`, pas l’ancien repo Waxci.
3. **Pas de garde Next** — une URL dashboard s’ouvre même sans login ; l’API bloque ensuite.
4. **Build TypeScript** — `next.config.ts` a `ignoreBuildErrors: true`. Un build vert ne veut pas dire zéro erreur TS.
5. **Mix fetch / Axios** — les services anciens utilisent encore `fetch`. Les nouveaux flux passent plutôt par Query + Axios.
6. **Logs `console.log`** — beaucoup de traces héritées dans l’auth et les likes : bruyant en dev, pas forcément à « nettoyer » dans une petite PR sauf demande.

---

## 12. Routine Git recommandée (ce repo seulement)

```bash
cd init-web-frontend
git status
git switch develop
git pull origin develop
```

Ne pousse **pas** vers `BiboMarketBackEnd` ni `BiboMarketFontEnd`.  
Ici, uniquement : [https://github.com/bibocomdigital/BiboMarketFont.git](https://github.com/bibocomdigital/BiboMarketFont.git)

---

## 13. Par où commencer concrètement

1. Lancer `npm run dev` et ouvrir `/`, `/login`, `/register`
2. Lire `src/presentation/pages/Index.tsx` (accueil)
3. Lire `LoginFormContent.tsx` + `authService.ts` (auth)
4. Lire un hook Query, par ex. `src/presentation/hooks/queries/use-shops-query.ts`
5. Ensuite seulement : dashboards commerçant / client

Si quelque chose casse « serveur injoignable », c’est presque toujours l’API (port, Docker, `.env`), pas la page Next elle-même.
