(function () {
  const hamburger = document.getElementById('hamburger');
  const navList   = document.getElementById('nav-list');

  hamburger.addEventListener('click', function () {
    const isOpen = navList.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  });
})();
