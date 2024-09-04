'use strict';

import { get_shader, init_shaders } from './shaders.js';

let gl = null;
let program = null;

const [vertex_shader, fragment_shader] = [
	'vertex-shader.glsl',
	'fragment-shader.glsl'
].map(get_shader);

async function init() {
	const canvas = document.querySelector('#canvas');
	gl = WebGLUtils.setupWebGL(canvas);

	if (!gl)
		alert("WebGL is not available");

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	program = await init_shaders(gl, await vertex_shader, await fragment_shader);
	gl.useProgram(program)

	const vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten([vec2(-1,-1), vec2(0,1), vec2(1,-1)]), gl.STATIC_DRAW);

	const vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
}

addEventListener('load', init);
