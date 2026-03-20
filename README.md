# 🤖 AyudinBot

AyudinBot es un bot de Discord pensado para entornos educativos, diseñado para asistir a alumnos brindando orientación sobre contenidos de la materia a partir de material provisto (como PDFs), utilizando inteligencia artificial.

> 💡 La idea es que los alumnos puedan hacer preguntas y el bot los guíe hacia dónde encontrar la respuesta dentro del material, mientras esperan la respuesta de un docente o ayudante.

---

## 🧠 Objetivo del proyecto

Construir un bot educativo que:

* Permita a los alumnos hacer preguntas
* Consulte material académico (PDFs)
* Use IA para orientar respuestas
* Mejore la experiencia de aprendizaje en Discord

---

## 🏗️ Estructura del proyecto

```bash
AyudinBot/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── bot/
│   │   ├── commands/
│   │   │   ├── public/
│   │   │   │   └── preguntar.ts
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── configurarRol.ts
│   │   │       ├── configurarCanal.ts
│   │   │       └── ingresarPdf.ts
│   │   │
│   │   ├── events/
│   │   │   ├── interactionCreate.ts
│   │   │   └── ready.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── backend/
│   │   └── controllers/
│   │   └── services/
│   │       ├── guildService.ts
│   │       └── pdfService.ts
│   │
│   ├── database/
│   │   └── prisma/
│   │       └── client.ts
│   │
│   ├── config/
│   │   └── env.ts
│   │
│   ├── utils/
│   │   └── permissions/
│   │       └── permissions.ts
│   │
│   └── index.ts
│
├── .env
├── dev.db
├── package.json
└── tsconfig.json
```
---
## 💬 Comandos disponibles

### Administrador

* `/configurar-rol`

    * Define el rol administrador del bot

* `/configurar-canal`

    * Permite configurar:

        * canal de materiales
        * canal de preguntas

---

## 🧩 Cómo funciona internamente

1. Discord envía una interacción (`interactionCreate`)
2. Se detecta el comando
3. Se busca en el `commandMap`
4. Se ejecuta su `execute()`
5. Se responde al usuario
6. Si aplica, se persiste en la base de datos (Prisma)

---

## 🛣️ Roadmap

### 🟢 Fase 1 — Base del bot (COMPLETADA)

* [x] Conexión a Discord
* [x] Slash commands
* [x] Validación de permisos
* [x] Persistencia de configuración por guild

---

### 🟡 Fase 2 — Gestión de contenido (EN PROGRESO)

* [x] `/ingresar-pdf`
* [x] Almacenamiento de PDFs
* [x] Registro de documentos en base de datos
* [x] Asociación de documentos por servidor

---

### 🟠 Fase 3 — Procesamiento de información

* [ ] Extracción de texto de PDFs
* [ ] Indexación de contenido
* [ ] Búsqueda por relevancia

---

### 🔵 Fase 4 — IA integrada

* [ ] Integración con LLM (OpenAI u otro)
* [ ] Generación de respuestas basadas en contexto
* [ ] RAG (Retrieval-Augmented Generation)

---

### 🟣 Fase 5 — Mejora de UX

* [ ] Respuestas más naturales
* [ ] Mensajes enriquecidos
* [ ] Logs y monitoreo
* [ ] Manejo de errores robusto

---

## 🛠️ Tecnologías utilizadas

* **TypeScript**
* **Discord.js**
* **Prisma**
* **SQLite**
* (futuro) **OpenAI / IA**

---

## 📌 Notas

* Este proyecto está en desarrollo activo
* El uso de IA será agregado progresivamente

---

## 🤝 Contribuciones

Pull requests y sugerencias son bienvenidas 🚀
