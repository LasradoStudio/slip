/* Slip page effects: an animated character that flies through a page, passing BEHIND and IN FRONT of the page's own text.

   One video carries everything, as three tiles stacked top to bottom:
     1. colour (drawn over black)   2. matte of the whole character   3. matte of only the part in front of the page
   It is drawn onto two transparent canvases, one under the text and one over it. Because both come from the same
   video frame they can never drift apart, and no browser needs to support transparent video.

   Markup (made by app.js when a document has fx set):
     <div class="fx" data-fx="intro"><video src="media/ryuu-intro.mp4" muted loop playsinline></video><canvas class="fx-b"></canvas></div>
     … the page's text …
     <canvas class="fx-f"></canvas>                                                                                     */
(() => {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const VS = 'attribute vec2 p; varying vec2 uv; void main(){ uv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }';
  const FS = `precision mediump float;
    uniform sampler2D t; uniform float front; varying vec2 uv;
    void main(){
      float v = clamp(uv.y, .004, .996) / 3.;                                   // stay clear of the neighbouring tile
      vec3 c = texture2D(t, vec2(uv.x, v)).rgb;
      float all = smoothstep(.05, .95, texture2D(t, vec2(uv.x, v + 1. / 3.)).r);
      float fr = min(all, smoothstep(.05, .95, texture2D(t, vec2(uv.x, v + 2. / 3.)).r));
      float a = mix(all, fr, front);
      gl_FragColor = vec4(all > .002 ? c * (a / all) : vec3(0.), a);            // colour is premultiplied by the whole-character matte
    }`;

  function painter(canvas, front) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    for (const [k, v] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    gl.uniform1f(gl.getUniformLocation(pr, 'front'), front ? 1 : 0);
    return video => {
      if (canvas.width !== video.videoWidth) { canvas.width = video.videoWidth; canvas.height = Math.round(video.videoHeight / 3); gl.viewport(0, 0, canvas.width, canvas.height); }
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video); } catch (e) { return; }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
  }

  function start(wrap) {
    wrap.dataset.on = '1';
    const video = wrap.querySelector('video'), back = wrap.querySelector('.fx-b'), page = wrap.closest('.pp-page');
    const front = page && page.querySelector('.fx-f');
    if (!video || !back || !front) return;
    const drawB = painter(back, false), drawF = painter(front, true);
    const fail = () => { wrap.remove(); front.remove(); };              // no WebGL or no video: the page simply shows without the effect
    if (!drawB || !drawF) return fail();
    video.addEventListener('error', fail);
    let visible = false;
    const draw = () => { if (video.readyState >= 2 && video.videoWidth) { drawB(video); drawF(video); } };
    const tick = () => {
      if (!wrap.isConnected) { video.pause(); return; }                 // the page was re-rendered: let this one go
      draw();
      if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(tick); else requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(en => {
        visible = en.isIntersecting;
        if (visible) video.play().catch(() => {}); else video.pause();
      }), { threshold: 0.05 }).observe(page);
    } else video.play().catch(() => {});
    video.addEventListener('loadeddata', draw);
    tick();
  }

  const scan = () => document.querySelectorAll('.fx[data-fx]:not([data-on])').forEach(start);
  setInterval(scan, 700); addEventListener('load', scan);
})();
