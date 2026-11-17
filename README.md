# Misión Gaetano 6

Invitación web al cumpleaños 6 de Gaetano: sábado 5 de diciembre de 2026, 11:00 a. m. (hora de Perú).

- **Página pública:** https://axel123456489.github.io/mision-gaetano-6/
- Se publica sola con GitHub Pages: cada cambio que llega a la rama `main` sale en la página en uno o dos minutos.

## Qué hay aquí

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Toda la página: diseño (CSS), contenido y juego (JavaScript), en un solo archivo. |
| `img/portada.jpg` | Foto de la portada (también es la imagen que sale al compartir el enlace). |
| `img/invitacion.jpg` | La invitación (Misión 2). |
| `img/base.jpg` | Foto de la Misión 3. |
| `img/te-espero.jpg` | Foto de la Misión 4. |
| `robots.txt` | Pide a los buscadores que no muestren la página. |

## Cómo está armada la página

Al abrir el enlace aparece primero la **transmisión entrante**: un cohete y el botón «Abrir mensaje». Al tocarlo hay una cuenta regresiva (3, 2, 1), el cohete despega y recién ahí se muestra la invitación, ya con música. Está en `index.html`, en la sección «Intro».

Después vienen cuatro misiones, de arriba hacia abajo:

1. **Rescata a un marcianito:** máquina de garra dibujada en SVG. El invitado la mueve con las flechas o con el dedo y la suelta. La lógica está en `index.html`, en la sección «Máquina de garra».
2. **Lee tu invitación:** muestra `img/invitacion.jpg`; se amplía al tocarla.
3. **Llega a la base a tiempo:** cuenta regresiva, botón «Cómo llegar» (Google Maps) y el plan de la fiesta.
4. **Confirma a tu tripulación:** el «pase de abordar». El invitado lo llena ahí mismo (nombre, si van, cuántos hermanitos y quién acompaña) y lo envía sin salir de la página. Al enviarlo sale la celebración «¡Te esperamooos!» con el cohete y el confeti, y el pase queda sellado como «Confirmado».

La música y los efectos se generan en el navegador (Web Audio); no hay archivos de audio.

## Cambios frecuentes

- **Fecha, hora y lugar:** en `index.html`, busca `const FIESTA`. Ahí están `fecha`, `lugar`, `destino` (coordenadas para Google Maps) y `fachada`.
- **Horarios del plan:** busca `<ol class="plan"`.
- **Textos de la portada:** busca `id="titular"` y la función `aplicaNombre`.
- **Fotos:** reemplaza los archivos de `img/` con el mismo nombre.

## Enlace con el nombre de cada invitado

Agrega el nombre al final del enlace, con `#` y sin tildes ni espacios:

- `https://axel123456489.github.io/mision-gaetano-6/#Mateo`
- `https://axel123456489.github.io/mision-gaetano-6/#Maria-Jose`

La página saluda al invitado por su nombre.

## Confirmaciones

El pase de abordar de la Misión 4 está en `index.html`: el diseño en la sección «Pase de abordar» del CSS, el formulario en `<form class="pase"` y la lógica en `const Pase`.

- **Adónde viaja la respuesta:** a la dirección que está en `FIESTA.confirmar` (un flujo de n8n de la familia). Ese flujo guarda la respuesta y avisa por WhatsApp.
- **Modo prueba:** si `FIESTA.confirmar` queda vacío (`''`), el pase no envía nada y solo muestra la celebración. Sirve para probar cambios de diseño sin generar confirmaciones.
- **Si el invitado se equivoca:** puede tocar «Cambiar mi respuesta» y volver a enviar. En la lista vale la última respuesta de cada nombre.
- La respuesta se recuerda en el teléfono del invitado, para que al volver a abrir el enlace vea su pase ya sellado.

Las respuestas se guardan fuera de este repositorio. La lista de confirmados es privada y no está aquí.

## Para probar en la computadora

Abre `index.html` en el navegador. No necesita instalar nada. Para probar el pase sin enviar una confirmación real, deja `FIESTA.confirmar` vacío mientras pruebas.
