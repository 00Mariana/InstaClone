# InstaClone - Project Context

> Ultima actualizacion: 2026-05-11
> Estado: Early development - Scaffold completo, sin features implementadas

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
├── client/              # Frontend React (Vite)
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/       # imagenes (hero.png, logos)
│   │   ├── App.jsx       # Componente principal (demo Vite)
│   │   ├── App.css
│   │   ├── index.css     # Estilos globales
│   │   └── main.jsx      # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── package.json
│
├── server/               # Backend Express
│   ├── index.js          # Server principal + rutas
│   ├── db.js             # Conexion PostgreSQL
│   ├── .env              # Variables de entorno
│   └── package.json
│
├── README.md
└── .git/
```

---

## 3. Estado Actual del Proyecto

### Implementado
- Server Express basico con CORS y JSON parsing
- Conexion a PostgreSQL (localhost:5432, db: `instaclone`)
- Credenciales hardcodeadas en `server/db.js` (user: postgres, pass: admin123)
- Endpoints de prueba:
  - `GET /` -> status de la API
  - `GET /test-db` -> prueba de conexion a DB
- JWT_SECRET configurado en .env

### Pendiente (del README original)
- Sistema de autenticacion (registro, login, JWT middleware)
- Schema de base de datos (tablas: users, posts, comments, likes, follows)
- API REST completa
- Subida de imagenes (Cloudinary/S3)
- UI tipo Instagram
- Features sociales (likes, comentarios, follows)

---

## 4. Base de Datos

- **Motor**: PostgreSQL
- **Driver**: `pg` (queries raw, sin ORM)
- **Host**: localhost:5432
- **DB name**: `instaclone`
- **Credenciales**: `postgres / admin123` (hardcoded en `db.js`)
- **Schema**: NO CREADO - aun no existen tablas

---

## 5. Configuracion

### Variables de entorno (server/.env)
```
PORT=5000
JWT_SECRET=instaclone_super_secret_key
```
> DB credentials NO estan en .env - estan harcodeadas en `server/db.js`
> **IMPORTANTE**: El archivo `.env` contiene secrets sensibles. NO hacer commit de este archivo. Ya esta en `.gitignore` y fue untracked con `git rm --cached server/.env`.

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

- El frontend `App.jsx` es codigo demo de Vite - necesita ser reemplazado
- NO hay todavia controllers, routes organizadas ni servicios en backend
- Credentials de DB en `server/db.js` deberian moverse a .env
- Frontend usa `"type": "module"` - ES modules
- Dark mode ya soportado via CSS variables y `prefers-color-scheme`
- Puerto default del server: 5000

---

## 8. Proxima Sesion - Plan de Implementacion Sugerido

1. **Schema DB**: Crear tablas (users, posts, comments, likes, follows)
2. **Auth**: Registro, login, bcrypt, JWT middleware
3. **API REST**: CRUD de posts, users
4. **Frontend**: Reemplazar demo Vite con UI real
5. **Imagenes**: Integrar Cloudinary/S3

---

*Este documento se actualizara conforme se hagan cambios al proyecto.*