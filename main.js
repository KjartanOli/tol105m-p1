'use strict';

import { get_shader, init_shaders } from './shaders.js';

let gl = null;
let program = null;

let mouse_start = null;
let gun_offset = 0;

const origin = vec2(-2, 0);

const steps = {
	bird: vec2(0.005, 0),
	bullet: vec2(0, 0.1),
};

const shapes = {
	gun: {
		width: 0.2,
		height: 0.1,
	},
	bird: {
		width: 0.15,
		height: 0.07,
	},
	bullet: {
		width: 0.1,
		height: 0.15,
	},
	score: {
		width: 0.005,
		height: 0.05,
	},
};

const slices = [
	{
		item_vertices: 3,
		items: 1,
		max_items: 1,
		vertices: [
			[
				vec2(-(shapes.gun.width / 2),-1),
				vec2(0,-1 + shapes.gun.height),
				vec2(shapes.gun.width / 2,-1),
			]
		],
		colour: vec4(0.0, 1.0, 0.0, 1.0),
	},
	{
		item_vertices: 6,
		items: 0,
		max_items: 7,
		vertices: (() => {
			const out = [];
			for (let i = 0; i < 7; ++i)
				out.push(
					make_rectangle(
						origin,
						shapes.bird.width,
						shapes.bird.height
					));
			return out;
		})(),
		colour: vec4(0.0, 1.0, 0.0, 1.0),
		directions: (() => {
			const out = [];
			for (let i = 0; i < 7; ++i)
				out.push(0);
			return out;
		}),
	},
	{
		item_vertices: 6,
		items: 0,
		max_items: 5,
		vertices: (() => {
			const out = [];
			for (let i = 0; i < 5; ++i)
				out.push(make_rectangle(
					origin,
					shapes.bullet.width,
					shapes.bullet.height
				));
			return out;
		})(),
		colour: vec4(1.0, 0.0, 0.0, 1.0),
	},
	{
		item_vertices: 6,
		items: 0,
		max_items: 5,
		vertices: (() => {
			const step_size = 0.025;
			const bottom = 0.925;
			const left = -0.95;
			return [
				([0,1,2,3].map(i => make_rectangle(
					vec2(left + i * step_size, bottom),
					shapes.score.width,
					shapes.score.height
				))).flat(),
				(() => {
					const p1 = vec2(left - step_size / 2, bottom);
					const p2 = add(p1, vec2(0, shapes.score.width));
					const p3 = add(p1, vec2(4 * step_size + shapes.score.width, shapes.score.height));
					const p4 = add(p3, vec2(0, -shapes.score.width));
					return [
						p1,
						p2,
						p3,
						p3,
						p4,
						p1,
					]
				})(),
			];
		})(),
		colour: vec4(0.0, 1.0, 0.0, 1.0),
	}
].reduce((a, s) => {
	s.offsets = s.vertices.map(_ => vec2(0,0));
	if (a.length === 0) {
		s.start = 0;
		return [s];
	}

	const last = a[a.length - 1];
	s.start = last.start + max_vertices(last);
	a.push(s);
	return a;
}, []);

const gun = slices[0];
const birds = slices[1];
const bullets = slices[2];
const scorecard = slices[3];

function make_rectangle(origin, width, height) {
	return [
		origin,
		add(origin, vec2(width, 0)),
		add(origin, vec2(0, height)),
		add(origin, vec2(width, height)),
		add(origin, vec2(width, 0)),
		add(origin, vec2(0, height)),
	];
}

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
		slice.start * 8,
		flatten(slice.vertices.flat())
	));

	const vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

	const oBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, oBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, total_vertices(slices) * 8, gl.DYNAMIC_DRAW);

	slices.forEach(slice => gl.bufferSubData(
		gl.ARRAY_BUFFER,
		slice.start * 8,
		flatten(expand_offsets(slice))
	));

	const vOffset = gl.getAttribLocation(program, "vOffset");
	gl.vertexAttribPointer(vOffset, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vOffset);

	canvas.addEventListener('mousedown', (event) => {
		if (event.button === 0) {
			mouse_start = get_cursor_location(event);
			canvas.addEventListener('mousemove', move_mouse);
		}
	});

	canvas.addEventListener('mouseup', (event) => {
		if (event.button === 0)
			canvas.removeEventListener('mousemove', move_mouse);
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === ' ')
			shoot();
	});

	render();
}

function shoot() {
	console.log(vec2(gun_offset, -1 + shapes.gun.height));
	add_bird();
}

function get_cursor_location(event) {
	const canvas = event.target;

	const x = (event.offsetX / canvas.clientWidth) * 2 - 1;
	const y = -((event.offsetY / canvas.clientHeight) * 2 - 1);
	return vec2(x, y);
}

function move_mouse(event) {
	const location = get_cursor_location(event);
	gun_offset = clamp(
		location[0] - mouse_start[0],
		-1 + shapes.gun.width / 2,
		1 - shapes.gun.width / 2
	);

	gun.offsets = [vec2(gun_offset, 0)];

	gl.bufferSubData(
		gl.ARRAY_BUFFER,
		gun.start,
		flatten(expand_offsets(gun))
	);
}

function expand_offsets(slice) {
	return slice.vertices.map((v, i) => v.map(_ => slice.offsets[i])).flat();
}

function clamp(x, min, max) {
	return Math.max(Math.min(x, max), min);
}

function random(min, max) {
	return min + Math.random() * (max - min);
}

function add_bird() {
	const height = random(0.0, 0.9);
	const side = (Math.random() < 0.5) ? -1 : 1 - shapes.bird.width;

	birds.offsets[birds.items] = subtract(vec2(side, height), origin);
	birds.directions[birds.items] = vec2(-side, 0);
	birds.items = birds.items + 1;
}

function move_birds() {
	birds.offsets.slice(0, birds.items).forEach((b, i) => {
		birds.offsets[i] = add(b, mult(birds.directions[i], steps.bird));

		const x = add(origin, b)[0];
		if (x < (-1 - shapes.bird.width) || x > 1)
			remove_bird(i);
	});
	gl.bufferSubData(gl.ARRAY_BUFFER, birds.start * 8, flatten(expand_offsets(birds)));
}

function remove_bird(i) {
	birds.items = birds.items - 1;
	birds.offsets[i] = birds.offsets[birds.items];
	birds.directions[i] = birds.directions[birds.items];
}

function render() {
	move_birds();

	gl.clear(gl.COLOR_BUFFER_BIT);
	slices.forEach(slice => {
		const colour = gl.getUniformLocation(program, 'colour');
		gl.uniform4fv(colour, slice.colour);
		gl.drawArrays(
			gl.TRIANGLES,
			slice.start,
			current_vertices(slice)
		)
	});

	window.requestAnimFrame(render);
}

addEventListener('load', init);
