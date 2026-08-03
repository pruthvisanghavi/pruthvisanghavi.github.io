var toggle = document.getElementById('navToggle');
var nav = document.getElementById('nav');
if(toggle){ toggle.addEventListener('click', function(){ nav.classList.toggle('open'); }); }

var siteName = document.getElementById('siteName');
function getScrollY(){
  return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
}
function handleNameScroll(){
  if(!siteName) return;
  if(getScrollY() > 40){ siteName.classList.add('scrolled'); }
  else{ siteName.classList.remove('scrolled'); }
}
window.addEventListener('scroll', handleNameScroll, {passive:true});
window.addEventListener('load', handleNameScroll);
handleNameScroll();

var ICONS = {
  dark: '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>',
  light: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>'
};

function getStoredTheme(){
  try { return localStorage.getItem('site-theme'); } catch(e){ return null; }
}
function storeTheme(t){
  try { localStorage.setItem('site-theme', t); } catch(e){ /* ignore, non-persistent fallback */ }
}

var root = document.documentElement;
var themeIcon = document.getElementById('themeIcon');
var themeBtn = document.getElementById('themeToggle');

function applyTheme(theme){
  if(theme === 'light'){
    root.setAttribute('data-theme', 'light');
    themeIcon.innerHTML = ICONS.dark; /* icon shows the mode you'd switch TO */
  } else {
    root.removeAttribute('data-theme');
    themeIcon.innerHTML = ICONS.light;
  }
}

var initial = getStoredTheme();
if(!initial){
  initial = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
}
applyTheme(initial);

if(themeBtn){
  themeBtn.addEventListener('click', function(){
    var current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    var next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    storeTheme(next);
  });
}
