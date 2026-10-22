(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.add('js');

  /* ---------- language: LV in the markup, RU from the embedded dictionary; ?lang=ru opens Russian ---------- */
  var RU = {};
  try { RU = JSON.parse(doc.getElementById('i18n').textContent); } catch (e) { RU = {}; }
  var texts = [].slice.call(doc.querySelectorAll('[data-i]')).map(function (el) { return [el, el.getAttribute('data-i'), el.innerHTML]; });
  var attrs = [];
  [].slice.call(doc.querySelectorAll('[data-ia]')).forEach(function (el) {
    el.getAttribute('data-ia').split(';').forEach(function (pair) {
      var p = pair.split('='); if (p.length === 2) attrs.push([el, p[0], p[1], el.getAttribute(p[0])]);
    });
  });
  var metaDesc = doc.querySelector('meta[name="description"]');
  var LV = { title: doc.title, desc: metaDesc ? metaDesc.getAttribute('content') : '' };
  var lang = 'lv';

  function setLang(l) {
    lang = l === 'ru' && RU.title ? 'ru' : 'lv';
    var ru = lang === 'ru';
    texts.forEach(function (x) { var v = ru ? RU[x[1]] : x[2]; if (v != null) x[0].innerHTML = v; });
    attrs.forEach(function (x) { var v = ru ? RU[x[2]] : x[3]; if (v != null) x[0].setAttribute(x[1], v); });
    root.lang = lang;
    doc.title = ru ? RU.title : LV.title;
    if (metaDesc) metaDesc.setAttribute('content', ru ? RU.desc : LV.desc);
    [].slice.call(doc.querySelectorAll('.lang a')).forEach(function (a) {
      if (a.getAttribute('data-lang') === lang) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    setMenu(false);
  }

  /* ---------- mobile menu ---------- */
  var hdr = doc.getElementById('hdr'), burger = hdr.querySelector('.burger');
  function setMenu(open) {
    hdr.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? (lang === 'ru' ? 'Закрыть меню' : 'Aizvērt izvēlni') : (lang === 'ru' ? RU.menu : 'Izvēlne'));
  }
  burger.addEventListener('click', function () { setMenu(!hdr.classList.contains('open')); });
  doc.getElementById('mnav').addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && hdr.classList.contains('open')) { setMenu(false); burger.focus(); } });
  doc.addEventListener('click', function (e) { if (hdr.classList.contains('open') && !hdr.contains(e.target)) setMenu(false); });

  var q = '';
  try { q = new URLSearchParams(location.search).get('lang') || ''; } catch (e) { q = ''; }
  if (q === 'ru') setLang('ru');
  root.classList.remove('ru-wait');

  [].slice.call(doc.querySelectorAll('.lang a')).forEach(function (a) {
    a.addEventListener('click', function (e) {
      var l = a.getAttribute('data-lang');
      e.preventDefault();
      if (l === lang) return;
      setLang(l);
      try { history.replaceState(null, '', (l === 'ru' ? '?lang=ru' : location.pathname) + location.hash); } catch (err) { /* file:// */ }
    });
  });

  /* ---------- reveal on scroll ---------- */
  var items = [].slice.call(doc.querySelectorAll('.rv'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  } else { items.forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- form -> mail program (window.__noNav lets a test read the address without opening a mail program) ---------- */
  var form = doc.getElementById('cform');
  if (form) {
    var err = form.querySelector('.f-err');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var M = lang === 'ru'
        ? { name: 'Напишите своё имя.', contact: 'Укажите телефон или e-mail.', msg: 'Коротко опишите объект и работы.', subj: 'Запрос с сайта KLINTS BŪVE', n: 'Имя: ', c: 'Телефон или e-mail: ' }
        : { name: 'Lūdzu, ierakstiet savu vārdu.', contact: 'Lūdzu, norādiet tālruni vai e-pastu.', msg: 'Lūdzu, īsi aprakstiet objektu un darbus.', subj: 'Jautājums no mājaslapas KLINTS BŪVE', n: 'Vārds: ', c: 'Tālrunis vai e-pasts: ' };
      var f = form.elements, name = f.name.value.trim(), contact = f.contact.value.trim(), msg = f.msg.value.trim();
      [f.name, f.contact, f.msg].forEach(function (x) { x.removeAttribute('aria-invalid'); });
      var okContact = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact) || contact.replace(/\D/g, '').length >= 7;
      var bad = name.length < 2 ? [f.name, M.name] : (!okContact ? [f.contact, M.contact] : (msg.length < 5 ? [f.msg, M.msg] : null));
      if (bad) { bad[0].setAttribute('aria-invalid', 'true'); err.textContent = bad[1]; err.hidden = false; bad[0].focus(); return; }
      err.hidden = true;
      var body = M.n + name + '\n' + M.c + contact + '\n\n' + msg;
      var url = 'mailto:' + form.getAttribute('data-mail') + '?subject=' + encodeURIComponent(M.subj) + '&body=' + encodeURIComponent(body);
      window.__mailto = url;
      if (!window.__noNav) window.location.href = url;
    });
  }
})();
