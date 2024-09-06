'use strict';

import { get_shader, init_shaders } from './shaders.js';

let gl = null;
let program = null;

const slices = [
	{
		start: 0,
		item_vertices: 3,
		items: 1,
		max_items: 1,
		vertices: [vec2(-0.1,-1), vec2(0,-0.95), vec2(0.1,-1)],
	},
];

function current_vertices(slice) {
	return slice.item_vertices * slice.items;
}

function max_vertices(slice) {
	return slice.item_vertices * slice.max_items;
}

function total_vertices(slices) {
	return slices.map(max_vertices).reduce((a, b) => a + b, 0);
}

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
	gl.bufferData(gl.ARRAY_BUFFER, total_vertices(slices) * 8, gl.STATIC_DRAW);
	slices.forEach(slice => gl.bufferSubData(
		gl.ARRAY_BUFFER,
		slice.start,
		flatten(slice.vertices)
	));

	const vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

	render();
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT);
	slices.forEach(slice => gl.drawArrays(
		gl.TRIANGLES,
		slice.start,
		current_vertices(slice)
	));
}

addEventListener('load', init);
