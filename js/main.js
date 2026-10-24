(function () {
  // mobile menu
  var top = document.getElementById('top');
  var burger = top && top.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = top.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });
    top.querySelectorAll('.mnav a').forEach(function (a) {
      a.addEventListener('click', function () { top.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); });
    });
  }

  // services dropdown: first tap opens it on touch screens
  document.querySelectorAll('.dd').forEach(function (dd) {
    var link = dd.querySelector('a');
    link.addEventListener('click', function (e) {
      if (window.matchMedia('(hover: none)').matches && !dd.classList.contains('open')) { e.preventDefault(); dd.classList.add('open'); }
    });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) dd.classList.remove('open'); });
  });

  // cost calculator
  var calcForm = document.getElementById('calc');
  if (calcForm) {
    var range = document.getElementById('area');
    var PRICE = JSON.parse(calcForm.getAttribute('data-price'));
    var DAYS = { kosm: 0.45, chern: 0.6, klyuch: 1.1 };
    var MAT = { kosm: 0.25, chern: 0.45, klyuch: 0.35 };
    var WC = { kosm: 42000, chern: 52500, klyuch: 94500 };
    var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
    var calc = function () {
      var area = +range.value;
      var vid = calcForm.querySelector('input[name=vid]:checked').value;
      var wc = +calcForm.querySelector('input[name=wc]:checked').value;
      var old = calcForm.querySelector('input[name=dom]:checked').value === 'old';
      var k = old ? 1.12 : 1;
      var sum = Math.round((area * PRICE[vid] * k + (wc - 1) * WC[vid]) / 1000) * 1000;
      var days = Math.max(14, Math.round((area * DAYS[vid] * (old ? 1.1 : 1) + 10 + (wc - 1) * 7) / 5) * 5);
      var mat = Math.round(sum * MAT[vid] / 10000) * 10000;
      document.getElementById('sum').textContent = fmt(sum);
      document.getElementById('days').textContent = 'около ' + days + ' дней';
      document.getElementById('mat').textContent = 'от ' + fmt(mat) + ' руб.';
      document.getElementById('areaOut').textContent = area + ' м2';
      document.getElementById('planArea').textContent = area + ' м2';
      range.style.setProperty('--p', ((area - range.min) / (range.max - range.min) * 100) + '%');
      var s = 0.72 + 0.28 * Math.sqrt((area - 20) / 180);
      document.getElementById('planG').style.transform = 'scale(' + s.toFixed(3) + ')';
    };
    calcForm.addEventListener('input', calc);
    calcForm.addEventListener('change', calc);
    calc();
  }

  // portfolio filters
  var filters = document.querySelector('.filters');
  if (filters) {
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      filters.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var cat = b.getAttribute('data-cat');
      document.querySelectorAll('.gal .gal-item').forEach(function (it) {
        it.hidden = cat !== 'all' && (' ' + it.getAttribute('data-cats') + ' ').indexOf(' ' + cat + ' ') < 0;
      });
    });
  }

  // lightbox
  var items = [].slice.call(document.querySelectorAll('[data-lb]'));
  if (items.length) {
    var lb = document.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Просмотр фото');
    var arrow = function (d) { return '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="' + d + '" stroke="#fff" stroke-width="1.6"/></svg>'; };
    lb.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lb-x" type="button" aria-label="Закрыть">' + arrow('M4 4l12 12M16 4L4 16') + '</button>' +
      '<button class="lb-p" type="button" aria-label="Предыдущее фото">' + arrow('M12 4l-6 6 6 6') + '</button>' +
      '<button class="lb-n" type="button" aria-label="Следующее фото">' + arrow('M8 4l6 6-6 6') + '</button>';
    document.body.appendChild(lb);
    var img = lb.querySelector('img'), cap = lb.querySelector('figcaption'), cur = 0, last = null;
    var visible = function () { return items.filter(function (it) { return !it.hidden; }); };
    var show = function (i) {
      var list = visible(); cur = (i + list.length) % list.length;
      var it = list[cur];
      img.src = it.getAttribute('data-lb');
      img.alt = it.querySelector('img').alt;
      cap.textContent = it.querySelector('img').alt;
    };
    var close = function () { lb.classList.remove('open'); document.body.style.overflow = ''; if (last) last.focus(); };
    items.forEach(function (it) {
      it.addEventListener('click', function () { last = it; show(visible().indexOf(it)); lb.classList.add('open'); document.body.style.overflow = 'hidden'; lb.querySelector('.lb-x').focus(); });
    });
    lb.querySelector('.lb-x').addEventListener('click', close);
    lb.querySelector('.lb-p').addEventListener('click', function () { show(cur - 1); });
    lb.querySelector('.lb-n').addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
  }

  // request forms: send through send.php without leaving the page
  document.querySelectorAll('form.form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.fetch || !window.FormData) return;
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      form.classList.remove('err');
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (r) { if (!r.ok) throw new Error(); form.classList.add('sent'); })
        .catch(function () { form.classList.add('err'); })
        .then(function () { btn.disabled = false; });
    });
  });
})();
