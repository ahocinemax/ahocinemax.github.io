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

	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var finePointer = window.matchMedia('(pointer: fine)').matches;

	// Custom cursor
	if (!reduceMotion && finePointer) {
		var dot = document.getElementById('cursorDot');
		var ring = document.getElementById('cursorRing');
		if (dot && ring) {
			document.documentElement.classList.add('has-custom-cursor');
			var ringX = 0, ringY = 0, targetX = 0, targetY = 0;

			window.addEventListener('pointermove', function (e) {
				targetX = e.clientX;
				targetY = e.clientY;
				dot.style.transform = 'translate(' + targetX + 'px,' + targetY + 'px)';
			}, { passive: true });

			(function ringLoop() {
				ringX += (targetX - ringX) * 0.18;
				ringY += (targetY - ringY) * 0.18;
				ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px)';
				requestAnimationFrame(ringLoop);
			})();

			var hoverTargets = document.querySelectorAll('a, button, .tech-card, .project-card, .school-card, .contact-link');
			hoverTargets.forEach(function (el) {
				el.addEventListener('mouseenter', function () { ring.classList.add('is-active'); });
				el.addEventListener('mouseleave', function () { ring.classList.remove('is-active'); });
			});

			document.addEventListener('mouseleave', function () {
				dot.style.opacity = '0';
				ring.style.opacity = '0';
			});
			document.addEventListener('mouseenter', function () {
				dot.style.opacity = '1';
				ring.style.opacity = '1';
			});
		}
	}

	// Magnetic buttons
	if (!reduceMotion && finePointer) {
		document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
			btn.addEventListener('mousemove', function (e) {
				var rect = btn.getBoundingClientRect();
				var relX = e.clientX - rect.left - rect.width / 2;
				var relY = e.clientY - rect.top - rect.height / 2;
				btn.style.transform = 'translate(' + relX * 0.25 + 'px,' + relY * 0.35 + 'px)';
				var inner = btn.querySelector('span');
				if (inner) inner.style.transform = 'translate(' + relX * 0.15 + 'px,' + relY * 0.2 + 'px)';
			});
			btn.addEventListener('mouseleave', function () {
				btn.style.transform = '';
				var inner = btn.querySelector('span');
				if (inner) inner.style.transform = '';
			});
		});
	}

	// 3D tilt on cards
	if (!reduceMotion && finePointer) {
		document.querySelectorAll('.project-card, .tech-card, .highlight-card').forEach(function (card) {
			card.addEventListener('mousemove', function (e) {
				var rect = card.getBoundingClientRect();
				var px = (e.clientX - rect.left) / rect.width - 0.5;
				var py = (e.clientY - rect.top) / rect.height - 0.5;
				card.style.setProperty('--tilt-x', (-py * 8).toFixed(2) + 'deg');
				card.style.setProperty('--tilt-y', (px * 10).toFixed(2) + 'deg');
			});
			card.addEventListener('mouseleave', function () {
				card.style.setProperty('--tilt-x', '0deg');
				card.style.setProperty('--tilt-y', '0deg');
			});
		});
	}

	// Hero terminal typewriter
	var terminalBody = document.getElementById('terminalBody');
	if (terminalBody) {
		var lines = [
			{ prompt: '$ ', text: 'whoami', pause: 250 },
			{ prompt: '', text: 'hocine-abdessalam — développeur full-stack freelance', out: true, pause: 500 },
			{ prompt: '$ ', text: 'ls projets/', pause: 250 },
			{ prompt: '', text: 'caisse/  crm-btp/  dashboard-carrossier/', out: true, pause: 500 },
			{ prompt: '$ ', text: 'cat statut.txt', pause: 250 },
			{ prompt: '', text: '3 SaaS en production · dispo pour un nouveau projet', out: true, pause: 900 }
		];

		if (reduceMotion) {
			terminalBody.textContent = lines.map(function (l) { return l.prompt + l.text; }).join('\n');
		} else {
			(function typeLines() {
				var lineIndex = 0;
				var charIndex = 0;

				function typeChar() {
					if (lineIndex >= lines.length) return;
					var line = lines[lineIndex];
					var span = terminalBody.children[lineIndex];
					if (!span) {
						span = document.createElement('span');
						span.className = 'terminal-line' + (line.out ? ' is-output' : '');
						terminalBody.appendChild(span);
						terminalBody.appendChild(document.createTextNode('\n'));
					}
					var full = line.prompt + line.text;
					charIndex++;
					span.textContent = full.slice(0, charIndex);

					if (charIndex >= full.length) {
						lineIndex++;
						charIndex = 0;
						setTimeout(typeChar, line.pause);
					} else {
						setTimeout(typeChar, line.out ? 12 : 32);
					}
				}
				typeChar();
			})();
		}
	}
})();
