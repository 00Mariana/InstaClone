# InstaClone - Project Context

> Ultima actualizacion: 2026-05-11
> Estado: MVP completo - Auth, Posts, Likes, Comments, Follow, Profile, Cloudinary

---

## 1. Stack Tecnologico

### Frontend
- **Framework**: React 19.2.5
- **Build**: Vite 8.0.10
- **Styling**: CSS vanilla (variables CSS, light/dark mode)
- **Linting**: ESLint 10.2.1

### Backend
- **Framework**: Express 5.2.1
- **Database**: PostgreSQL (driver `pg` 8.20.0, sin ORM)
- **Auth**: JWT (`jsonwebtoken` 9.0.3) + bcrypt 6.0.0
- **Dev**: nodemon 3.1.14

---

## 2. Estructura del Proyecto

```
InstaClone/
├── client/                    # Frontend React (Vite)
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/            # imagenes
│   │   ├── components/        # Navbar, Post, Comment
│   │   ├── context/           # AuthContext (JWT auth state)
│   │   ├── pages/             # Home, Login, Register, Profile
│   │   ├── App.jsx            # Router + AuthProvider
│   │   ├── index.css          # Instagram-style CSS
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── package.json
│
├── server/                    # Backend Express
│   ├── config/
│   │   └── cloudinary.js      # Cloudinary upload config
│   ├── middleware/
│   │   └── auth.js            # JWT auth middleware
│   ├── routes/
│   │   ├── auth.js            # Register, Login, /me
│   │   ├── posts.js           # CRUD posts, feed, user posts
│   │   ├── users.js           # Profile, follow/unfollow
│   │   ├── comments.js        # CRUD comments
│   │   └── likes.js           # Like/unlike posts
│   ├── index.js               # Server + routes
│   ├── db.js                  # PostgreSQL pool
│   ├── schema.sql             # Tablas: users, posts, likes, comments, follows
│   ├── .env                   # Variables (protegido en gitignore)
│   └── package.json
│
└── README.md
```

---

## 3. Estado Actual del Proyecto

### Implementado
- Auth completo (registro, login, JWT)
- CRUD de posts con upload a Cloudinary
- Feed personalizado (posts de usuarios seguidos + propios)
- Likes (like/unlike posts con contador)
- Comentarios (agregar/eliminar en posts)
- Follow/Unfollow system
- Paginas de perfil con estadisticas
- Subida de imagenes via Cloudinary + Multer
- UI responsive estilo Instagram (light/dark mode)
- Todas las tablas de DB creadas

### Pendiente
- Polishing UI
- Tests
- Buscar usuarios para seguir
- Notifications
- DM/Chat

---

## 4. Base de Datos

- **Motor**: PostgreSQL
- **Driver**: `pg` (queries raw, sin ORM)
- **Host**: localhost:5432
- **DB name**: `instaclone`
- **Credenciales**: En `server/.env` (DB_USER, DB_PASSWORD, etc.)
- **Schema**: Creado (ver `server/schema.sql`)

### Tablas
| Tabla | Descripcion |
|-------|-------------|
| users | id, username, email, password, full_name, bio, profile_picture, created_at |
| posts | id, user_id, image_url, caption, created_at |
| likes | id, user_id, post_id (unique constraint) |
| comments | id, user_id, post_id, content, created_at |
| follows | id, follower_id, following_id (unique constraint) |

---

## 5. Configuracion

### Variables de entorno (server/.env)
```
PORT=5000
JWT_SECRET=instaclone_super_secret_key
DB_USER=postgres
DB_HOST=localhost
DB_NAME=instaclone
DB_PASSWORD=admin123
DB_PORT=5432
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
> **IMPORTANTE**: El archivo `.env` contiene secrets. NO hacer commit. Protegido en `.gitignore`.

### Gitignore
```
node_modules/
.env
*.env
```
> Protege archivos sensibles de ser subidos a GitHub

### Scripts npm

**Server:**
```bash
npm run dev    # nodemon
npm start      # node
```

**Client:**
```bash
npm run dev      # Vite dev server
npm run build    # Build produccion
npm run lint     # ESLint
npm run preview  # Preview build
```

---

## 6. Registro de Commits

| Commit | Mensaje |
|--------|---------|
| `f8f9f3e` | Initial commit |
| `35e0c7f` | feat: initial project setup - React frontend and Express backend |
| `b446ea2` | feat: PostgreSQL database setup and connected to Express server |

---

## 7. Notas Importantes para el Siguiente Agente

- DB credentials ahora en `.env` (no mas hardcoded)
- Cloudinary integrado con Multer para uploads
- JWT auth en `middleware/auth.js`
- Dark mode funciona via `prefers-color-scheme`
- Puerto default del server: 5000
- Client corre en puerto default Vite (usualmente 5173)
- Para que funcione Cloudinary: necesitas cuenta en cloudinary.com y poner tus credenciales en `.env`

## 8. API Endpoints

| Method | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | /api/auth/register | Registro de usuario |
| POST | /api/auth/login | Login, retorna JWT |
| GET | /api/auth/me | Info del usuario actual |
| GET | /api/posts/feed | Feed personalizado |
| POST | /api/posts | Crear post (multipart) |
| DELETE | /api/posts/:id | Eliminar post |
| GET | /api/posts/user/:userId | Posts de un usuario |
| GET | /api/users/:userId | Perfil de usuario |
| PUT | /api/users | Editar perfil |
| POST | /api/users/:userId/follow | Seguir usuario |
| DELETE | /api/users/:userId/follow | Dejar de seguir |
| POST | /api/likes/:postId | Like post |
| DELETE | /api/likes/:postId | Unlike post |
| GET | /api/comments/:postId | Comentarios de post |
| POST | /api/comments/:postId | Agregar comentario |
| DELETE | /api/comments/:id | Eliminar comentario |

---

*Este documento se actualizara conforme se hagan cambios al proyecto.*