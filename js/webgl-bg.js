/*
 * Hand-written WebGL background: raymarched, mouse-reactive metaball blob
 * with rim lighting. No dependencies (no three.js) — a single fullscreen
 * quad + a raymarching fragment shader.
 *
 * Skipped entirely on touch devices, small viewports, or when the visitor
 * prefers reduced motion — the CSS radial-gradient hero-glow behind it is
 * the fallback in every one of those cases.
 */
(function () {
	'use strict';

	var canvas = document.getElementById('heroCanvas');
	if (!canvas) return;

	var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var isFinePointer = window.matchMedia('(pointer: fine)').matches;
	var isWideEnough = window.matchMedia('(min-width: 860px)').matches;

	if (prefersReducedMotion || !isFinePointer || !isWideEnough) {
		canvas.remove();
		return;
	}

	var gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true }) ||
		canvas.getContext('experimental-webgl', { alpha: true, antialias: true });

	if (!gl) {
		canvas.remove();
		return;
	}

	var VERT_SRC = [
		'attribute vec2 a_pos;',
		'void main() {',
		'  gl_Position = vec4(a_pos, 0.0, 1.0);',
		'}'
	].join('\n');

	var FRAG_SRC = [
		'precision highp float;',
		'uniform vec2 u_resolution;',
		'uniform float u_time;',
		'uniform vec2 u_mouse;',
		'uniform vec3 u_colorA;',
		'uniform vec3 u_colorB;',

		'float sminPoly(float a, float b, float k) {',
		'  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);',
		'  return mix(b, a, h) - k * h * (1.0 - h);',
		'}',

		'float sdSphere(vec3 p, vec3 c, float r) {',
		'  return length(p - c) - r;',
		'}',

		'float map(vec3 p, float t) {',
		'  vec3 c1 = vec3(sin(t * 0.55) * 0.55, cos(t * 0.45) * 0.28, cos(t * 0.35) * 0.3);',
		'  vec3 c2 = vec3(cos(t * 0.38) * 0.42, sin(t * 0.62) * 0.34, sin(t * 0.28) * 0.3 - 0.2);',
		'  vec3 c3 = vec3(sin(t * 0.3 + 2.0) * 0.38, cos(t * 0.5 + 1.0) * 0.24, cos(t * 0.42) * 0.28 + 0.22);',
		'  float d1 = sdSphere(p, c1, 0.5);',
		'  float d2 = sdSphere(p, c2, 0.38);',
		'  float d3 = sdSphere(p, c3, 0.32);',
		'  float d = sminPoly(d1, d2, 0.45);',
		'  d = sminPoly(d, d3, 0.45);',
		'  return d;',
		'}',

		'vec3 calcNormal(vec3 p, float t) {',
		'  vec2 e = vec2(0.001, 0.0);',
		'  return normalize(vec3(',
		'    map(p + e.xyy, t) - map(p - e.xyy, t),',
		'    map(p + e.yxy, t) - map(p - e.yxy, t),',
		'    map(p + e.yyx, t) - map(p - e.yyx, t)',
		'  ));',
		'}',

		'void main() {',
		'  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;',
		'  uv.x -= 0.62;',
		'  vec3 ro = vec3(0.0, 0.0, 4.6);',
		'  vec3 rd = normalize(vec3(uv + u_mouse * 0.05, -1.9));',

		'  float t = u_time;',
		'  float dist = 0.0;',
		'  vec3 p = ro;',
		'  float hit = -1.0;',
		'  for (int i = 0; i < 56; i++) {',
		'    float d = map(p, t);',
		'    if (d < 0.0015) { hit = dist; break; }',
		'    dist += d;',
		'    p = ro + rd * dist;',
		'    if (dist > 8.0) break;',
		'  }',

		'  vec3 col = vec3(0.0);',
		'  float alpha = 0.0;',

		'  if (hit > 0.0) {',
		'    vec3 n = calcNormal(p, t);',
		'    vec3 lightDir = normalize(vec3(0.6, 0.7, 0.5));',
		'    float diff = clamp(dot(n, lightDir), 0.0, 1.0);',
		'    float rim = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 2.4);',
		'    vec3 base = mix(u_colorA, u_colorB, clamp(n.y * 0.5 + 0.5, 0.0, 1.0));',
		'    col = base * (0.22 + diff * 0.68) + rim * u_colorB * 0.85;',
		'    alpha = 1.0;',
		'  }',

		'  gl_FragColor = vec4(col, alpha);',
		'}'
	].join('\n');

	function compile(type, src) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, src);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	}

	var vertShader = compile(gl.VERTEX_SHADER, VERT_SRC);
	var fragShader = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
	if (!vertShader || !fragShader) { canvas.remove(); return; }

	var program = gl.createProgram();
	gl.attachShader(program, vertShader);
	gl.attachShader(program, fragShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { canvas.remove(); return; }
	gl.useProgram(program);

	var quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

	var posLoc = gl.getAttribLocation(program, 'a_pos');
	gl.enableVertexAttribArray(posLoc);
	gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

	var uRes = gl.getUniformLocation(program, 'u_resolution');
	var uTime = gl.getUniformLocation(program, 'u_time');
	var uMouse = gl.getUniformLocation(program, 'u_mouse');
	var uColorA = gl.getUniformLocation(program, 'u_colorA');
	var uColorB = gl.getUniformLocation(program, 'u_colorB');

	gl.uniform3f(uColorA, 1.0, 0.478, 0.271); // amber accent
	gl.uniform3f(uColorB, 0.133, 0.827, 0.78); // teal accent
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	var mouse = { x: 0, y: 0 };
	var targetMouse = { x: 0, y: 0 };
	var section = canvas.closest('.hero') || canvas.parentElement;

	function onPointerMove(e) {
		var rect = section.getBoundingClientRect();
		targetMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
		targetMouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
	}
	window.addEventListener('pointermove', onPointerMove, { passive: true });

	var dpr = Math.min(window.devicePixelRatio || 1, 1.6);
	function resize() {
		var rect = section.getBoundingClientRect();
		canvas.width = Math.max(1, Math.round(rect.width * dpr));
		canvas.height = Math.max(1, Math.round(rect.height * dpr));
		gl.viewport(0, 0, canvas.width, canvas.height);
	}
	resize();
	window.addEventListener('resize', resize, { passive: true });

	var running = true;
	var io = new IntersectionObserver(function (entries) {
		running = entries[0].isIntersecting;
	});
	io.observe(canvas);
	document.addEventListener('visibilitychange', function () {
		running = running && !document.hidden;
	});

	var start = performance.now();
	function frame(now) {
		requestAnimationFrame(frame);
		if (!running) return;

		mouse.x += (targetMouse.x - mouse.x) * 0.06;
		mouse.y += (targetMouse.y - mouse.y) * 0.06;

		gl.uniform2f(uRes, canvas.width, canvas.height);
		gl.uniform1f(uTime, (now - start) / 1000);
		gl.uniform2f(uMouse, mouse.x, mouse.y);

		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}
	requestAnimationFrame(frame);
})();
