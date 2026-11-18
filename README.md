# Misión Gaetano 6

Invitación web al cumpleaños 6 de Gaetano: sábado 5 de diciembre de 2026, 11:00 a. m. (hora de Perú).

- **Página pública:** https://gaetano.gofest.us
- Lo que llega a la rama `main` se publica desde el servidor de la familia (no sale solo: hay que pedir la publicación).

## Qué hay aquí

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Toda la página: diseño (CSS), contenido y juego (JavaScript), en un solo archivo. |
| `img/portada.jpg` | Foto de la portada (también es la imagen que sale al compartir el enlace). |
| `img/invitacion.jpg` | La invitación (Misión 2). |
| `img/base.jpg` | Foto de la Misión 3. |
| `img/te-espero.jpg` | Foto de la Misión 4. |
| `audio/musica.mp3` | La canción de fondo (suena en bucle desde que se abre la invitación). |
| `audio/gaetano-hola.mp3`, `audio/gaetano-gracias.mp3`, `audio/gaetano-rescate.mp3` | La voz de Gaetano: «¡Hola, soy Gaetano! ¡Te invito a mi fiesta!» (al abrir y en el botón «Escucha a Gaetano» de la Misión 2), «¡Gracias por confirmar! ¡Te espero!» (al confirmar) y «¡Lo rescataste! ¡Bien hecho!» (la primera vez que rescatan un marcianito). |
| `robots.txt` | Pide a los buscadores que no muestren la página. |

## Cómo está armada la página

Al abrir el enlace aparece primero la **transmisión entrante**: un cohete y el botón «Abrir mensaje». Al tocarlo entra una música suave, hay una cuenta regresiva (3, 2, 1), sale la frase «¡Al infinito… y más allá!», el cohete enciende motores y despega, y recién ahí se muestra la invitación, ya con la canción. Está en `index.html`, en la sección «Intro». La música suave, la cuenta y el cohete se generan en el navegador (`ambiente`, `motores` y `efecto` dentro de `const Musica`); la música va en mi bemol mayor, el tono de la canción, para que el cambio no desentone. Antes del primer toque no suena nada: ningún celular lo permite.

Después vienen cuatro misiones, de arriba hacia abajo. **Se abren una por una** (ver «Paso a paso» más abajo):

1. **Rescata a un marcianito:** máquina de garra dibujada en SVG. El invitado la mueve con las flechas o con el dedo y la suelta. La lógica está en `index.html`, en la sección «Máquina de garra». Al rescatarlo, el marcianito da las gracias «hablando» (el texto sale letra por letra con pitidos de idioma marciano), anuncia el premio —una invitación especial— y pregunta «¿Quieres descubrirla?»; el invitado abre el sobre con su toque y **del sobre sale la invitación de verdad** (la misma imagen de la Misión 2): crece hasta verse entera, se queda un momento y vuela a su lugar en la Misión 2, así no aparece de la nada. Un toque antes de tiempo salta la charla. La lógica está en `const Premio` (`vuela` hace la salida de la invitación); las frases, en `F`.
2. **Lee tu invitación:** muestra `img/invitacion.jpg`; se amplía al tocarla.
3. **Llega a la base a tiempo:** cuenta regresiva, botón «Cómo llegar» (Google Maps) y el plan de la fiesta.
4. **Confirma a tu tripulación:** el «pase de abordar». El invitado lo llena ahí mismo (nombre, si van, cuántos hermanitos y quién acompaña) y lo envía sin salir de la página. Al enviarlo sale la celebración «¡Te esperamooos!» con el cohete y el confeti, y el pase queda sellado como «Confirmado».

La música de fondo es `audio/musica.mp3`. Los efectos (cuenta regresiva, cohete, garra) se generan en el navegador con Web Audio.

**Paso a paso.** Nadie puede bajar a una misión sin completar la anterior: al entrar solo se ve la portada con las cuatro misiones con candado. «Aceptar la misión» abre la 1; rescatar a un marcianito abre la 2; «¡Leída! Siguiente misión» abre la 3; «¡Anotado! Última misión» abre la 4 (la confirmación). Debajo de la misión en curso hay un aviso con candado que dice qué falta; si lo tocan (o tocan una misión con candado), la página les señala el botón que deben usar. El avance se recuerda en el teléfono (`mg6_paso`) y quien ya confirmó ve todo abierto. Redes de seguridad: si la página tuviera un error, o sin JavaScript, se muestra todo (nadie se queda sin poder confirmar); y si alguien pasa 20 segundos en la máquina sin rescatar a nadie, se le señala «¡Soltar!». La lógica está en `const Pasos`; lo que está cerrado lleva la clase `cerrada`.

**La voz de Gaetano.** Al abrir la invitación (o al tocar «Aceptar la misión» si se saltó la entrada) arranca la canción y Gaetano dice «¡Hola, soy Gaetano! ¡Te invito a mi fiesta!». La primera vez que rescatan un marcianito dice «¡Lo rescataste! ¡Bien hecho!» y al confirmar que van, «¡Gracias por confirmar! ¡Te espero!». En la Misión 2 el botón «Escucha a Gaetano» repite el saludo. Lo que dice aparece escrito abajo (sirve con el celular en silencio). La canción nunca se apaga: mientras él habla baja un poco (en iPhone no se puede bajar, ahí la voz suena un poco más fuerte). Los archivos de voz ya vienen al volumen final (−14 LUFS, pico −1 dB) y la página los reproduce tal cual, sin compresor. El subtítulo no bloquea los toques. La lógica está en `const Gaetano` y en `Musica.habla`; los textos, en `TXT`.

En iPhone el navegador solo deja sonar un audio que arrancó con un toque. Por eso la canción arranca en silencio al tocar «Abrir mensaje» y se le quita el silencio al terminar la cuenta regresiva. La lógica está en `const Musica`.

## Cambios frecuentes

- **Fecha, hora y lugar:** en `index.html`, busca `const FIESTA`. Ahí están `fecha`, `lugar`, `destino` (coordenadas para Google Maps) y `fachada`.
- **Horarios del plan:** busca `<ol class="plan"`.
- **Textos de la portada:** busca `id="titular"` y la función `aplicaNombre`.
- **Fotos:** reemplaza los archivos de `img/` con el mismo nombre.
- **Voz de Gaetano:** reemplaza `audio/gaetano-*.mp3` con el mismo nombre (MP3 mono de 128 kbps, a −14 LUFS y pico −1 dB) y, si cambia la frase, cámbiala en `TXT` dentro de `const Gaetano`.
- **Voz del despegue:** para que Gaetano diga «¡Al infinito… y más allá!» en la intro, guarda la grabación (por ejemplo `audio/gaetano-infinito.mp3`) y pon su ruta en `FIESTA.vozDespegue`; en `FIESTA.vozDespegueCorte` va el segundo en que empieza «…y más allá» (ahí despega el cohete). Si `vozDespegue` queda vacío, la frase sale solo escrita.
- **Textos de los candados:** en `const Pasos` (`TOPE` y `AVISO`).
- **Música:** reemplaza `audio/musica.mp3` por otra canción con el mismo nombre. Conviene MP3 de 128 kbps (unos 2,5 MB para 2,5 minutos) para que cargue rápido en el celular.

## Enlace con el nombre de cada invitado

Agrega el nombre al final del enlace, con `#` y sin tildes ni espacios:

- `https://gaetano.gofest.us/#Mateo`
- `https://gaetano.gofest.us/#Maria-Jose`

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
