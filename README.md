# Ace of Spades - Panel de combate

Aplicación web progresiva (PWA) creada como herramienta personal de apoyo para
llevar los contadores y consultar las combinaciones durante una partida de
*Ace of Spades*.

Creada por [RaaulMM](https://github.com/RaaulMM).

## Características

- Control de vida, jugadas y descartes del combate.
- Cálculo de daño según la combinación de póker.
- Tabla visual de combinaciones y bonificadores.
- Detección de victoria y derrota.
- Guardado local de la partida.
- Instalación como PWA.
- Funcionamiento sin conexión después de la primera carga.

## Uso local

La aplicación necesita servirse mediante HTTP para habilitar el modo PWA:

```powershell
python -m http.server 4173
```

Después, abre `http://localhost:4173` en el navegador.

## Instalación en un dispositivo

La aplicación puede publicarse como sitio estático mediante GitHub Pages,
Netlify, Cloudflare Pages o un servicio equivalente que proporcione HTTPS.

- Android: abre la web con Chrome y selecciona **Instalar aplicación**.
- iPhone/iPad: abre la web con Safari y selecciona
  **Compartir > Añadir a pantalla de inicio**.

## Naturaleza del proyecto

Este es un proyecto personal, independiente, gratuito y sin ánimo de lucro.
No es un producto oficial, no está afiliado ni respaldado por los autores,
editoriales o titulares de derechos de *Ace of Spades*, y no pretende sustituir
el juego ni su reglamento.

El nombre del juego y cualquier marca, concepto, texto o material perteneciente
al producto original son propiedad de sus respectivos titulares. Este
repositorio contiene únicamente una herramienta complementaria creada de forma
independiente.

## Licencia

El código fuente está disponible públicamente para consulta, aprendizaje,
modificación y uso personal no comercial.

No se permite:

- vender esta aplicación o copias de ella;
- cobrar por su acceso, descarga, instalación o utilización;
- incluirla en productos o servicios de pago;
- utilizarla con fines comerciales o publicitarios;
- eliminar los avisos de autoría, licencia o carácter no oficial.

Esta licencia contiene restricciones comerciales y, por ello, el proyecto es
**código fuente disponible** (*source-available*), no software de código abierto
según la definición de la Open Source Initiative.

Consulta los términos completos en [LICENSE](./LICENSE).

Para consultas relacionadas con permisos, utiliza el perfil de
[RaaulMM en GitHub](https://github.com/RaaulMM).
