# TECNO VENTAS · Multijugador en vivo

Aplicación en español para jugar **simultáneamente desde celulares, tabletas o computadores**, con un presentador que controla la sala y cada participante resolviendo las pruebas en su pantalla.

**Incluye:** cuestionarios contrarreloj, sopa de letras con pistas, rompecabezas para formar palabras, memorama de conceptos, clasificación en directo, selección de modalidad, código de sala y exportación de resultados. Los contenidos se basan en transformación tecnológica de las ventas, redes y comercio electrónico, CRM, IA, automatización y riesgos digitales.

## Publicarlo en internet (necesario para celulares diferentes)

Este es un **sitio web con servidor**. No funciona subiendo solo el HTML a Netlify Drop, Google Drive o un hosting exclusivamente estático. **El archivo ZIP no es todavía una página pública**; debes desplegarlo.

### Opción recomendada: GitHub + Render

1. Descomprime el ZIP. Crea un repositorio en https://github.com/new y sube **el contenido** de la carpeta `TECNO_VENTAS_MULTIJUGADOR`: `server.js`, `package.json`, `render.yaml`, `README.md` y la carpeta `public` con `index.html`.
2. En https://dashboard.render.com/ selecciona **New → Web Service**, conecta el repositorio y selecciona Node. También puedes usar **New → Blueprint** si tu cuenta permite importar el `render.yaml`.
3. Configura `Build command: npm install`, `Start command: npm start` (el programa acepta `PORT` automáticamente) y usa un plan que permita WebSocket. En Render suele estar disponible una instancia gratuita para pruebas, sujeta a sus límites actuales.
4. Cuando Render marque el servicio como disponible, abre la URL `https://...onrender.com` (o tu dominio) en el navegador.
5. En el computador del docente: **Soy el profesor → Crear sala**, escoge Gran circuito y comparte el enlace/código. En cada celular: **Voy a jugar → Nombre + Código**. Espera a que se unan y pulsa **Empezar**.

**Importante:** el enlace público lo entrega el proveedor cuando publicas el sitio; aquí no se ha creado ningún sitio público ni servidor remoto.

### Ejecutarlo en tu propio computador (prueba)

Requiere Node.js 20 o superior. En una terminal, dentro de la carpeta:

```
npm start
```

Abre `http://localhost:3000` en el equipo que ejecuta Node. En una red Wi-Fi compartida, los estudiantes pueden entrar desde sus celulares usando `http://IP-DEL-COMPUTADOR:3000`, por ejemplo `http://192.168.1.10:3000`, si el firewall permite conexiones entrantes al puerto 3000 y la red no aísla los dispositivos. Puedes consultar la IP local con `ipconfig` (Windows) o `hostname -I` (Linux). Esto también permite jugar simultáneamente sin publicar la página en internet, siempre que los dispositivos compartan la red local. Fuera de tu red local, necesitas desplegarlo.

## Cómo se juega

- El profesor crea una **sala de 6 caracteres**. Un estudiante entra con su nombre y el mismo código, sin instalar apps.
- La modalidad **Gran circuito** incluye seis rondas: quiz, sopa de letras, rompecabezas, memoria y dos preguntas rápidas más. También hay modalidades independientes.
- Todos reciben **la misma ronda a la vez** y compiten en **sus propios dispositivos**, no por turnos en el mismo computador.
- El cronómetro y la puntuación se gestionan en el servidor. Cada estudiante ve su avance y la clasificación.
- Al finalizar cada ronda se muestra el resultado y el profesor inicia la siguiente. Al terminar, el profesor puede exportar la clasificación a CSV.

## Capacidad y limitaciones

- Hasta **80 jugadores por sala** en la lógica de la aplicación, pero el rendimiento real depende del plan de hosting, servidor, red y cantidad de conexiones. Se recomienda hacer un ensayo con el grupo antes de la actividad.
- El profesor debe permanecer conectado para avanzar entre rondas. Si vuelve a abrir su pestaña durante la sesión, el navegador intenta recuperar su identidad automáticamente.
- Salas, jugadores y puntos se guardan **solo en memoria del servidor**. Si se reinicia o entra en reposo, la sala se pierde; exporta resultados antes de cerrar. Los servicios gratuitos pueden suspenderse por inactividad.
- Un enlace de sala permite unirse sin contraseña; no lo publiques fuera del grupo. No se solicita correo ni se requiere registro de alumnos. Para una actividad escolar, evita nombres completos si no son necesarios.
- La página envía señales periódicas de actividad al servidor mientras haya una partida abierta. WebSocket sobre HTTPS (wss) requiere un hosting con soporte para conexiones persistentes. No son necesarios servicios externos ni librerías de pago para este proyecto.

## Cambiar preguntas y respuestas

En `server.js` están los bancos `QUIZ`, `WORDS`, `PUZZLES` y `MEMORIES`. Puedes editarlos con un editor de texto y volver a publicar.

## Archivos

- `server.js`: servidor HTTP, comunicación WebSocket y reglas/validación de puntos.
- `public/index.html`: página adaptable a móviles con los cuatro minijuegos.
- `package.json`: comando para iniciar el servidor, sin dependencias externas.
- `render.yaml`: configuración opcional de despliegue en Render.
