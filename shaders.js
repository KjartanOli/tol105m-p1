'use strict';

export async function get_shader(file) {
	const request = await fetch(file);

	if (!request.ok)
		throw new Error(`Could not get shader from ${file}.  Response: ${request.status}`);

	return await request.text();
}


export async function init_shaders(gl, vertex_shader, fragment_shader) {
	const vert = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vert, vertex_shader);
	gl.compileShader(vert);

	if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
		const msg = "Vertex shader failed to compile.  The error log is:"
				+ "<pre>" + gl.getShaderInfoLog(vert) + "</pre>";
		alert(msg);
		return -1;
	}

	const frag = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(frag, fragment_shader);
	gl.compileShader(frag);

	if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
		var msg = "Fragment shader failed to compile.  The error log is:"
				+ "<pre>" + gl.getShaderInfoLog(frag) + "</pre>";
		alert(msg);
		return -1;
	}

	const program = gl.createProgram();
	gl.attachShader(program, vert);
	gl.attachShader(program, frag);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const msg = "Shader program failed to link.  The error log is:"
				+ "<pre>" + gl.getProgramInfoLog(program) + "</pre>";
		alert(msg);
		return -1;
	}

	return program;
}
