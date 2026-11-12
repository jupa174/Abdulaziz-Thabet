/* ── Navbar scroll effect ── */
const navbar = document.getElementById('navbar');
const scrollProgress = document.querySelector('.scroll-progress');
function updateScrollEffects() {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollProgress) scrollProgress.style.transform = `scaleX(${scrollable > 0 ? window.scrollY / scrollable : 0})`;
}
window.addEventListener('scroll', updateScrollEffects, { passive: true });
window.addEventListener('resize', updateScrollEffects);
updateScrollEffects();

/* ── Mobile nav toggle ── */
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
navToggle?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
});
navLinks?.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'فتح القائمة');
  })
);

/* ── Intersection Observer → fade-up cards ── */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion && 'IntersectionObserver' in window) document.body.classList.add('motion-ready');

const observer = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.08, rootMargin: '0px 0px 30px 0px' }
);
document.querySelectorAll('.animate-card').forEach(el => {
  const siblings = [...el.parentElement.querySelectorAll(':scope > .animate-card')];
  el.style.transitionDelay = reduceMotion ? '0ms' : `${Math.min(siblings.indexOf(el), 5) * 75}ms`;
  observer.observe(el);
});

/* ── Soft spotlight follows the pointer on cards ── */
if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.svc-card, .case-card, .testi-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
    }, { passive: true });
  });
}

/* ── Skill bars ── */
const skillObserver = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting)
      e.target.querySelectorAll('.skill-fill').forEach(b => b.style.width = b.dataset.width + '%');
  }),
  { threshold: 0.3 }
);
document.querySelectorAll('.skill-bars').forEach(el => skillObserver.observe(el));

/* ── Counter animation ── */
function animateCounter(el, target, duration = 1400) {
  const original = el.textContent.trim();
  const parts = original.match(/^([^\d]*)(\d+)(.*)$/);
  if (!parts) return;
  const [, prefix, , suffix] = parts;
  let start = null;
  const step = ts => {
    if (start === null) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = `${prefix}${Math.round(eased * target)}${suffix}`;
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = original;
  };
  requestAnimationFrame(step);
}
if (!reduceMotion && 'IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target, Number(e.target.dataset.count));
        counterObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));
}

/* ── Contact form — Web3Forms ── */
const form       = document.getElementById('contactForm');
const submitBtn  = document.getElementById('submitBtn');
const btnText    = document.getElementById('btnText');
const btnLoader  = document.getElementById('btnLoader');
const formResult = document.getElementById('formResult');

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
  const input = el?.closest('.form-group')?.querySelector('input, textarea');
  if (input) {
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
}
function clearErrors() {
  ['nameError','phoneError','emailError','messageError'].forEach(id => showError(id, ''));
}
function validate(data) {
  let ok = true;
  clearErrors();
  if (!data.get('name')?.trim())    { showError('nameError',    'الاسم مطلوب');     ok = false; }
  const phone = data.get('phone')?.trim() || '';
  const digits = phone.replace(/\D/g, '');
  if (!phone)                         { showError('phoneError', 'رقم الموبايل مطلوب'); ok = false; }
  else if (!/^[+\d\s()-]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
    showError('phoneError', 'رقم موبايل غير صحيح'); ok = false;
  }
  const em = data.get('email')?.trim();
  if (!em)                           { showError('emailError',   'الإيميل مطلوب');   ok = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { showError('emailError', 'إيميل غير صحيح'); ok = false; }
  if (!data.get('message')?.trim()) { showError('messageError', 'الرسالة مطلوبة'); ok = false; }
  return ok;
}

form?.addEventListener('submit', async e => {
  e.preventDefault();
  const data = new FormData(form);
  if (!validate(data)) {
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  submitBtn.disabled = true;
  btnText.style.display   = 'none';
  btnLoader.style.display = 'inline';
  formResult.style.display = 'none';

  try {
    const res  = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data });
    const json = await res.json();
    if (json.success) {
      formResult.textContent = 'تم إرسال رسالتك بنجاح! هرد عليك قريباً 🎉';
      formResult.className   = 'form-result success';
      form.reset();
    } else {
      formResult.textContent = json.message || 'حصل خطأ، حاول تاني.';
      formResult.className   = 'form-result error';
    }
  } catch {
    formResult.textContent = 'حصل خطأ في الاتصال، تواصل معي على الواتساب 👇';
    formResult.className   = 'form-result error';
  } finally {
    formResult.style.display = 'block';
    submitBtn.disabled = false;
    btnText.style.display   = 'inline';
    btnLoader.style.display = 'none';
  }
});
