/* «Control de misión» · panel privado de confirmaciones (Misión Gaetano 6).
   - La llave de acceso llega en el enlace (después del #), se guarda en este teléfono y se borra de la barra.
   - Los datos viven en n8n (flujo «Cumple Gaetano 6 · Panel de Marina»); aquí solo se muestran y se ordenan.
   - Todo texto que viene de afuera se pinta con textContent: nada se interpreta como HTML. */
(() => {
  'use strict';
  if (top !== self) return;                      // no se muestra dentro de otra página (marco ajeno)
  const API = 'https://n8n.mygisselle.com/webhook/gaetano-6-panel';
  const INVITACION = 'https://gaetano.gofest.us/';
  const FIESTA = new Date('2026-12-05T11:00:00-05:00'), FECHA_TXT = 'sábado 5 de diciembre, 11:00 a. m.', ZONA = 'America/Lima';
  const K_LLAVE = 'mg6_panel_llave', K_DATOS = 'mg6_panel_datos', K_VISTO = 'mg6_panel_visto';
  const $ = id => document.getElementById(id);
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const caja = {
    lee(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    pon(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    quita(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  let llave = '', datos = null, R = null, ver = 'si', busca = '', ocupado = false, cargando = false, ultima = 0, primera = true, visto = null, turnoCuenta = 0, serie = 0, minValida = 0, sesion = 0, firma = '';
  const enVuelo = new Set();

  /* ---------- Utilidades ---------- */
  const clave = s => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/\s+/).filter(Boolean).join(' ');
  const limpia = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').replace(/[0-9]{7,}/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios);
  const nom = e => (e.inv || e.conf).nombre;
  const sacaLlave = t => { const m = /(^|[^a-f0-9])([a-f0-9]{32})(?![a-f0-9])/i.exec(String(t || '')); return m ? m[2].toLowerCase() : ''; };
  const fmt = o => new Intl.DateTimeFormat('es-PE', Object.assign({ timeZone: ZONA }, o));
  const diaLima = d => { const o = {}; new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).forEach(p => { o[p.type] = p.value; }); return Date.UTC(+o.year, +o.month - 1, +o.day); };
  function cuando(iso) {
    const d = new Date(iso); if (isNaN(d)) return '';
    const hora = fmt({ hour: '2-digit', minute: '2-digit', hour12: false }).format(d), dif = Math.round((diaLima(new Date()) - diaLima(d)) / 86400000);
    if (dif === 0) return 'hoy ' + hora;
    if (dif === 1) return 'ayer ' + hora;
    return fmt({ day: 'numeric', month: 'short' }).format(d).replace('.', '') + ' ' + hora;
  }
  function avisa(t) { const a = $('aviso'); a.textContent = t; a.classList.add('ver'); clearTimeout(avisa.t); avisa.t = setTimeout(() => a.classList.remove('ver'), 2600); }
  function abre(d) { if (d.open) return; if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', ''); }
  function cierraTodo() { document.querySelectorAll('dialog[open]').forEach(d => d.close()); }
  const hayHoja = () => !!document.querySelector('dialog[open]');
  async function copia(t, ok) {
    try { await navigator.clipboard.writeText(t); avisa(ok); }
    catch (e) {
      const a = el('textarea', 'oculto-v'); a.value = t; a.setAttribute('readonly', '');
      (document.querySelector('dialog[open]') || document.body).appendChild(a); a.select();
      let bien = false; try { bien = document.execCommand('copy'); } catch (e2) {}
      a.remove(); avisa(bien ? ok : 'No se pudo copiar');
    }
  }
  // Enlace de la invitación. Desde la versión 8 la invitación saluda a todos igual (ya no lee el nombre del enlace): va sin nombre.
  function enlaceDe() { return INVITACION; }
  // Quien confirmó es adulto (Marina lo marca en la ficha): no cuenta entre los niños. Sus hermanitos, si anotó, sí.
  const esAdulto = c => !!(c && c.tipo === 'adulto');   // quien confirmó es un adulto

  /* ---------- Servidor ---------- */
  // Sesión: al salir o cambiar de llave, lo que estaba en camino se corta y, si igual llega, se descarta (nada vuelve a guardarse).
  const vieja = () => { const e = new Error('vieja'); e.vieja = true; return e; };
  function corta() { sesion++; enVuelo.forEach(c => c.abort()); enVuelo.clear(); firma = ''; }
  async function pide(accion, d) {
    const c = new AbortController(), t = setTimeout(() => c.abort(), 15000), n = ++serie, s = sesion;
    enVuelo.add(c);
    try {
      const r = await fetch(API, { method: 'POST', body: new URLSearchParams({ k: llave, accion, datos: d ? JSON.stringify(d) : '' }), signal: c.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: accion !== 'ver' });
      const j = await r.json().catch(() => null);
      if (s !== sesion) throw vieja();
      if (j && j.ok === false && j.error === 'llave') { const e = new Error('llave'); e.llave = true; throw e; }   // solo lo dice nuestro flujo; un 403 ajeno (filtro, red) no borra la llave
      if (!r.ok || !j || j.ok !== true) throw new Error('servidor');
      j.serie = n; return j;
    } catch (e) { throw s !== sesion ? vieja() : e; }
    finally { clearTimeout(t); enVuelo.delete(c); }
  }
  function recibe(j) {
    if (j.serie < minValida) return;           // lectura que salió antes de un guardado: trae la foto vieja
    datos = { confirmaciones: Array.isArray(j.confirmaciones) ? j.confirmaciones : [], invitados: Array.isArray(j.invitados) ? j.invitados : [] };
    ultima = Date.now(); const f = JSON.stringify(datos); caja.pon(K_DATOS, f);
    if (f !== firma || !R) { firma = f; pinta(); } else cabecera();   // sin cambios no se repinta: no se pierde el foco ni el lugar
    sello('ok');
  }
  function sinLlave(msg) {
    corta(); llave = ''; datos = null; R = null; caja.quita(K_LLAVE); caja.quita(K_DATOS); caja.quita(K_VISTO);
    cierraTodo(); $('app').hidden = true; $('puerta').hidden = false;
    const e = $('e-llave'); e.textContent = msg || ''; e.hidden = !msg; $('llave').value = '';
  }
  async function carga() {
    if (cargando || ocupado || !llave) return;     // mientras se guarda algo no se lee: la respuesta del guardado ya trae todo
    cargando = true; sello('cargando');
    try { recibe(await pide('ver')); }
    catch (e) {
      if (e && e.vieja) return;
      if (e && e.llave) sinLlave('Esta llave ya no sirve. Pide un enlace nuevo.');
      else { sello('error'); if (!datos) sinDatos(); }
    } finally { cargando = false; }
  }
  function sello(tipo) {
    const s = $('act'); s.classList.toggle('mal', tipo === 'error');
    s.textContent = tipo === 'cargando' ? 'Actualizando…' : tipo === 'error' ? (datos ? 'Sin conexión. Ves lo último guardado.' : 'Sin conexión.') : 'Actualizado a las ' + fmt({ hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  }

  /* ---------- De las dos tablas a tres montones ---------- */
  // Vale la última respuesta de cada nombre. Cada invitado de la lista se une a su confirmación por: vínculo puesto a mano,
  // nombre igual, o nombre parecido (todas las palabras de uno están en el otro) solo si no hay duda en ninguno de los dos lados.
  function deriva(conf, inv) {
    const ult = new Map();
    conf.slice().sort((a, b) => a.id - b.id).forEach(r => { if (r && r.nombre) ult.set(clave(r.nombre), r); });
    const activos = inv.filter(i => i && i.nombre && i.baja !== true), usados = new Set();
    const filas = activos.map(i => ({ inv: i, conf: null })), libre = x => !x.conf && x.inv.vinculo !== '~';
    const une = (x, k) => { x.conf = ult.get(k); usados.add(k); };
    filas.forEach(x => { const v = x.inv.vinculo; if (v && v !== '~' && ult.has(v) && !usados.has(v)) une(x, v); });
    filas.forEach(x => { const k = clave(x.inv.nombre); if (libre(x) && ult.has(k) && !usados.has(k)) une(x, k); });
    const pal = s => clave(s).split(' ');
    const parecido = (a, b) => { const A = pal(a), B = pal(b), m = A.length <= B.length ? A : B, M = m === A ? B : A; return m[0] !== '' && m.every(w => M.includes(w)); };
    for (let vuelta = 0, cambio = true; cambio && vuelta < 60; vuelta++) {
      cambio = false;
      for (const x of filas) {
        if (!libre(x)) continue;
        const c = [...ult.keys()].filter(k => !usados.has(k) && parecido(x.inv.nombre, k));
        if (c.length !== 1 || filas.filter(y => libre(y) && parecido(y.inv.nombre, c[0])).length !== 1) continue;
        une(x, c[0]); cambio = true;
      }
    }
    const E = { si: [], no: [], pend: [] };
    filas.forEach(x => { const m = x.inv.manual, cl = x.conf ? (x.conf.asiste ? 'si' : 'no') : (m === 'si' || m === 'no' ? m : 'pend'); E[cl].push({ clase: cl, inv: x.inv, conf: x.conf }); });
    const sueltas = [...ult.keys()].filter(k => !usados.has(k)).map(k => ult.get(k));
    sueltas.forEach(c => { const cl = c.asiste ? 'si' : 'no'; E[cl].push({ clase: cl, inv: null, conf: c }); });
    Object.keys(E).forEach(k => E[k].sort((a, b) => nom(a).localeCompare(nom(b), 'es', { sensitivity: 'base' })));
    const hermanitos = E.si.reduce((s, e) => s + (e.conf ? Number(e.conf.hermanos) || 0 : 0), 0);
    const adultos = E.si.filter(e => esAdulto(e.conf)).length, invNinos = E.si.length - adultos;
    return { E, sueltas, hayLista: activos.length > 0, hermanitos, adultos, invNinos, ninos: invNinos + hermanitos, total: E.si.length + E.no.length + E.pend.length,
      maxId: conf.reduce((m, r) => Math.max(m, Number(r && r.id) || 0), 0) };
  }
  function frase(e) {
    if (e.clase === 'pend') return 'Todavía no responde.';
    if (e.clase === 'no') return e.conf ? 'No podrá ir.' : 'No podrá ir. Lo anotaste tú.';
    if (!e.conf) return 'Va. Lo anotaste tú.';
    const h = Number(e.conf.hermanos) || 0, ed = e.conf.edades ? ' (' + e.conf.edades + ')' : '';
    if (esAdulto(e.conf)) return h ? 'Adulto. Va con ' + plural(h, 'niño', 'niños') + ed + '.' : 'Adulto. Va sin niños.';
    return h ? 'Va con ' + plural(h, 'hermanito', 'hermanitos') + ed + '.' : 'Va sin hermanitos.';
  }

  /* ---------- Pintar ---------- */
  function cabecera() {
    const dias = Math.round((diaLima(FIESTA) - diaLima(new Date())) / 86400000);
    $('faltan').textContent = dias > 1 ? 'Faltan ' + dias + ' días.' : dias === 1 ? '¡Es mañana!' : dias === 0 ? '¡Es hoy!' : 'La fiesta ya pasó.';
  }
  function cuenta(nodo, n) {
    const turno = ++turnoCuenta;
    if (!primera || reducir || n < 2) { nodo.textContent = n; return; }
    const t0 = performance.now();
    const paso = t => { if (turno !== turnoCuenta) return; const p = Math.min(1, (t - t0) / 700); nodo.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(paso); };
    requestAnimationFrame(paso);
  }
  function anillo(si, no, total) {
    const o = $('orbita'), a = $('arco-si'), b = $('arco-no'), nave = $('nave');
    const p1 = total ? si / total * 100 : 0, p2 = total ? no / total * 100 : 0;
    o.classList.toggle('sin-total', !total);
    a.setAttribute('stroke-dasharray', p1.toFixed(2) + ' 100');
    b.setAttribute('stroke-dasharray', p2.toFixed(2) + ' 100'); b.setAttribute('stroke-dashoffset', (-p1).toFixed(2));
    const gira = () => { o.classList.remove('espera'); nave.style.transform = 'rotate(' + ((p1 + p2) * 3.6).toFixed(1) + 'deg)'; };
    if (o.classList.contains('espera') && !reducir) requestAnimationFrame(() => requestAnimationFrame(gira)); else gira();
  }
  function pinta() {
    R = deriva(datos.confirmaciones, datos.invitados);
    const E = R.E, van = E.si.length;
    cabecera();
    cuenta($('n-ninos'), R.ninos);
    $('t-ninos').textContent = R.ninos === 1 ? 'niño va' : 'niños van';
    $('desglose').textContent = van ? [R.invNinos ? plural(R.invNinos, 'invitado', 'invitados') : '', R.hermanitos ? plural(R.hermanitos, 'hermanito', 'hermanitos') : '']
      .filter(Boolean).join(' y ') + (R.adultos ? (R.invNinos || R.hermanitos ? ' · ' : '') + plural(R.adultos, 'adulto', 'adultos') : '') : 'Todavía nadie confirma';
    $('avance').textContent = R.hayLista ? 'Respondieron ' + (van + E.no.length) + ' de ' + R.total : 'Agrega tu lista para ver quién falta';
    anillo(van, E.no.length, R.hayLista ? R.total : 0);
    $('c-si').textContent = van; $('c-no').textContent = E.no.length; $('c-pend').textContent = R.hayLista ? E.pend.length : '–';
    if (visto === null) visto = R.maxId;      // primera vez en este teléfono: nada es «nuevo», lo que llegue después sí
    lista();
    caja.pon(K_VISTO, String(R.maxId));
    primera = false;
  }
  function fila(e) {
    const li = el('li'), b = el('button', 'fila ' + e.clase + (esAdulto(e.conf) ? ' adulto' : '')), d = el('span', 'dato'), lado = el('span', 'lado');   // adulto: cuadrito lila (José, 18-nov)
    b.type = 'button';
    d.appendChild(el('span', 'nombre', nom(e)));
    if (esAdulto(e.conf)) d.appendChild(el('span', 'tipo-adulto', 'Adulto'));
    if (e.clase !== 'pend') d.appendChild(el('span', 'frase', frase(e)));      // en «Sin responder» la frase sobra: lo dice el montón
    if (e.conf && e.conf.adulto) d.appendChild(el('span', 'extra', 'Acompaña: ' + e.conf.adulto));
    if (e.conf && e.conf.panel) d.appendChild(el('span', 'extra', 'Lo anotaste tú'));
    if (e.inv && e.conf && clave(e.inv.nombre) !== clave(e.conf.nombre)) d.appendChild(el('span', 'extra', 'Confirmó como «' + e.conf.nombre + '»'));
    if (!e.inv && R.hayLista) d.appendChild(el('span', 'fuera', 'No está en tu lista'));
    if (e.clase === 'pend' && e.inv.nota === 'inv') d.appendChild(el('span', 'extra', 'Invitación enviada'));
    b.dataset.k = e.inv ? 'i' + e.inv.id : 'c' + clave(e.conf.nombre);
    if (e.conf) {
      if (visto !== null && Number(e.conf.id) > visto) lado.appendChild(el('span', 'nueva', 'Nueva'));
      lado.appendChild(el('span', null, cuando(e.conf.cuando)));
    }
    b.append(el('span', 'punto'), d, lado);
    b.addEventListener('click', () => ficha(e));
    li.appendChild(b);
    if (e.clase === 'pend') {                 // atajo de un toque: primero «Invitar»; cuando ya se le envió, «Recordar»
      const ya = e.inv.nota === 'inv', r = el('button', 'mini', ya ? 'Recordar' : 'Invitar'); r.type = 'button'; r.dataset.k = 'm' + e.inv.id;
      r.setAttribute('aria-label', (ya ? 'Recordarle a ' : 'Enviarle la invitación a ') + nom(e) + ' por WhatsApp');
      r.addEventListener('click', () => (ya ? recuerda : invita)(e.inv)); li.appendChild(r);
    }
    return li;
  }
  function lista() {
    const ul = $('lista'), v = $('vacio'), todas = R.E[ver];
    document.querySelectorAll('.filtro').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ver === ver)));
    $('t-lista').textContent = ver === 'si' ? 'Van' : ver === 'no' ? 'No van' : 'Sin responder';
    if (todas.length <= 8 && busca) { busca = ''; $('busca').value = ''; }
    $('busca-caja').hidden = todas.length <= 8;
    $('b-agregar').hidden = ver === 'pend' && !R.hayLista;   // ahí el botón ya va dentro del aviso
    const q = clave(busca), ent = q ? todas.filter(e => clave(nom(e) + ' ' + (e.conf ? e.conf.nombre + ' ' + (e.conf.adulto || '') : '')).includes(q)) : todas;
    const foco = document.activeElement, kf = foco && ul.contains(foco) ? foco.dataset.k : '';
    ul.textContent = ''; ent.forEach(e => ul.appendChild(fila(e)));
    ul.hidden = !ent.length; v.hidden = !!ent.length; v.textContent = '';
    if (kf) { const n = [...ul.querySelectorAll('[data-k]')].find(x => x.dataset.k === kf); try { (n || $('t-lista')).focus({ preventScroll: true }); } catch (e) {} }   // el foco sigue en la misma persona
    if (ent.length) return;
    if (todas.length) v.appendChild(el('b', null, 'Nadie con ese nombre en esta lista.'));
    else if (ver === 'si') v.append(el('b', null, 'Todavía nadie confirma.'), el('span', null, 'Aquí aparecerán apenas alguien responda la invitación.'));
    else if (ver === 'no') v.appendChild(el('b', null, 'Nadie ha dicho que no.'));
    else if (R.hayLista) v.appendChild(el('b', null, '¡Ya respondieron todos!'));
    else {
      v.append(el('b', null, '¿Quién falta responder?'), el('span', null, 'Agrega los nombres de tus invitados y aquí verás quién todavía no contesta.'));
      const b = el('button', 'btn btn-lima', 'Agregar invitados'); b.type = 'button'; b.addEventListener('click', abreAgregar); v.appendChild(b);
    }
  }
  function esqueleto() { const ul = $('lista'); ul.textContent = ''; for (let i = 0; i < 3; i++) ul.appendChild(el('li', 'hueso')); ul.hidden = false; $('vacio').hidden = true; cabecera(); }
  function sinDatos() {
    const ul = $('lista'), v = $('vacio'); ul.textContent = ''; ul.hidden = true; v.hidden = false; v.textContent = '';
    v.append(el('b', null, 'No pude traer la lista.'), el('span', null, 'Revisa tu conexión y vuelve a intentar.'));
    const b = el('button', 'btn btn-lima', 'Reintentar'); b.type = 'button'; b.addEventListener('click', () => { esqueleto(); carga(); }); v.appendChild(b);
  }

  /* ---------- Ficha de una persona ---------- */
  function hoja(titulo, estado, extra) {
    $('t-ficha').textContent = titulo; $('ficha-estado').textContent = estado;
    const x = $('ficha-extra'); x.textContent = extra || ''; x.hidden = !extra;
    $('f-nombre').hidden = true; $('e-ficha').hidden = true;
    const op = $('ficha-op'); op.hidden = false; op.textContent = '';
    return (txt, sub, fn, cls) => { const b = el('button', 'op' + (cls ? ' ' + cls : '')); b.type = 'button'; b.appendChild(el('span', null, txt)); if (sub) b.appendChild(el('small', null, sub)); b.addEventListener('click', fn); op.appendChild(b); };
  }
  function ficha(e) {
    const i = e.inv, c = e.conf;
    const extra = c ? (i && clave(i.nombre) !== clave(c.nombre) ? 'Confirmó como «' + c.nombre + '», ' : 'Respondió ') + cuando(c.cuando) + '.' : '';
    const pon = hoja(nom(e), frase(e) + (c && c.adulto ? ' Acompaña: ' + c.adulto + '.' : ''), extra);
    if (i && !c) {
      if (e.clase === 'pend') {
        const ya = i.nota === 'inv', sub = 'Se abre WhatsApp con el mensaje listo. Tú eliges a quién va.';
        const inv = () => pon(ya ? 'Enviarle la invitación otra vez' : 'Enviarle su invitación por WhatsApp', ya ? null : sub, () => { invita(i); cierraTodo(); }, ya ? '' : 'fuerte');
        const rec = () => pon('Recordarle por WhatsApp', ya ? sub : null, () => { recuerda(i); cierraTodo(); }, ya ? 'fuerte' : '');
        if (ya) { rec(); inv(); } else { inv(); rec(); }
        pon('Copiar su invitación', 'El enlace de la invitación.', () => copia(enlaceDe(i.nombre), 'Enlace copiado'));
        pon('Anotar su confirmación', 'Si te avisó por teléfono: va o no va, niño o adulto y cuántos niños.', () => abreConf(null, i.nombre));
        pon('Ya me dijo que va', null, () => edita(i, { manual: 'si' }));
        pon('Ya me dijo que no va', null, () => edita(i, { manual: 'no' }));
      } else pon('Borrar mi anotación', 'Vuelve a «Sin responder».', () => edita(i, { manual: '' }));
      if (R.sueltas.length) pon('Confirmó con otro nombre', 'Elige cuál de las confirmaciones es la suya.', () => eligeConf(i));
      if (i.vinculo === '~') pon('Buscar su confirmación otra vez', 'Se vuelve a unir sola si alguien confirma con su nombre.', () => edita(i, { vinculo: '' }));
    }
    if (c) {                                  // Marina corrige la confirmación ella misma (versión 3); niño o adulto en un toque
      pon('Corregir la confirmación', 'Va o no va, niño o adulto, cuántos niños y quién acompaña.', () => abreConf(c));
      if (esAdulto(c)) pon('Es un niño o niña', 'Vuelve a contar entre los niños.', () => escribe('tipo', { id: c.id, tipo: 'nino' }, 'Guardado: niño o niña', 'e-ficha'));
      else pon('Es un adulto', 'No cuenta entre los niños. Los niños que lleve, sí.', () => escribe('tipo', { id: c.id, tipo: 'adulto' }, 'Guardado: adulto', 'e-ficha'), 'fuerte');
    }
    if (i && c) pon('Esa confirmación no es suya', 'Se separa y vuelve a «Sin responder».', () => edita(i, { vinculo: '~' }));
    if (c) pon('Quitar esta confirmación', 'Por si está repetida o fue un error. No se borra: queda guardada aparte.', () => escribe('conf_quitar', { id: c.id }, 'Confirmación quitada', 'e-ficha'), 'quita');
    if (!i && c) {
      if (R.E.pend.length) pon('Es alguien de mi lista', 'Elige a quién corresponde.', () => eligeInv(c), 'fuerte');
      pon('Agregar a mi lista', 'Queda como invitado con este nombre.', () => escribe('agregar', { nombres: [c.nombre] }, 'Agregado a tu lista', 'e-ficha'));
    }
    if (i) {
      pon('Corregir el nombre', null, () => { $('ficha-op').hidden = true; $('f-nombre').hidden = false; const n = $('nombre-nuevo'); n.value = i.nombre; n.focus(); $('f-nombre').onsubmit = ev => { ev.preventDefault(); const v = limpia(n.value, 40); if (v.length < 2) { n.focus(); return; } edita(i, { nombre: v }); }; });
      pon('Quitar de mi lista', 'No borra su confirmación.', () => edita(i, { baja: true }), 'quita');
    }
    abre($('d-ficha')); $('t-ficha').focus();
  }
  function eligeConf(i) {
    const pon = hoja(i.nombre, '¿Cuál es su confirmación?');
    R.sueltas.forEach(c => pon(c.nombre, frase({ clase: c.asiste ? 'si' : 'no', conf: c }) + ' ' + cuando(c.cuando), () => edita(i, { vinculo: clave(c.nombre), manual: '' })));
    $('t-ficha').focus();
  }
  function eligeInv(c) {
    const pon = hoja(c.nombre, '¿Quién de tu lista es?');
    R.E.pend.forEach(e => pon(e.inv.nombre, null, () => edita(e.inv, { vinculo: clave(c.nombre), manual: '' })));
    $('t-ficha').focus();
  }
  // WhatsApp se abre con el texto listo y Marina elige el contacto: la página no envía nada por su cuenta ni guarda teléfonos.
  const whatsapp = t => window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank', 'noopener');
  const recuerda = i => whatsapp('Hola. Te escribo por el cumple de Gaetano: ' + FECHA_TXT + ' ¿Me confirmas si viene ' + i.nombre + '? Es un toque en su invitación: ' + enlaceDe(i.nombre));
  function invita(i) {
    whatsapp('\u{1F680} ¡Hola! Gaetano cumple 6 y quiere que ' + i.nombre + ' lo acompañe en su misión espacial. Es el ' + FECHA_TXT + ' Aquí está su invitación, con todos los datos y para confirmar: ' + enlaceDe(i.nombre));
    if (i.nota !== 'inv') anotaEnvio(i);
  }
  const filaDe = (i, cambios) => Object.assign({ id: i.id, nombre: i.nombre, nota: i.nota || '', manual: i.manual || '', vinculo: i.vinculo || '', baja: i.baja === true }, cambios);
  async function anotaEnvio(i) {               // deja la marca «Invitación enviada» sin interrumpir (WhatsApp ya se abrió)
    if (ocupado) return;
    ocupado = true; minValida = serie + 1;
    try { recibe(await pide('editar', filaDe(i, { nota: 'inv' }))); }
    catch (e) { if (e && e.llave) sinLlave('Esta llave ya no sirve. Pide un enlace nuevo.'); }
    finally { ocupado = false; }
  }
  const edita = (i, cambios) => escribe('editar', filaDe(i, cambios), 'Guardado', 'e-ficha');
  async function escribe(accion, d, okTxt, idError) {
    if (ocupado) return false;
    ocupado = true; minValida = serie + 1;       // las lecturas que ya salieron quedan sin efecto, y mientras se guarda no sale ninguna
    const bots = [...document.querySelectorAll('dialog button')]; bots.forEach(b => { b.disabled = true; });
    const err = $(idError); err.hidden = true;
    try {
      const j = await pide(accion, d); recibe(j);
      if (j.aviso === 'repetido') { err.textContent = 'Ya hay otro invitado con ese nombre.'; err.hidden = false; return false; }
      if (j.aviso === 'tope') { err.textContent = 'La lista llegó a su tope de 400. No entraron: ' + (Array.isArray(j.omitidos) ? j.omitidos : []).join(', ') + '.'; err.hidden = false; return false; }
      cierraTodo(); avisa(okTxt); try { $('t-lista').focus({ preventScroll: true }); } catch (e) {}
      return true;
    } catch (e) {
      if (e && e.vieja) return false;
      if (e && e.llave) sinLlave('Esta llave ya no sirve. Pide un enlace nuevo.');
      else { err.textContent = 'No se pudo guardar. Revisa tu conexión y toca de nuevo.'; err.hidden = false; }
      return false;
    } finally { ocupado = false; bots.forEach(b => { b.disabled = false; }); }
  }

  /* ---------- Anotar o corregir una confirmación (Marina, sin molestar a la familia) ---------- */
  let confAbierta = null;
  function abreConf(c, nombre) {
    cierraTodo(); confAbierta = c;
    $('t-conf').textContent = c ? 'Corregir la confirmación' : 'Anotar una confirmación';
    $('conf-txt').textContent = c ? 'Lo que cambies aquí reemplaza lo que respondió. No se le envía nada.' : 'Para quien te avisó por teléfono o en persona. No se le envía nada.';
    $('c-nombre').value = c ? c.nombre : (nombre || '');
    document.querySelector('input[name="c-asiste"][value="' + (c && c.asiste === false ? 'no' : 'si') + '"]').checked = true;
    document.querySelector('input[name="c-tipo"][value="' + (esAdulto(c) ? 'adulto' : 'nino') + '"]').checked = true;
    $('c-hermanos').value = String(c ? Number(c.hermanos) || 0 : 0);
    $('c-edades').value = c ? c.edades || '' : ''; $('c-adulto').value = c ? c.adulto || '' : '';
    $('e-conf').hidden = true; abre($('d-conf')); (c ? $('t-conf') : $('c-nombre')).focus();
  }
  $('b-anotar').addEventListener('click', () => abreConf(null));
  $('f-conf').addEventListener('submit', async ev => {
    ev.preventDefault();
    const err = $('e-conf'), nombre = limpia($('c-nombre').value, 40), h = Number($('c-hermanos').value || 0);
    const falla = (t, campo) => { err.textContent = t; err.hidden = false; $(campo).focus(); };
    if (nombre.length < 2 || nombre.toLowerCase() === nombre.toUpperCase()) return falla('Escribe el nombre.', 'c-nombre');
    if (!Number.isInteger(h) || h < 0 || h > 9) return falla('Los niños que van con él o ella: un número del 0 al 9.', 'c-hermanos');
    const d = { nombre, asiste: document.querySelector('input[name="c-asiste"]:checked').value === 'si', tipo: document.querySelector('input[name="c-tipo"]:checked').value,
      hermanos: h, edades: limpia($('c-edades').value, 40), adulto: limpia($('c-adulto').value, 60) };
    if (confAbierta) d.id = confAbierta.id;
    if (await escribe(confAbierta ? 'conf_editar' : 'conf_agregar', d, confAbierta ? 'Confirmación corregida' : 'Confirmación anotada', 'e-conf')) {
      if (!confAbierta) { ver = d.asiste ? 'si' : 'no'; lista(); }
      confAbierta = null;
    }
  });

  /* ---------- Agregar invitados ---------- */
  function abreAgregar() { $('e-agregar').hidden = true; abre($('d-agregar')); $('nombres').focus(); }
  function nombresDe(txt) {
    const v = new Set(), out = [];
    String(txt).split(/[\n,;]+/).forEach(x => { const n = limpia(x, 40), c = clave(n); if (n.length >= 2 && !v.has(c)) { v.add(c); out.push(n); } });
    return out;
  }
  $('f-agregar').addEventListener('submit', async ev => {
    ev.preventDefault();
    const n = nombresDe($('nombres').value), err = $('e-agregar');
    if (!n.length) { err.textContent = 'Escribe al menos un nombre.'; err.hidden = false; $('nombres').focus(); return; }
    if (n.length > 80) { err.textContent = 'Son muchos de una vez. Pega hasta 80 nombres y repite con el resto.'; err.hidden = false; return; }
    const antes = datos ? datos.invitados.filter(i => i.baja !== true).length : 0;
    if (await escribe('agregar', { nombres: n }, 'Guardado', 'e-agregar')) {
      const mas = datos.invitados.filter(i => i.baja !== true).length - antes;
      avisa(mas > 0 ? (mas === 1 ? 'Agregado 1 invitado' : 'Agregados ' + mas + ' invitados') : 'Ya estaban en tu lista');
      $('nombres').value = ''; if (ver !== 'pend' && mas > 0) { ver = 'pend'; lista(); }
    }
  });

  /* ---------- Resumen para copiar ---------- */
  function resumen() {
    const E = R.E, L = ['Cumple de Gaetano: ' + FECHA_TXT];
    L.push('Van ' + plural(R.ninos, 'niño', 'niños') + (R.hermanitos ? ' (' + plural(R.invNinos, 'invitado', 'invitados') + ' y ' + plural(R.hermanitos, 'hermanito', 'hermanitos') + ')' : '') + '.');
    if (R.adultos) L.push('Adultos que confirmaron: ' + R.adultos + '.');
    if (E.no.length) L.push('No podrán ir: ' + E.no.length + '.');
    if (R.hayLista) L.push('Sin responder: ' + E.pend.length + '.');
    if (E.si.length) { L.push('', 'VAN'); E.si.forEach(e => { const c = e.conf, h = c ? Number(c.hermanos) || 0 : 0; L.push('- ' + nom(e) + (esAdulto(c) ? ' (adulto)' : '') + (h ? ' +' + plural(h, 'hermanito', 'hermanitos') + (c.edades ? ' (' + c.edades + ')' : '') : '') + (c && c.adulto ? ', acompaña ' + c.adulto : '')); }); }
    if (E.no.length) { L.push('', 'NO PODRÁN IR'); E.no.forEach(e => L.push('- ' + nom(e))); }
    if (R.hayLista && E.pend.length) { L.push('', 'SIN RESPONDER'); E.pend.forEach(e => L.push('- ' + nom(e))); }
    return L.join('\n');
  }

  /* ---------- Arranque y llave ---------- */
  function entra() {
    $('puerta').hidden = true; $('app').hidden = false;
    const v = caja.lee(K_VISTO); visto = v == null ? null : Number(v) || 0;
    const c = caja.lee(K_DATOS); datos = null;
    if (c) { try { const j = JSON.parse(c); if (j && Array.isArray(j.confirmaciones) && Array.isArray(j.invitados)) datos = j; } catch (e) {} }
    if (datos) { firma = JSON.stringify(datos); pinta(); } else esqueleto();
    carga();
  }
  function tomaLlave() {                       // la llave del enlace se guarda y se borra de la barra en el acto
    let h = ''; try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) {}
    const k = sacaLlave(h);
    if (!k) return false;
    if (k !== (llave || caja.lee(K_LLAVE))) { corta(); caja.quita(K_DATOS); caja.quita(K_VISTO); }
    llave = k; caja.pon(K_LLAVE, k);
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    return true;
  }
  function arranca() {
    tomaLlave(); if (!llave) llave = sacaLlave(caja.lee(K_LLAVE));
    if (llave) entra(); else { $('app').hidden = true; $('puerta').hidden = false; }
  }
  $('f-llave').addEventListener('submit', async ev => {
    ev.preventDefault();
    const k = sacaLlave($('llave').value), err = $('e-llave'), b = $('ok-llave');
    if (!k) { err.textContent = 'Ese texto no trae una llave. Pega el enlace completo.'; err.hidden = false; $('llave').focus(); return; }
    llave = k; b.disabled = true; err.hidden = true;
    try { const j = await pide('ver'); caja.pon(K_LLAVE, k); caja.quita(K_VISTO); visto = null; $('puerta').hidden = true; $('app').hidden = false; recibe(j); }
    catch (e) { llave = ''; if (e && e.vieja) return; err.textContent = e && e.llave ? 'Esa llave no sirve. Revisa que el enlace esté completo.' : 'No hay conexión. Intenta de nuevo.'; err.hidden = false; }
    finally { b.disabled = false; }
  });

  /* ---------- Botones y refresco ---------- */
  document.querySelectorAll('.filtro').forEach(b => b.addEventListener('click', () => { ver = b.dataset.ver; busca = ''; $('busca').value = ''; if (R) lista(); }));
  $('busca').addEventListener('input', ev => { busca = ev.target.value; if (R) lista(); });
  $('b-agregar').addEventListener('click', abreAgregar);
  $('b-copiar').addEventListener('click', () => { if (R) copia(resumen(), 'Resumen copiado'); });
  $('b-act').addEventListener('click', carga);
  $('b-salir').addEventListener('click', ev => {
    const b = ev.currentTarget;
    if (b.dataset.seguro) { delete b.dataset.seguro; b.textContent = 'Salir en este teléfono'; sinLlave('Saliste. Para volver, abre tu enlace de acceso.'); return; }
    b.dataset.seguro = '1'; b.textContent = '¿Seguro? Toca otra vez';
    setTimeout(() => { delete b.dataset.seguro; b.textContent = 'Salir en este teléfono'; }, 4000);
  });
  $('no-nombre').addEventListener('click', () => { $('f-nombre').hidden = true; $('ficha-op').hidden = false; });
  document.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', ev => { if (ev.target === d && !ocupado) d.close(); }));
  document.querySelectorAll('dialog').forEach(d => d.addEventListener('cancel', ev => { if (ocupado) ev.preventDefault(); }));
  addEventListener('hashchange', () => { if (tomaLlave()) entra(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && llave && Date.now() - ultima > 20000) carga(); });
  setInterval(() => { if (document.visibilityState === 'visible' && llave && !hayHoja() && Date.now() - ultima > 60000) carga(); }, 15000);
  // Primero la llave; la pantalla aparece cuando las dos letras ya cargaron (tope 1,5 s), así el texto no salta al cambiar de letra.
  tomaLlave();
  const letras = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('400 1em Bungee'), document.fonts.load('800 1em Nunito')]).catch(() => {}) : Promise.resolve();
  Promise.race([letras, new Promise(r => setTimeout(r, 1500))]).then(arranca);
})();
