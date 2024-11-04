// To parse this data:
//
//   import { Convert, Tiled } from "./file";
//
//   const tiled = Convert.toTiled(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Tiled {
    compressionlevel: number;
    editorsettings:   Editorsettings;
    height:           number;
    infinite:         boolean;
    layers:           TiledLayer[];
    nextlayerid:      number;
    nextobjectid:     number;
    orientation:      string;
    renderorder:      string;
    tiledversion:     string;
    tileheight:       number;
    tilesets:         Tileset[];
    tilewidth:        number;
    type:             string;
    version:          string;
    width:            number;
}

export interface Editorsettings {
    chunksize: Chunksize;
}

export interface Chunksize {
    height: number;
    width:  number;
}

export interface TiledLayer {
    id:          number;
    layers:      LayerLayer[];
    locked?:     boolean;
    name:        string;
    opacity:     number;
    type:        FluffyType;
    visible:     boolean;
    x:           number;
    y:           number;
    properties?: LayerProperty[];
}

export interface LayerLayer {
    chunks:  Chunk[];
    height:  number;
    id:      number;
    name:    LayerName;
    opacity: number;
    startx:  number;
    starty:  number;
    type:    PurpleType;
    visible: boolean;
    width:   number;
    x:       number;
    y:       number;
}

export interface Chunk {
    data:   number[];
    height: number;
    width:  number;
    x:      number;
    y:      number;
}

export enum LayerName {
    Background = "Background",
    Background1 = "Background1",
    Entities = "Entities",
    Entities1 = "Entities1",
    Entities2 = "Entities2",
}

export enum PurpleType {
    Tilelayer = "tilelayer",
}

export interface LayerProperty {
    name:  string;
    type:  string;
    value: boolean;
}

export enum FluffyType {
    Group = "group",
}

export interface Tileset {
    columns:         number;
    firstgid:        number;
    image:           string;
    imageheight:     number;
    imagewidth:      number;
    margin:          number;
    name:            string;
    spacing:         number;
    tilecount:       number;
    tileheight:      number;
    tiles?:          Tile[];
    tilewidth:       number;
    tilerendersize?: string;
}

export interface Tile {
    id:          number;
    objectgroup: Objectgroup;
    properties:  TileProperty[];
}

export interface Objectgroup {
    draworder: Draworder;
    name:      string;
    objects:   Object[];
    opacity:   number;
    type:      ObjectgroupType;
    visible:   boolean;
    x:         number;
    y:         number;
}

export enum Draworder {
    Index = "index",
    Topdown = "topdown",
}

export interface Object {
    height:    number;
    id:        number;
    name:      ObjectName;
    polygon?:  Poly[];
    rotation:  number;
    type:      string;
    visible:   boolean;
    width:     number;
    x:         number;
    y:         number;
    polyline?: Poly[];
}

export enum ObjectName {
    Collider = "Collider",
    Entity = "Entity",
}

export interface Poly {
    x: number;
    y: number;
}

export enum ObjectgroupType {
    Objectgroup = "objectgroup",
}

export interface TileProperty {
    name:  PropertyName;
    type:  PropertyType;
    value: string;
}

export enum PropertyName {
    Name = "name",
}

export enum PropertyType {
    String = "string",
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toTiled(json: string): Tiled {
        return cast(JSON.parse(json), r("Tiled"));
    }

    public static tiledToJson(value: Tiled): string {
        return JSON.stringify(uncast(value, r("Tiled")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "Tiled": o([
        { json: "compressionlevel", js: "compressionlevel", typ: 0 },
        { json: "editorsettings", js: "editorsettings", typ: r("Editorsettings") },
        { json: "height", js: "height", typ: 0 },
        { json: "infinite", js: "infinite", typ: true },
        { json: "layers", js: "layers", typ: a(r("TiledLayer")) },
        { json: "nextlayerid", js: "nextlayerid", typ: 0 },
        { json: "nextobjectid", js: "nextobjectid", typ: 0 },
        { json: "orientation", js: "orientation", typ: "" },
        { json: "renderorder", js: "renderorder", typ: "" },
        { json: "tiledversion", js: "tiledversion", typ: "" },
        { json: "tileheight", js: "tileheight", typ: 0 },
        { json: "tilesets", js: "tilesets", typ: a(r("Tileset")) },
        { json: "tilewidth", js: "tilewidth", typ: 0 },
        { json: "type", js: "type", typ: "" },
        { json: "version", js: "version", typ: "" },
        { json: "width", js: "width", typ: 0 },
    ], false),
    "Editorsettings": o([
        { json: "chunksize", js: "chunksize", typ: r("Chunksize") },
    ], false),
    "Chunksize": o([
        { json: "height", js: "height", typ: 0 },
        { json: "width", js: "width", typ: 0 },
    ], false),
    "TiledLayer": o([
        { json: "id", js: "id", typ: 0 },
        { json: "layers", js: "layers", typ: a(r("LayerLayer")) },
        { json: "locked", js: "locked", typ: u(undefined, true) },
        { json: "name", js: "name", typ: "" },
        { json: "opacity", js: "opacity", typ: 0 },
        { json: "type", js: "type", typ: r("FluffyType") },
        { json: "visible", js: "visible", typ: true },
        { json: "x", js: "x", typ: 0 },
        { json: "y", js: "y", typ: 0 },
        { json: "properties", js: "properties", typ: u(undefined, a(r("LayerProperty"))) },
    ], false),
    "LayerLayer": o([
        { json: "chunks", js: "chunks", typ: a(r("Chunk")) },
        { json: "height", js: "height", typ: 0 },
        { json: "id", js: "id", typ: 0 },
        { json: "name", js: "name", typ: r("LayerName") },
        { json: "opacity", js: "opacity", typ: 0 },
        { json: "startx", js: "startx", typ: 0 },
        { json: "starty", js: "starty", typ: 0 },
        { json: "type", js: "type", typ: r("PurpleType") },
        { json: "visible", js: "visible", typ: true },
        { json: "width", js: "width", typ: 0 },
        { json: "x", js: "x", typ: 0 },
        { json: "y", js: "y", typ: 0 },
    ], false),
    "Chunk": o([
        { json: "data", js: "data", typ: a(0) },
        { json: "height", js: "height", typ: 0 },
        { json: "width", js: "width", typ: 0 },
        { json: "x", js: "x", typ: 0 },
        { json: "y", js: "y", typ: 0 },
    ], false),
    "LayerProperty": o([
        { json: "name", js: "name", typ: "" },
        { json: "type", js: "type", typ: "" },
        { json: "value", js: "value", typ: true },
    ], false),
    "Tileset": o([
        { json: "columns", js: "columns", typ: 0 },
        { json: "firstgid", js: "firstgid", typ: 0 },
        { json: "image", js: "image", typ: "" },
        { json: "imageheight", js: "imageheight", typ: 0 },
        { json: "imagewidth", js: "imagewidth", typ: 0 },
        { json: "margin", js: "margin", typ: 0 },
        { json: "name", js: "name", typ: "" },
        { json: "spacing", js: "spacing", typ: 0 },
        { json: "tilecount", js: "tilecount", typ: 0 },
        { json: "tileheight", js: "tileheight", typ: 0 },
        { json: "tiles", js: "tiles", typ: u(undefined, a(r("Tile"))) },
        { json: "tilewidth", js: "tilewidth", typ: 0 },
        { json: "tilerendersize", js: "tilerendersize", typ: u(undefined, "") },
    ], false),
    "Tile": o([
        { json: "id", js: "id", typ: 0 },
        { json: "objectgroup", js: "objectgroup", typ: r("Objectgroup") },
        { json: "properties", js: "properties", typ: a(r("TileProperty")) },
    ], false),
    "Objectgroup": o([
        { json: "draworder", js: "draworder", typ: r("Draworder") },
        { json: "name", js: "name", typ: "" },
        { json: "objects", js: "objects", typ: a(r("Object")) },
        { json: "opacity", js: "opacity", typ: 0 },
        { json: "type", js: "type", typ: r("ObjectgroupType") },
        { json: "visible", js: "visible", typ: true },
        { json: "x", js: "x", typ: 0 },
        { json: "y", js: "y", typ: 0 },
    ], false),
    "Object": o([
        { json: "height", js: "height", typ: 3.14 },
        { json: "id", js: "id", typ: 0 },
        { json: "name", js: "name", typ: r("ObjectName") },
        { json: "polygon", js: "polygon", typ: u(undefined, a(r("Poly"))) },
        { json: "rotation", js: "rotation", typ: 0 },
        { json: "type", js: "type", typ: "" },
        { json: "visible", js: "visible", typ: true },
        { json: "width", js: "width", typ: 0 },
        { json: "x", js: "x", typ: 3.14 },
        { json: "y", js: "y", typ: 3.14 },
        { json: "polyline", js: "polyline", typ: u(undefined, a(r("Poly"))) },
    ], false),
    "Poly": o([
        { json: "x", js: "x", typ: 3.14 },
        { json: "y", js: "y", typ: 3.14 },
    ], false),
    "TileProperty": o([
        { json: "name", js: "name", typ: r("PropertyName") },
        { json: "type", js: "type", typ: r("PropertyType") },
        { json: "value", js: "value", typ: "" },
    ], false),
    "LayerName": [
        "Background",
        "Background1",
        "Entities",
        "Entities1",
        "Entities2",
    ],
    "PurpleType": [
        "tilelayer",
    ],
    "FluffyType": [
        "group",
    ],
    "Draworder": [
        "index",
        "topdown",
    ],
    "ObjectName": [
        "Collider",
        "Entity",
    ],
    "ObjectgroupType": [
        "objectgroup",
    ],
    "PropertyName": [
        "name",
    ],
    "PropertyType": [
        "string",
    ],
};
