

const DUMMYFUNC = () => {};
const DUMMYEL = document.getElementById("dummy");

// Structured Clone polyfill

/**
 * Creates a deep copy of the provided source object using structured cloning.
 * 
 * @param {*} source - The object to be cloned.
 * @param {Object} [options] - An optional object specifying cloning options.
 * @param {Array} [options.transfer] - An array of transferable objects that will be moved rather than cloned to the returned object.
 * @returns {*} - A deep copy of the source object.
 * @see [MDN Web Docs: structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone)
 * @note The source and return value must not contain functions or DOM elements.
 * @note This implementation has limitations:
 * - It lacks error checking and type enforcement.
 * - Does not support cloning of ArrayBuffers.
 */
function structuredClonePolyfill(source, options) {
	options = options || {};
	options.transfer = options.transfer || [];
	let value = source;
	if (Array.isArray(source)) {
		if (options.transfer.indexOf(source) === -1) {
			options.transfer.push(source);
			value = [...source];
			for (let i = 0; i < value.length; ++i)
				value[i] = structuredClone(value[name]);
		}
	} else if (source === null) {
		value = null;
	} else if (typeof source === "object" && source.__proto__ === Object.prototype) {
		if (options.transfer.indexOf(source) === -1) {
			options.transfer.push(source);
			value = Object.assign({}, source);
			for (const name in value)
				value[name] = structuredClone(value[name]);
		}
	}
	return value;
}
if (!this.structuredClone) {
	this.structuredClone = structuredClonePolyfill;
}

// Aliases

{

	function alias(obj, name, init) {
		if (init) {
			window[name] = init;
			obj.createRaw = obj.create;
			obj.create = createBody;
		} else {
			window[name] = (...args) => {
				return obj.create(...args);
			};
		}
		Object.assign(window[name], obj);
	}

	function createBody(opts) {
		let body;
		if (opts && (opts.parent || opts.bounds)) {
			const angle = opts.angle;
			Body.setAngle(opts, 0);
			const parent = opts.parent;
			const parts = opts.parts;
			delete opts.parent;
			delete opts.parts;
			body = structuredClone(opts);
			opts.parent = parent;
			opts.parts = parts;
			delete body.id;
			body = Body.createRaw(body);
			Body.setAngle(opts, angle);
			Body.setAngle(body, angle);
			if (opts._forceStatic)
				body._forceStatic = true;
		} else {
			body = Body.createRaw(opts);
		}
		if (body.plugin.fillStyle === undefined)
			body.plugin.fillStyle = randomHex();
		if (body.plugin.strokeStyle === undefined)
			body.plugin.strokeStyle = "#000000";
		if (body.plugin.lineWidth === undefined)
			body.plugin.lineWidth = 1;
		if (body.plugin.opacity === undefined)
			body.plugin.opacity = 1;
		Body.fixRender(body);
		return body;
	}
	function createEngine(...args) {
		const engine = Engine.createRaw(...args);
		engine.selected = new Set();
		engine.selected.toggle = key => {
			if (engine.selected.has(key))
				engine.selected.delete(key);
			else
				engine.selected.add(key);
		};
		return engine;
	}

	alias(Matter.Vector, "Vec");
	alias(Matter.Engine, "Engine", createEngine);
	alias(Matter.Runner, "Runner");
	alias(Matter.Bodies, "Bodies");
	alias(Matter.Body, "Body", createBody);
	alias(Matter.Composite, "Composite");
	alias(Matter.Render, "Render");
	alias(Matter.Bounds, "Bounds");
	alias(Matter.Vertices, "Verts");
	alias(Matter.Constraint, "Constraint");
	window.Events = Matter.Events;
	window.Query = Matter.Query;

	Body.fixRender = (body) => {
		delete body.render.fillStyle;
		Object.defineProperty(body.render, "fillStyle", {
			get: () => {
				return body.plugin.fillStyle;
			}
		});
		delete body.render.strokeStyle;
		Object.defineProperty(body.render, "strokeStyle", {
			get: () => {
				if (engine.selected.has(body)) {
					return "white";
				}
				return body.plugin.strokeStyle;
			}
		});
		delete body.render.lineWidth;
		Object.defineProperty(body.render, "lineWidth", {
			get: () => {
				if (engine.selected.has(body)) {
					return 5;
				}
				return body.plugin.lineWidth;
			}
		});
		delete body.render.opacity;
		Object.defineProperty(body.render, "opacity", {
			get: () => {
				return body.plugin.opacity;
			}
		});
		return body;
	};
	Body.toSquare = (body, exact) => {
		const angle = body.angle;
		Body.setAngle(body, 0);
		const center = Vec.mid(body.bounds.min, body.bounds.max);
		const size = Vec.cartDist(body.bounds.min, body.bounds.max);
		if (exact)
			size.x = size.y = (size.x + size.y) / 2;
		const shape = Bodies.rectangle(
			center.x, center.y,
			size.x, size.y
		);
		Body.setVertices(body, shape.vertices);
		Body.setAngle(body, angle);
	};
	Body.toCircle = (body, exact) => {
		const angle = body.angle;
		Body.setAngle(body, 0);
		const center = Vec.mid(body.bounds.min, body.bounds.max);
		const size = Vec.div(Vec.cartDist(body.bounds.min, body.bounds.max), 2);
		if (exact)
			size.x = size.y = (size.x + size.y) / 2;
		const shape = Bodies.ellipse(
			center.x, center.y,
			size.x, size.y
		);
		Body.setVertices(body, shape.vertices);
		Body.setAngle(body, angle);
	};
	Body.chamfer = (body, radius) => {
		const verts = Verts.chamfer(body.vertices, radius);
		Body.setVertices(body, verts);
	};

	Bodies.ellipse = (x, y, rx, ry, opts) => {
		const body = Bodies.circle(x, y, Math.max(rx, ry), opts);
		if (rx !== ry) {
			if (rx > ry)
				Body.scale(body, 1, ry / rx);
			else
				Body.scale(body, rx / ry, 1);
		}
		return body;
	};

	Engine.log = (self, ...msg) => {
		console.log("Engine:", ...msg);
	};

	Composite.removeMany = (composite, things) => {
		for (const thing of things)
			Composite.remove(composite, thing);
	}
	Composite.addMany = (composite, things) => {
		for (const thing of things)
			Composite.add(composite, thing)
	}

	Vec.abs = (vec) => {
		return Vec(Math.abs(vec.x), Math.abs(vec.y));
	};
	Vec.dist = (a, b) => {
		return Math.sqrt(
			(a.x - b.x) ** 2 +
			(a.y - b.y) ** 2
		);
	};
	Vec.cartDist = (a, b) => {
		return Vec(
			Math.abs(a.x - b.x),
			Math.abs(a.y - b.y)
		);
	}
	Vec.mid = (...vecs) => {
		const out = Vec();
		for (const vec of vecs) {
			out.x += vec.x;
			out.y += vec.y;
		}
		out.x /= vecs.length;
		out.y /= vecs.length;
		return out;
	};

	Matter.Common.setDecomp(decomp);

}

function randomHex() {
    const hex = "0123456789ABCDEF";
    let output = "#";
    for (let i = 0; i < 6; ++i)
        output += hex.charAt(Math.floor(Math.random() * hex.length));
    return output;
}

/*
	Helper functions for converting client (c) space to world (w) space
*/
function cXwX(a) { return (a - can.width / 2) / panzoom.scale - panzoom.x; }
function cYwY(a) { return (a - can.height / 2) / panzoom.scale - panzoom.y; }
function wXcX(a) { return (a + can.width / 2 + panzoom.x) * panzoom.scale; }
function wYcY(a) { return (a + can.height / 2 + panzoom.y) * panzoom.scale; }

/*
	Context Menu Stuff
*/
function ctxClone(bodies) {
	let minX = 0;
	let maxX = 0;
	for (const body of bodies) {
		minX = Math.min(minX, body.bounds.min.x);
		maxX = Math.max(maxX, body.bounds.max.x);
	}
	const dis = (maxX - minX) + 5;
	for (const body of bodies) {
		const newBody = Body(body);
		Body.setPosition(newBody, Vec(newBody.position.x + dis, newBody.position.y));
		Composite.add(world, newBody);
	}
}
function createCombinedInput(name, desc, type, value, placeholder) {
	createCombinedInput.GID = createCombinedInput.GID || 0;
	createCombinedInput.GID++;
	const id = `combinedinput-${name}-${createCombinedInput.GID}`;
	const container = document.createElement("div");
	container.classList.add("combinedinput")
	container.title = desc;
	const label = document.createElement("label");
	label.textContent = name;
	label.for = id;
	container.appendChild(label);
	const input = document.createElement("input");
	input.type = type;
	if (value) input.value = value;
	if (placeholder) input.placeholder = placeholder;
	input.id = id;
	container.appendChild(input);
	return { container: container, input: input, label: label, id: id };
}
function createButton(name, description, onclick) {
	const button = document.createElement("button");
	button.textContent = name;
	button.title = description;
	if (onclick) button.addEventListener("click", onclick);
	return button;
}
const ctxSections = {
	"Style": {
		init: (data, bodies, el) => {
			{
				data.fillStyle = createCombinedInput("fill", "The color of the insides", "color", "#000000");
				data.fillStyle.input.addEventListener("input", event => {
					if (!event.target.value) return;
					for (const body of bodies)
						body.plugin.fillStyle = event.target.value;
				})
				el.appendChild(data.fillStyle.container);
			}
			{
				data.strokeStyle = createCombinedInput("stroke", "The color of the outline", "color", "#000000");
				data.strokeStyle.input.addEventListener("input", event => {
					if (!event.target.value) return;
					for (const body of bodies)
						body.plugin.strokeStyle = event.target.value;
				});
				el.appendChild(data.strokeStyle.container);
			}
			{
				data.lineWidth = createCombinedInput("outline", "How thick the outline is", "number", 1, 1);
				data.lineWidth.input.addEventListener("input", event => {
					if (!event.target.value) return;
					const value = parseFloat(event.target.value);
					if (!value) return;
					for (const body of bodies)
						body.plugin.lineWidth = value;
				});
				el.appendChild(data.lineWidth.container);
			}
		},
		update: (data, bodies, el) => {
			{
				let color = undefined;
				for (const body of bodies) {
					if (color === undefined) {
						color = body.plugin.fillStyle;
					} else if (color !== body.plugin.fillStyle) {
						color = "#000000";
						break;
					}
				}
				if (data.fillStyle.input.value !== color)
					data.fillStyle.input.value = color;
			}
			{
				let color = undefined;
				for (const body of bodies) {
					if (color === undefined) {
						color = body.plugin.strokeStyle;
					} else if (color !== body.plugin.strokeStyle) {
						color = "#000000";
						break;
					}
				}
				if (data.strokeStyle.input.value !== color)
					data.strokeStyle.input.value = color;
			}
		}
	},
	"Material": {
		init: (data, bodies, el) => {
			
		},
		update: (data, bodies, el) => {
			
		}
	},
	"Geometry": {
		init: (data, bodies, el) => {
			el.appendChild(createButton("To Square", "Morph into a square", () => {
				for (const body of bodies)
					Body.toSquare(body, true);
			}));
			el.appendChild(createButton("To Rectangle", "Morph into a square", () => {
				for (const body of bodies)
					Body.toSquare(body, false);
			}));
			el.appendChild(createButton("To Circle", "Morph into a circle", () => {
				for (const body of bodies)
					Body.toCircle(body, true);
			}));
			el.appendChild(createButton("To Ellipse", "Morph into a ellipse", () => {
				for (const body of bodies)
					Body.toCircle(body, false);
			}));
			el.appendChild(createButton("Chamfer", "Make the corners round", () => {
				for (const body of bodies) {
					Body.setAngle(body, 0);
					const chamfer = Math.min(body.bounds.max.x - body.bounds.min.x, body.bounds.max.y - body.bounds.min.y) * 0.1;
					Body.chamfer(body, chamfer);
				}
			}));
		},
		update: (data, bodies, el) => {
			
		}
	},
	"CSG": {
		init: (data, bodies, el) => {

		},
		update: (data, bodies, el) => {
			
		}
	},
	"Advanced": {
		init: (data, bodies, el) => {

		},
		update: (data, bodies, el) => {
			
		}
	}
}
function ctxSection(parent, pos, bodies, icon, title) {
	const el = document.createElement("div");
	el.classList.add("ctx-section");
	let win;
	let options = {
		title: `${title}: ${bodies.size} ${bodies.size === 1 ? "body" : "bodies"}`,
		class: ["wb-ctx"],
		mount: el,
		x: parent.x + parent.width, y: pos.y,
	}
	let data = {};
	function onInit() {
		data = {};
		el.textContent = "";
		ctxSections[title].init(data, bodies, el);
	}
	function onUpdate() {
		ctxSections[title].update(data, bodies, el);
	}
	function onDelete({ object }) {
		if (win.body === null) return;
		if (!bodies.has(object)) return;
		console.log(bodies)
		bodies.delete(object);
		if (bodies.size === 0) {
			win.close();
			return;
		}
		win.setTitle(`${title}: ${bodies.size} ${bodies.size === 1 ? "body" : "bodies"}`);
		onInit();
		options.width = options.minwidth = el.clientWidth;
		options.height = options.minheight = el.clientHeight + 35;
		win.resize(options.width, options.height);
	}
	Events.on(world, "afterRemove", onDelete);
	onInit();
	Events.on(engine, "afterUpdate", onUpdate);
	onUpdate();
	DUMMYEL.appendChild(el);
	return new Promise(resolve => {
		setTimeout(() => {
			options.width = options.minwidth = el.clientWidth;
			options.height = options.minheight = el.clientHeight + 35;
			win = new WinBox(options);
			win.onclose = () => {
				Events.off(world, "afterRemove", onDelete);
				Events.off(engine, "afterUpdate", onUpdate);
			};
			win.onmove = () => {
				win._moved = true;
			};
			resolve(win);
		});
	});
}
function ctxCreate(pos, bodies) {
	let win;
	const container = document.createElement("div");
	container.classList.add("ctx");
	let child;
	function addSection(icon, title, func, isRecursive) {
		const section = document.createElement("button");
		section.title = title;
		section.classList.add("section");
		if (func) {
			section.addEventListener("pointerup", func);
			section.addEventListener("pointerup", () => { if (win.body) win.close() });
		}
		const iconify = document.createElement("iconify-icon");
		iconify.icon = icon;
		section.appendChild(iconify);
		const label = document.createTextNode(title);
		section.appendChild(label);
		container.appendChild(section);
		if (isRecursive) {
			const caret = document.createElement("iconify-icon");
			caret.icon = "mdi:chevron-right";
			caret.classList.add("caret");
			section.appendChild(caret);
			function onLeave() {
				section.removeEventListener("pointerleave", onLeave);
				if (child && !child._moved && child.body)
					child.close();
				child = null;
			}
			section.addEventListener("pointerenter", () => {
				if (child && !child._moved && child.body)
					child.close();
				ctxSection(win, Vec(win.x + win.width, section.getBoundingClientRect().y - 35), new Set(bodies), icon, title).then(_ => {
					child = _;
					can.addEventListener("pointermove", onLeave);
				});
			});
		}
	}
	function addHR() {
		const hr = document.createElement("hr");
		container.appendChild(hr);
	}
	addSection("mdi:sheep", "Clone", ctxClone.bind(this, bodies));
	addSection("mdi:delete", "Delete", Composite.removeMany.bind(world, world, bodies));
	addHR();
	addSection("mdi:paint", "Style", undefined, true);
	addSection("mdi:material", "Material", undefined, true);
	addHR();
	addSection("mdi:shape", "Geometry", undefined, true);
	addSection("mdi:set-union", "CSG", undefined, true);
	addHR();
	addSection("mdi:cog", "Advanced", undefined, true);
	DUMMYEL.appendChild(container);
	setTimeout(() => {
		win = new WinBox({
			title: `${bodies.size} ${bodies.size === 1 ? "body" : "bodies"}`,
			class: ["wb-ctx", "wb-no-resize"],
			mount: container,
			x: pos.x, y: pos.y,
			width: container.clientWidth, height: container.clientHeight + 35,
			overflow: true,
		});
		win._moved = false;
		win.onmove = () => {
			if (child && !child._moved && child.body) {
				/*child._origX = child._origX || child.x;
				child._origY = child._origY || child.y;
				child.move(child._origX + win.x - pos.x, child._origY + win.y - pos.y);
				child._moved = false;*/ // TODO allow child window to moved with parent window
				child.close();
				child = null;
			}
			win._moved = true;
		};
		function onClick() {
			can.removeEventListener("pointerdown", onClick);
			if (!win._moved && win.body)
				win.close();
		}
		can.addEventListener("pointerdown", onClick);
		function onDelete({ object }) {
			if (win.body === null) return;
			if (!bodies.has(object)) return;
			bodies.delete(object);
			if (bodies.size === 0) {
				win.close();
			} else {
				win.setTitle(`${bodies.size} ${bodies.size === 1 ? "body" : "bodies"}`);
			}
		}
		win.onclose = () => {
			Events.off(world, "afterRemove", onDelete);
		};
		Events.on(world, "afterRemove", onDelete);
	});
}

/*
	Body Util stuff
*/
function findBody(pos) {
	const bodies = Composite.allBodies(world);
	for (let i = bodies.length - 1; i >= 0; --i) {
		const body = bodies[i];
		if (!Bounds.contains(body.bounds, pos)) continue;
		if (!Verts.contains(body.vertices, pos)) continue;
		return body;
	}
}

function randomBody(pos) {
	let chamfer = null;
	let body;
	if (Math.random() > 0.7)
    	chamfer = { radius: 10 };
	if (Math.random() > 0.7) { // rect
		if (Math.random() > 0.5)
			body = Bodies.rectangle(pos.x, pos.y, Matter.Common.random(80, 120), Matter.Common.random(20, 30), { chamfer: chamfer });
		else 
			body = Bodies.rectangle(pos.x, pos.y, Matter.Common.random(20, 30), Matter.Common.random(80, 120), { chamfer: chamfer });
	} else {
		let sides = Math.round(Math.random() * 8) + 3;
		body = Bodies.polygon(pos.x, pos.y, sides, Matter.Common.random(25, 50), { chamfer: chamfer });
	}
	return body;
}

let tool = 0;
function toolUpdate(event) {
	let value = event.target.value;
	if (value.length === 1)
		value = parseInt(value);
	tool = value;
}

// Engine

window.bounds = Bounds();
window.engine = Engine();
window.world  = engine.world;
window.render = Render({
	canvas: document.getElementById("can"),
	engine: engine,
	options: {
		bounds: bounds,
		hasBounds: true,
		background: "#333",
		wireframes: false
	}
});

Render.run(render);
window.runner = Runner.run(engine);

// Mouse Controlls

const mouseCtrls = {}
mouseCtrls[0] = { // LMB
	dragStart: (event, data) => {
		if (!data.body) {
			data.button = 4;
			mouseCtrls[4].dragStart(event, data);
			return;
		}
		if (event.ctrlKey) {
			const newBodies = new Set();
			data.bodies.forEach(body => {
				if (!body.isStatic) {
					body._forceStatic = true;
					body.isStatic = true;
				}
				newBody = Body(body);
				Composite.add(world, newBody);
				newBodies.add(newBody);
			});
			data.oldBodies = data.bodies;
			data.bodies = newBodies;
		}
		if (data.body.isStatic || event.shiftKey || data.bodies.size > 1 || !runner.enabled) {
			data.bodies.forEach(body => {
				body._offset = Vec.sub(data.startMouse, body.position);
				if (body.isStatic) return;
				body._forceStatic = true;
				body.isStatic = true;
			});
		} else {
			data.body._offset = Vec.sub(data.startMouse, data.body.position);
			data.constraint = Constraint({
				pointA: data.startMouse,
				bodyB: data.body,
				pointB: data.body._offset,
				stiffness: 0.1,
				length: 0
			});
			Composite.add(world, data.constraint);
		}
	},
	dragMove: (event, data) => {
		if (data.constraint) {
			data.constraint.pointA = mouse;
		} else {
			if (event.shiftKey) {
				if (Math.abs(mouse.x - data.startMouse.x) < Math.abs(mouse.y - data.startMouse.y))
					mouse.x = data.startMouse.x;
				else
					mouse.y = data.startMouse.y;
			}
			data.bodies.forEach(body => {
				Body.setPosition(body, Vec.sub(mouse, body._offset));
			});
		}
	},
	dragEnd: (event, data) => {
		if (data.constraint)
			Composite.remove(world, data.constraint);
		data.bodies.forEach(body => {
			if (body._forceStatic) {
				body.isStatic = false;
				Body.setAngularVelocity(body, 0);
				Body.setVelocity(body, Vec(0, 0));
			}
			delete body._forceStatic;
			delete body._offset;
		});
		if (data.oldBodies) {
			data.oldBodies.forEach(body => {
				if (body._forceStatic) {
					body.isStatic = false;
					Body.setAngularVelocity(body, 0);
					Body.setVelocity(body, Vec(0, 0));
				}
				delete body._forceStatic;
				delete body._offset;
			});
		}
	}
};
mouseCtrls[1] = { // MMB
	dragStart: (event, data) => {
		panzoom.handleDown(event);
	},
	dragMove: (event, data) => {
		panzoom.handleMove(event);
	},
	dragEnd: (event, data) => {
		let delta = performance.now() - panzoom.lastTime;
		if (delta > 50) return;
		let xv = panzoom.x - panzoom.lastX;
		let yv = panzoom.y - panzoom.lastY;
		function animate() {
			if (panzoom.moving) {
				panzoom.lastX = panzoom.x;
				panzoom.lastY = panzoom.y;
				return;
			}
			if (Math.abs(xv) < 0.1 / panzoom.scale || Math.abs(yv) < 0.1 / panzoom.scale)
				return;
			xv *= 0.99;
			yv *= 0.99;
			panzoom.pan(xv, yv, { relative: true });
			requestAnimationFrame(animate);
		}
		requestAnimationFrame(animate);
		panzoom.moving = false;
	}
};
mouseCtrls[2] = { // RMB
	click: (event, data) => {
		if (data.bodies.size === 0) return;
		ctxCreate(Vec(event.clientX, event.clientY), new Set(data.bodies));
	},
	dragStart: (event, data) => {
		const length = data.bodies.size;
		data.center = Vec();
		data.composite = Composite();
		data.bodies.forEach(body => {
			data.center.x += body.position.x / length;
			data.center.y += body.position.y / length;
			Composite.add(data.composite, body);
			if (body.isStatic) return;
			body._forceStatic = true;
			body.isStatic = true;
		});
		data.startAngle = Vec.angle(mouse, data.center);
	},
	dragMove: (event, data) => {
		let angle = Vec.angle(mouse, data.center);
		if (event.shiftKey) {
			angle = Math.round(angle / (Math.PI / 8)) * (Math.PI / 8);
		} else if (event.ctrlKey) {
			angle += data.startAngle;
			angle = Math.round(angle / (Math.PI / 8)) * (Math.PI / 8);
			angle -= data.startAngle;
		}
		if (data.lastAngle) {
			Matter.Composite.rotate(data.composite, -data.lastAngle, data.center);
		}
		data.lastAngle = angle - data.startAngle;
		Matter.Composite.rotate(data.composite, angle - data.startAngle, data.center);
	},
	dragEnd: (event, data) => {
		data.bodies.forEach(body => {
			if (body._forceStatic) {
				body.isStatic = false;
				Body.setAngularVelocity(body, 0);
				Body.setVelocity(body, Vec(0, 0));
			}
			delete body._forceStatic;
		});
	}
};
mouseCtrls[4] = { // For selecting
	dragStart: (event, data) => {
		if (!event.shiftKey) {
			engine.selected.clear();
		}
		data.added = new Set();
		data.startMouse = Vec(cXwX(event.clientX), cYwY(event.clientY));
		data.endMouse = Vec(cXwX(event.clientX), cYwY(event.clientY));
		data.bounds = Bounds();
		data.bounds.min.x = data.bounds.min.y = data.bounds.max.x = data.bounds.max.x = 0;
		data.render = () => {
			data.bounds.min.x = Math.min(data.startMouse.x, data.endMouse.x);
			data.bounds.max.x = Math.max(data.startMouse.x, data.endMouse.x);
			data.bounds.min.y = Math.min(data.startMouse.y, data.endMouse.y);
			data.bounds.max.y = Math.max(data.startMouse.y, data.endMouse.y);
			for (const body of Composite.allBodies(world)) {
				if (Bounds.contains(data.bounds, body.position)) {
					if (engine.selected.has(body))
						continue
					engine.selected.add(body);
					data.added.add(body);
				} else if (data.added.has(body)) {
					engine.selected.delete(body);
					data.added.delete(body);
				}
			}
			const ctx = render.context;
			ctx.save();
			render.controller.startViewTransform(render);
			ctx.globalAlpha = 0.5;
			ctx.strokeStyle = ctx.fillStyle = "white";
			ctx.fillRect(
				data.bounds.min.x, data.bounds.min.y,
				data.bounds.max.x - data.bounds.min.x, data.bounds.max.y - data.bounds.min.y
			);
			ctx.globalAlpha = 0.7;
			ctx.lineWidth = 2;
			ctx.lineJoin = "round";
			ctx.lineCap = "round";
			ctx.strokeRect(
				data.bounds.min.x - 1, data.bounds.min.y - 1,
				data.bounds.max.x - data.bounds.min.x + 2, data.bounds.max.y - data.bounds.min.y + 2
			);
			ctx.restore();
		};
		Events.on(render, "afterRender", data.render);
	},
	dragMove: (event, data) => {
		data.endMouse.x = cXwX(event.clientX);
		data.endMouse.y = cYwY(event.clientY);
	},
	dragEnd: (event, data) => {
		Events.off(render, "afterRender", data.render);
	}
};
mouseCtrls["rectangle"] = {
	dragStart: (event, data) => {
		if (!event.shiftKey) {
			engine.selected.clear();
		}
		data.startMouse = Vec(cXwX(event.clientX), cYwY(event.clientY));
		data.a = Vec(cXwX(event.clientX), cYwY(event.clientY));
		data.b = Vec(cXwX(event.clientX), cYwY(event.clientY));
		data.render = () => {
			const ctx = render.context;
			ctx.save();
			render.controller.startViewTransform(render);
			ctx.beginPath();
			ctx.moveTo(data.a.x, data.a.y);
			ctx.lineTo(data.b.x, data.a.y);
			ctx.lineTo(data.b.x, data.b.y);
			ctx.lineTo(data.a.x, data.b.y);
			ctx.lineTo(data.a.x, data.a.y);
			ctx.globalAlpha = 0.5;
			ctx.fillStyle = "blue";
			ctx.fill();
			ctx.globalAlpha = 0.7;
			ctx.strokeStyle = "black";
			ctx.lineWidth = 2;
			ctx.lineJoin = "round";
			ctx.lineCap = "round";
			ctx.stroke();
			ctx.restore();
		};
		Events.on(render, "afterRender", data.render);
	},
	dragMove: (event, data) => {
		data.b.x = cXwX(event.clientX);
		data.b.y = cYwY(event.clientY);
		if (event.shiftKey) {
			if (Math.abs(data.b.x - data.startMouse.x) < Math.abs(data.b.y - data.startMouse.y)) {
				data.b.x = data.b.y - data.startMouse.y + data.startMouse.x;
			} else {
				data.b.y = data.b.x - data.startMouse.x + data.startMouse.y;
			}
		}
		if (event.ctrlKey) {
			const size = Vec.abs(Vec.sub(data.startMouse, data.b));
			const center = data.startMouse;
			data.a = Vec.sub(center, size);
			data.b = Vec.add(center, size);
		} else {
			data.a = data.startMouse;
		}
	},
	dragEnd: (event, data) => {
		Events.off(render, "afterRender", data.render);
		const size = Vec.cartDist(data.a, data.b);
		const center = Vec.mid(data.a, data.b);
		const body = Bodies.rectangle(center.x, center.y, size.x, size.y);
		Composite.add(world, body);
	}
};
mouseCtrls["circle"] = {
	dragStart: (event, data) => {
		if (!event.shiftKey) {
			engine.selected.clear();
		}
		data.startMouse = Vec(cXwX(event.clientX), cYwY(event.clientY));
		data.a = Vec(cXwX(event.clientX), cYwY(event.clientY));
		data.b = Vec(cXwX(event.clientX), cYwY(event.clientY));
		data.render = () => {
			const ctx = render.context;
			ctx.save();
			render.controller.startViewTransform(render);
			ctx.beginPath();
			const size = Vec.div(Vec.cartDist(data.a, data.b), 2);
			const center = Vec.mid(data.a, data.b);
			ctx.ellipse(center.x, center.y, size.x, size.y, 0, 0, Math.PI * 2);
			ctx.globalAlpha = 0.5;
			ctx.fillStyle = "blue";
			ctx.fill();
			ctx.globalAlpha = 0.7;
			ctx.strokeStyle = "black";
			ctx.lineWidth = 2;
			ctx.lineJoin = "round";
			ctx.lineCap = "round";
			ctx.stroke();
			ctx.restore();
		};
		Events.on(render, "afterRender", data.render);
	},
	dragMove: (event, data) => {
		data.b.x = cXwX(event.clientX);
		data.b.y = cYwY(event.clientY);
		if (!event.shiftKey) {
			if (Math.abs(data.b.x - data.startMouse.x) < Math.abs(data.b.y - data.startMouse.y)) {
				data.b.x = data.b.y - data.startMouse.y + data.startMouse.x;
			} else {
				data.b.y = data.b.x - data.startMouse.x + data.startMouse.y;
			}
		}
		if (!event.ctrlKey) {
			const size = Vec.abs(Vec.sub(data.startMouse, data.b));
			const center = data.startMouse;
			data.a = Vec.sub(center, size);
			data.b = Vec.add(center, size);
		} else {
			data.a = data.startMouse;
		}
	},
	dragEnd: (event, data) => {
		Events.off(render, "afterRender", data.render);
		const size = Vec.div(Vec.cartDist(data.a, data.b), 2);
		const center = Vec.mid(data.a, data.b);
		const body = Bodies.ellipse(center.x, center.y, size.x, size.y);
		Composite.add(world, body);
	}
};
mouseCtrls["draw"] = {
	dragStart: (event, data) => {
		if (!event.shiftKey) {
			engine.selected.clear();
		}
		data.pts = [Vec.clone(mouse)];
		data.render = () => {
			const ctx = render.context;
			ctx.save();
			render.controller.startViewTransform(render);
			ctx.beginPath();
			ctx.moveTo(data.pts[0].x, data.pts[0].y);
			for (let i = 0; i < data.pts.length; ++i) {
				const pt = data.pts[i];
				ctx.lineTo(pt.x, pt.y);
			}
			ctx.globalAlpha = 0.5;
			ctx.fillStyle = "blue";
			ctx.fill();
			ctx.globalAlpha = 0.7;
			ctx.strokeStyle = "black";
			ctx.lineWidth = 2;
			ctx.lineJoin = "round";
			ctx.lineCap = "round";
			ctx.stroke();
			ctx.restore();
		};
		Events.on(render, "afterRender", data.render);
	},
	dragMove: (event, data) => {
		const last = data.pts[data.pts.length - 1];
		if (Vec.dist(mouse, last) < 50) return;
		data.pts.push(Vec.clone(mouse));
	},
	dragEnd: (event, data) => {
		Events.off(render, "afterRender", data.render);
		if (data.pts.length <= 2) return;
		const body = Bodies.fromVertices(data.pts[0].x, data.pts[0].y, [data.pts], {}, true, 0.01, 1, 0);
		Composite.add(world, body);
	}
};

// Camera

{
	const can = document.getElementById("can");
	function updateTransform() {
		render.bounds.min.x = (can.width / -2) / panzoom.scale - panzoom.x;
		render.bounds.max.x = (can.width / 2) / panzoom.scale - panzoom.x;
		render.bounds.min.y = (can.height / -2) / panzoom.scale - panzoom.y;
		render.bounds.max.y = (can.height / 2) / panzoom.scale - panzoom.y;
	}
	function updateSize() {
		render.options.width = can.width = window.innerWidth;
		render.options.height = can.height = window.innerHeight
		updateTransform();
	}
	window.panzoom = Panzoom(can, {
		setTransform: (_, { scale, x, y }) => {
			panzoom.lastX = panzoom.x;
			panzoom.lastY = panzoom.y;
			panzoom.lastTime = performance.now();
			panzoom.x = x;
			panzoom.y = y;
			panzoom.scale = scale;
			updateTransform();
		},
		origin: "0 0",
		noBind: true,
		animate: true,
		pinchAndPan: true,
		maxScale: 100,
		minScale: 0.1
	});
	panzoom.resetStyle();
	panzoom.x = 0;
	panzoom.y = 0;
	panzoom.scale = 1;
	panzoom.lastX = 0;
	panzoom.lastY = 0;
	panzoom.lastTime = performance.now();
	panzoom.moving = false;
	let mouseData = {};
	function handleKeyChange(event) {
		switch (event.key) {
			case "Shift":
			case "Control":
				for (const data of Object.values(mouseData)) {
					if (!data.moved) continue;
					if (!data.lastEvent) continue;
					if (data.button === 0)
						data.startMouse = Vec(cXwX(data.lastEvent.clientX), cYwY(data.lastEvent.clientY));
					mouseCtrls[data.button].dragMove(data.lastEvent, data);
				}
				break;
		}
	}
	function handleKeyDown(event) {
		handleKeyChange(event);
		console.log(event.key);
		const key = event.key.toLowerCase();
		if (event.ctrlKey) {
			switch (key) {
				case "x": {
					Composite.removeMany(world, engine.selected);
					// No break
				} case "c": {
					event.preventDefault();
					if (engine.selected.size === 0) break;
					const bodies = [];
					for (const body of engine.selected) {
						bodies.push(Body(body));
					}
					let data = CSON.stringify({ start: Vec.clone(mouse), bodies: bodies });
					engine.copyBuffer = data;
					navigator.clipboard.writeText(engine.copyBuffer);
					break;
				} case "v": {
					event.preventDefault();
					function paste(text) {
						const data = CSON.parse(text);
						const start = data.start;
						const bodies = data.bodies;
						const offset = Vec.sub(mouse, start);
						for (const body of bodies) {
							Body.fixRender(body);
							body.id = Matter.Common.nextId();
							Body.translate(body, offset);
						}
						delete bodies.start;
						Composite.addMany(world, bodies);
					}
					navigator.clipboard.readText().then(text => {
						paste(text);
					}).catch(() => {
						if (!engine.copyBuffer) return;
						paste(engine.copyBuffer);
					});
					break;
				} case "a": {
					event.preventDefault();
					for (const body of Composite.allBodies(world)) {
						engine.selected.add(body);
					};
					break;
				}

			}
		}
		switch (event.key) {
			case " ":
				pause();
				break;
			case "Backspace":
			case "Delete":
				Composite.removeMany(world, engine.selected);
				break;
		}
	}
	function handleKeyUp(event) {
		handleKeyChange(event);
	}
	function handleContext(event) {
		event.preventDefault();
	}
	function handleDown(event) {
		mouse.x = cXwX(event.clientX);
		mouse.y = cYwY(event.clientY);
		event.target.setPointerCapture(event.pointerId);
		panzoom.moving = true;
		const data = mouseData[event.pointerId] = {
			event: event,
			button: event.button,
			moved: false,
			startMouse: Vec.clone(mouse)
		};
		if (data.button === 0) {
			data.button = tool;
			if (!mouseCtrls[data.button])
				data.button = 0;
		}
	}
	function handleMove(event) {
		mouse.x = cXwX(event.clientX);
		mouse.y = cYwY(event.clientY);
		const data = mouseData[event.pointerId];
		if (data === undefined) return;
		data.lastEvent = {}
		for (const key in event) data.lastEvent[key] = event[key];
		if (data.moved) {
			mouseCtrls[data.button].dragMove(event, data);
		} else {
			data.body = findBody(mouse);
			if (data.body) {
				if (!engine.selected.has(data.body)) {
					if (!event.shiftKey)
						engine.selected.clear();
					engine.selected.add(data.body);
				}
				data.bodies = engine.selected;
			} else {
				data.bodies = new Set();
			}
			data.moved = true;
			mouseCtrls[data.button].dragStart(event, data);
			mouseCtrls[data.button].dragMove(event, data);
		}
	}
	function handleUp(event) {
		mouse.x = cXwX(event.clientX);
		mouse.y = cYwY(event.clientY);
		event.target.releasePointerCapture(event.pointerId);
		const data = mouseData[event.pointerId];
		if (data === undefined) return;
		if (data.moved) {
			mouseCtrls[data.button].dragEnd(event, data);
		} else {
			data.body = findBody(mouse);
			if (!event.shiftKey && (data.button !== 2 || !data.body)) {
				engine.selected.clear();
			}
			if (data.body) {
				if (data.button === 0)
					engine.selected.toggle(data.body);
				else
					engine.selected.add(data.body);
			}
			data.bodies = engine.selected;
			if (mouseCtrls[data.button].click)
				mouseCtrls[data.button].click(event, data);
		}
		delete mouseData[event.pointerId];
	}
	function handleWheel(event) {
		event.preventDefault();
		if (event.shiftKey) return;
		if (event.ctrlKey) return;
		if (event.deltaY === 0) return;
		const scale = event.deltaY > 0 ? (4 / 5) : (5 / 4);
		panzoom.x -= (event.clientX - can.width / 2) / panzoom.scale - (event.clientX - can.width / 2) / (panzoom.scale * scale);
		panzoom.y -= (event.clientY - can.height / 2) / panzoom.scale - (event.clientY - can.height / 2) / (panzoom.scale * scale);
		panzoom.scale *= scale;
		panzoom.pan(panzoom.x, panzoom.y)
		panzoom.zoom(panzoom.scale);
	}
	
	window.addEventListener("resize", updateSize);
	window.addEventListener("keydown", handleKeyDown);
	window.addEventListener("keyup", handleKeyUp);
	can.addEventListener("pointerdown", handleDown);
	can.addEventListener("pointermove", handleMove);
	can.addEventListener("pointerup", handleUp);
	can.addEventListener("pointercancel", handleUp);
	can.addEventListener("wheel", handleWheel, { passive: false });
	can.addEventListener("contextmenu", handleContext);
	updateSize();

	window.mouse = Vec();
}

{
	const e_opts = document.getElementById("winOpts");
	let w_opts;
	function resize() {
		w_opts.resize(window.innerWidth / 2, 100);
		w_opts.move((window.innerWidth - w_opts.width) / 2, window.innerHeight - w_opts.height);
	}
	w_opts = new WinBox({
		title: "Options",
		class: ["wb-static"],
		autosize: false,
		onmaximize: resize,
		onminimize: resize,
		onrestore: resize,
		mount: e_opts
	});
	resize();
}
{
	const e_tools = document.getElementById("winTools");
	let w_tools;
	function resize() {
		const children = e_tools.childElementCount;
		w_tools.resize(100, Math.ceil(children / 4) * 50 + 35);
		w_tools.move(0, window.innerHeight - w_tools.height);
	}
	w_tools = new WinBox({
		title: "Tools",
		class: ["wb-static", "wb-no-resize"],
		autosize: false,
		onmaximize: resize,
		onminimize: resize,
		onrestore: resize,
		minwidth: 100,
		maxwidth: 100,
		mount: e_tools
	});
	resize();
}

// add bodies
for (let i = 0; i < 100; ++i) {
	Composite.add(world, randomBody(Vec(
		Math.random() * 100 - 50,
		Math.random() * 100 - 150
	)));
}

// add floor
let floor = Matter.Bodies.rectangle(0, 0, 5000, 200, { isStatic: true });
Matter.Composite.add(world, floor);


function pause() {
	const pauseplay = document.getElementById("pauseplaycheckbox");
	if (runner.enabled) {
		pauseplay.checked = runner.enabled = false
	} else {
		pauseplay.checked = runner.enabled = true;
	}
}
