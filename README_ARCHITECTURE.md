# Arquitectura y Buenas Prácticas (magic2k-landing)

## Estructura
- `src/`
  - `assets/`: imágenes, audio, fuentes
  - `chat/`: lógica y pantallas del chat
    - `components/`: UI reutilizable de chat
    - `screens/`: vistas
    - `SocketContext.jsx` / `AuthContext.jsx`
    - `api.js` / `socket.js`
  - `config/`: constantes y configuraciones de UI/Estados
    - `userStates.js`
  - `utils/`: helpers generales
    - `logout.js`
  - `routes/`: definición de rutas

## Alias de paths
- Usar `@` para importar desde `src`.
  - Configurado en `vite.config.js` y `jsconfig.json`.

## Formato y estilo
- Prettier: `.prettierrc.json`
- EditorConfig: `.editorconfig`
- ESLint: `eslint.config.js`

## Scripts
```sh
npm run dev
npm run build
npm run preview
npm run lint
```

## Lineamientos
- Colocar constantes en `config/`.
- Reutilizar componentes en `chat/components/`.
- Evitar estilos duplicados; usar clases o utilidades.
- Mantener importaciones absolutas con `@/`.
- Centralizar lógica de sesión en `utils/logout.js`.
