/* ===================================================================
   IBERO CHAMBER — JavaScript propio del sitio
   Se carga después de main.js (plantilla Stadum), que ya gestiona:
   menús, sliders (Swiper), animaciones (WOW, GSAP, SplitText),
   contadores, ventanas emergentes, filtro Isotope y scroll suave.

   Este archivo solo añade lo específico de Ibero Chamber:
     1. Navegación local (abrir el sitio con doble clic, file://)
     2. Año actual en el pie
     3. Botones de compartir de las noticias
     4. Filtro de noticias por categoría (?categoria=...)
     5. Buscador del sitio (página /buscar/)
   (Fuente: _generador/recursos/js/ibero.js — build.js la copia al sitio)
   =================================================================== */
(function () {
    'use strict';

    /** Prefijo relativo hasta la raíz del sitio, deducido de este script. */
    var RAIZ = (function () {
        var s = document.querySelector('script[src$="assets/js/ibero.js"]');
        return s ? s.getAttribute('src').replace(/assets\/js\/ibero\.js$/, '') : '';
    })();

    /* -------------------------------------------------------------
       1. Navegación local
       Las páginas enlazan carpetas ("servicios/"), como en el servidor.
       Abiertas desde el disco (file://) el navegador no resuelve el
       index.html de una carpeta: se completa el enlace.
       ------------------------------------------------------------- */
    function navegacionLocal() {
        if (location.protocol !== 'file:') return;
        var completar = function (valor) {
            if (!valor || /^(https?:|mailto:|tel:|#|javascript:|data:)/i.test(valor)) return null;
            var corte = valor.search(/[?#]/);
            var ruta = corte < 0 ? valor : valor.slice(0, corte);
            var resto = corte < 0 ? '' : valor.slice(corte);
            if (ruta === '' || ruta === './' || /\/$/.test(ruta)) return (ruta || './') + 'index.html' + resto;
            return null;
        };
        document.querySelectorAll('a[href]').forEach(function (a) {
            var nuevo = completar(a.getAttribute('href'));
            if (nuevo) a.setAttribute('href', nuevo);
        });
        document.querySelectorAll('form[action]').forEach(function (f) {
            var nuevo = completar(f.getAttribute('action'));
            if (nuevo) f.setAttribute('action', nuevo);
        });
    }

    /* -------------------------------------------------------------
       2. Año actual en el pie
       ------------------------------------------------------------- */
    function anioPie() {
        document.querySelectorAll('.ic-anio').forEach(function (el) {
            el.textContent = new Date().getFullYear();
        });
    }

    /* -------------------------------------------------------------
       3. Compartir noticias
       ------------------------------------------------------------- */
    function compartir() {
        var redes = {
            facebook: 'https://www.facebook.com/sharer/sharer.php?u={url}',
            x: 'https://twitter.com/intent/tweet?url={url}&text={titulo}',
            linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url={url}',
            whatsapp: 'https://wa.me/?text={titulo}%20{url}'
        };
        document.querySelectorAll('.ic-compartir').forEach(function (caja) {
            var titulo = encodeURIComponent(caja.getAttribute('data-titulo') || document.title);
            var url = encodeURIComponent(location.href.replace(/index\.html$/, ''));
            caja.querySelectorAll('a[data-red]').forEach(function (a) {
                var plantilla = redes[a.getAttribute('data-red')];
                if (!plantilla) return;
                a.href = plantilla.replace('{url}', url).replace('{titulo}', titulo);
                a.target = '_blank';
                a.rel = 'noopener';
            });
        });
    }

    /* -------------------------------------------------------------
       4. Filtro de noticias por categoría
       El filtro lo hace Isotope (main.js). Aquí solo se activa la
       categoría que llega en la URL: noticias/?categoria=temas-fiscales
       ------------------------------------------------------------- */
    function filtroDesdeUrl() {
        var cat = new URLSearchParams(location.search).get('categoria');
        if (!cat) return;
        var boton = document.querySelector('.ic-filtros button[data-categoria="' + cat.replace(/[^\w-]/g, '') + '"]');
        if (!boton) return;
        // Isotope se inicia cuando cargan las imágenes de la rejilla
        window.addEventListener('load', function () {
            setTimeout(function () { boton.click(); }, 150);
        });
    }

    /* -------------------------------------------------------------
       5. Buscador (página /buscar/)
       El índice (assets/js/buscador-indice.js) lo genera build.js
       con el título, la sección, el resumen y el texto de cada página.
       ------------------------------------------------------------- */
    function normalizar(t) {
        return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    }
    function escapar(t) {
        return String(t).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }
    function resaltar(texto, terminos) {
        var html = escapar(texto);
        terminos.forEach(function (t) {
            if (t.length < 2) return;
            // busca sin tildes pero resalta el texto original
            var plano = normalizar(html), salida = '', i = 0, pos;
            while ((pos = plano.indexOf(t, i)) !== -1) {
                salida += html.slice(i, pos) + '<mark>' + html.slice(pos, pos + t.length) + '</mark>';
                i = pos + t.length;
            }
            html = salida + html.slice(i);
        });
        return html;
    }

    function buscador() {
        var caja = document.getElementById('ic-resultados');
        if (!caja || !window.IBERO_INDICE) return;
        var entrada = document.getElementById('ic-q');
        var estado = document.getElementById('ic-estado');
        var indice = window.IBERO_INDICE.map(function (p) {
            return { p: p, t: normalizar(p.t), s: normalizar(p.s), x: normalizar(p.x), k: normalizar(p.k) };
        });

        function buscar(consulta) {
            var terminos = normalizar(consulta).split(/\s+/).filter(function (t) { return t.length > 1; });
            if (!terminos.length) {
                estado.textContent = 'Escribe al menos dos letras para buscar en ' + indice.length + ' páginas y noticias.';
                caja.innerHTML = '';
                return;
            }
            var resultados = indice.map(function (r) {
                var puntos = 0;
                for (var i = 0; i < terminos.length; i++) {
                    var t = terminos[i], parcial = 0;
                    if (r.t.indexOf(t) !== -1) parcial += 10;
                    if (r.s.indexOf(t) !== -1) parcial += 3;
                    if (r.x.indexOf(t) !== -1) parcial += 3;
                    if (r.k.indexOf(t) !== -1) parcial += 1;
                    if (!parcial) return null; // todos los términos deben aparecer
                    puntos += parcial;
                }
                return { r: r.p, puntos: puntos };
            }).filter(Boolean).sort(function (a, b) { return b.puntos - a.puntos; });

            estado.textContent = resultados.length
                ? resultados.length + (resultados.length === 1 ? ' resultado' : ' resultados') + ' para «' + consulta + '»'
                : 'No encontramos resultados para «' + consulta + '». Prueba con otras palabras o escríbenos.';
            caja.innerHTML = resultados.slice(0, 40).map(function (x) {
                var href = RAIZ + x.r.u + (location.protocol === 'file:' ? 'index.html' : '');
                return '<a class="ic-resultado" href="' + href + '">' +
                    '<span class="ic-resultado-seccion">' + escapar(x.r.s) + (x.r.f ? ' · ' + x.r.f.split('-').reverse().join('/') : '') + '</span>' +
                    '<h3>' + resaltar(x.r.t, terminos) + '</h3>' +
                    '<p>' + resaltar(x.r.x, terminos) + '</p></a>';
            }).join('');
        }

        var inicial = new URLSearchParams(location.search).get('q') || '';
        entrada.value = inicial;
        buscar(inicial);

        var espera;
        entrada.addEventListener('input', function () {
            clearTimeout(espera);
            espera = setTimeout(function () {
                buscar(entrada.value);
                var url = new URL(location.href);
                url.searchParams.set('q', entrada.value);
                history.replaceState(null, '', url);
            }, 180);
        });
        entrada.form.addEventListener('submit', function (ev) {
            ev.preventDefault();
            buscar(entrada.value);
        });
    }

    /* ------------------------------------------------------------- */
    document.documentElement.classList.remove('no-js');
    navegacionLocal();
    anioPie();
    compartir();
    filtroDesdeUrl();
    buscador();
})();
