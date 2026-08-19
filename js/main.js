(function () {
	'use strict';

	var header = document.getElementById('site-header');
	var navToggle = document.getElementById('navToggle');
	var primaryNav = document.getElementById('primaryNav');
	var navLinks = document.querySelectorAll('.nav-link');
	var yearEl = document.getElementById('year');

	if (yearEl) {
		yearEl.textContent = new Date().getFullYear();
	}

	// Sticky header shadow/background on scroll
	function onScroll() {
		if (window.scrollY > 8) {
			header.classList.add('scrolled');
		} else {
			header.classList.remove('scrolled');
		}
	}
	onScroll();
	window.addEventListener('scroll', onScroll, { passive: true });

	// Mobile nav toggle
	if (navToggle && primaryNav) {
		navToggle.addEventListener('click', function () {
			var isOpen = primaryNav.classList.toggle('is-open');
			navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
		});

		navLinks.forEach(function (link) {
			link.addEventListener('click', function () {
				primaryNav.classList.remove('is-open');
				navToggle.setAttribute('aria-expanded', 'false');
			});
		});
	}

	// Active nav link highlighting
	var sections = Array.prototype.map.call(
		document.querySelectorAll('main section[id]'),
		function (s) { return s; }
	);

	if ('IntersectionObserver' in window && sections.length) {
		var navObserver = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						var id = entry.target.getAttribute('id');
						navLinks.forEach(function (link) {
							link.classList.toggle(
								'is-active',
								link.getAttribute('href') === '#' + id
							);
						});
					}
				});
			},
			{ rootMargin: '-45% 0px -50% 0px' }
		);
		sections.forEach(function (s) { navObserver.observe(s); });
	}

	// Reveal-on-scroll
	var revealEls = document.querySelectorAll('.reveal');
	if ('IntersectionObserver' in window && revealEls.length) {
		var revealObserver = new IntersectionObserver(
			function (entries, obs) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-visible');
						obs.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.12 }
		);
		revealEls.forEach(function (el) { revealObserver.observe(el); });
	} else {
		revealEls.forEach(function (el) { el.classList.add('is-visible'); });
	}
})();
