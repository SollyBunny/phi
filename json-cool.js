const CSON = {};

CSON.circularMarker = "@";
CSON.isPrimitive = (variable) => {
	if (typeof variable === "object") return false;
	if (Array.isArray(variable)) return false;
	return true;
}
CSON.isNonPrimitive = (variable) => {
	if (typeof variable === "object") return true;
	if (Array.isArray(variable)) return true;
	return false;
}
CSON.decircularize = (parent) => {
	const found = [parent];
	const searching = [parent];
	while (searching.length > 0) {
		const obj = searching.pop();
		for (const key in obj) {
			const value = obj[key];
			if (value === undefined || value === null || value !== value) {
				delete obj[key];
				continue;
			}
			if (CSON.isPrimitive(value)) {
				if (typeof value === "string" && value.startsWith(CSON.circularMarker)) {
					const index = found.length;
					found.push(value);
					obj[key] = `${CSON.circularMarker}${index.toString(36)}`;
				}
				continue;
			};
			let index = found.indexOf(value);
			if (index === -1) {
				index = found.length;
				found.push(value);
				searching.push(value);
			}
			obj[key] = `${CSON.circularMarker}${index.toString(36)}`;
		}
	}
	return { circularMarker: CSON.circularMarker, data: parent, found: found };
}
CSON.recircularize = (parent) => {
	if (parent.circularMarker !== CSON.circularMarker) return;
	const data = parent.data;
	const found = parent.found;
	const searching = [...found, parent];
	while (searching.length > 0) {
		const obj = searching.pop();
		for (const key in obj) {
			const value = obj[key];
			if (typeof value === "string") {
				if (value.startsWith(CSON.circularMarker)) {
					const index = parseInt(value.slice(CSON.circularMarker.length), 36);
					obj[key] = found[index];
				}
			} else if (CSON.isNonPrimitive(value) && found.indexOf(value) === -1) {
				searching.push(value);
			}
		}
	}
	return data;
};
CSON.stringify = (obj) => {
	return JSON.stringify(CSON.decircularize(obj));
	// return btoa(new Zlib.Gzip(BSON.stringify(CSON.decircularize(obj))).compress());
};
CSON.parse = (obj) => {
	return CSON.recircularize(JSON.parse(obj));
	// return CSON.recircularize(BSON.parse(new Zlib.Gunzip(atob(obj)).decompress(), { allowObjectSmallerThanBufferSize: true }));
};
window.CSON = CSON;