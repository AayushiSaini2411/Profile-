(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(s, r){ return (r||document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };

  var yr = $('#yr'); if(yr) yr.textContent = new Date().getFullYear();

  // nav background, scroll progress bar, timeline fill
  var nav = $('#nav'), links = $('#links'), mb = $('#menuBtn'), bar = $('.progress'), tl = $('.tl'), fill = $('.tl .fill');
  function onScroll(){
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('scrolled', y > 30);
    if(bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y/max, 1) : 0) + ')';
    if(tl && fill){
      var r = tl.getBoundingClientRect();
      fill.style.height = Math.max(0, Math.min(r.height, window.innerHeight*0.6 - r.top)) + 'px';
    }
  }
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true}); window.addEventListener('resize', onScroll);
  mb.addEventListener('click', function(){ var o = links.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });

  // stagger: children of [data-stagger] reveal one after another
  $$('[data-stagger]').forEach(function(p){
    $$('.rv', p).forEach(function(el, i){ el.style.setProperty('--i', i); });
  });

  // number counters
  function count(el){
    if(reduce) return;
    var end = parseFloat(el.dataset.count), dec = +(el.dataset.dec||0), pre = el.dataset.prefix||'', suf = el.dataset.suffix||'', t0 = null;
    function step(t){
      if(!t0) t0 = t;
      var p = Math.min((t - t0)/1200, 1), e = 1 - Math.pow(1-p, 3);
      el.textContent = pre + (end*e).toFixed(dec) + suf;
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // reveal on scroll
  var rv = $$('.rv');
  if(!('IntersectionObserver' in window) || reduce){
    rv.forEach(function(el){ el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(en){
        if(!en.isIntersecting) return;
        en.target.classList.add('in');
        $$('[data-count]', en.target).forEach(count);
        io.unobserve(en.target);
      });
    }, {threshold:.1});
    rv.forEach(function(el){ io.observe(el); });
  }

  // project filter
  var fbtns = $$('.filters button'), cards = $$('.card[data-t]');
  fbtns.forEach(function(b){
    b.addEventListener('click', function(){
      fbtns.forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
      var f = b.dataset.f;
      cards.forEach(function(c){
        var show = f === 'all' || c.dataset.t.split(' ').indexOf(f) > -1;
        c.classList.toggle('hide', !show);
        c.classList.remove('pop');
        if(show){ c.classList.add('in'); void c.offsetWidth; c.classList.add('pop'); }
      });
    });
  });

  // slide galleries + lightbox
  var gals = $$('.gal');
  if(gals.length){
    var lb = document.createElement('dialog');
    lb.className = 'lb'; lb.setAttribute('aria-label', 'Slide viewer');
    lb.innerHTML = '<img src="" alt=""><div class="row"><button type="button" data-a="prev" aria-label="Previous slide">‹</button><span class="cap"></span><button type="button" data-a="next" aria-label="Next slide">›</button><button type="button" data-a="close" aria-label="Close">×</button></div>';
    document.body.appendChild(lb);
    var lbImg = $('img', lb), lbCap = $('.cap', lb), cur = null;

    function draw(g){
      var sl = g.slides[g.i];
      g.img.classList.remove('swap'); void g.img.offsetWidth; g.img.classList.add('swap');
      g.img.src = sl[0]; g.img.alt = sl[1];
      g.cap.textContent = (g.i+1) + ' / ' + g.slides.length + ' · ' + sl[1];
      g.thumbs.forEach(function(t, i){ t.setAttribute('aria-current', i === g.i); });
      if(cur === g && lb.open){ lbImg.src = sl[0]; lbImg.alt = sl[1]; lbCap.textContent = g.cap.textContent; }
    }
    function move(g, d){ g.i = (g.i + d + g.slides.length) % g.slides.length; draw(g); }

    gals.forEach(function(el){
      var g = {slides: JSON.parse(el.dataset.slides), i: 0, img: $('img', el), cap: $('.cap', el), thumbs: []};
      var th = document.createElement('div'); th.className = 'thumbs';
      g.slides.forEach(function(sl, i){
        var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Slide ' + (i+1) + ': ' + sl[1]);
        b.innerHTML = '<img src="' + sl[0] + '" alt="" loading="lazy">';
        b.addEventListener('click', function(){ g.i = i; draw(g); });
        th.appendChild(b); g.thumbs.push(b);
      });
      el.appendChild(th);
      $('.prev', el).addEventListener('click', function(){ move(g, -1); });
      $('.next', el).addEventListener('click', function(){ move(g, 1); });
      $('.gal-view', el).addEventListener('click', function(){
        cur = g;
        if(lb.showModal){ lb.showModal(); draw(g); } else { window.open(g.slides[g.i][0], '_blank'); }
      });
      draw(g);
    });
    lb.addEventListener('click', function(e){
      var a = e.target.dataset && e.target.dataset.a;
      if(e.target === lb || a === 'close') lb.close();
      else if(a === 'prev' && cur) move(cur, -1);
      else if(a === 'next' && cur) move(cur, 1);
    });
    lb.addEventListener('keydown', function(e){
      if(!cur) return;
      if(e.key === 'ArrowLeft') move(cur, -1);
      if(e.key === 'ArrowRight') move(cur, 1);
    });
  }
})();
