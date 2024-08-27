import { Geometry, Mesh, OGLRenderingContext, Plane, Program, Texture, Transform, Vec2, Vec3 } from "ogl";
import { Layer } from "./Layer.js";
import { Tileset } from "../misc/TiledParser.js";
import { getContours } from "../misc/contour2d.js";
import ndarray from "../misc/ndarray/ndarray.js";
import { counterHandler, radius } from "../misc/radius.js";

type TileInfo = {
    name: string,
    x: number,
    y: number,
    w: number,
    h: number,
    entity?: boolean,
    collider?: boolean
}

export class Chunk implements Layer {
    drawChunk(min: Vec2, max: Vec2, position: number[], uv: number[], tMap: { value: Texture }) {
        const chunk = this;
        const gid = this.data.find(gid => gid);
        if (!gid) {
            throw new Error("gid is undefined");
        }
        const tileset = this.tilesets.find(tileset => tileset.firstgid <= gid && gid < (tileset.firstgid + tileset.tilecount))
        if (!tileset) {
            throw new Error("tileset is undefined");
        }
        const texture = this.textures.find(texture => (texture.image as HTMLImageElement).src.endsWith(tileset.image));
        if (!texture) {
            throw new Error("texture is undefined")
        }
        const tilewidth = tileset.tilewidth;
        const tileheight = tileset.tileheight;
        const w = texture.width;
        const h = texture.height;
        tMap.value = texture;
        min.x = Math.min(chunk.x * tilewidth, min.x);
        min.y = Math.min(chunk.y * tileheight, min.y);
        max.x = Math.max((chunk.x + chunk.width) * tilewidth, max.x);
        max.y = Math.max((chunk.y + chunk.height) * tileheight, max.y);
        for (let j = 0; j < chunk.data.length; j++) {
            const gid = chunk.data[j];
            if (gid === 0 || this.tileInfoMap.get(gid)?.entity) {
                continue;
            }
            const ux = ((gid - tileset.firstgid) % tileset.columns) * (tilewidth + tileset.spacing);
            const uy = Math.floor((gid - tileset.firstgid) / tileset.columns) * (tileheight + tileset.spacing);
            const x = ((j % chunk.width) + chunk.x) * tilewidth;
            const y = (Math.floor(j / chunk.width) + chunk.y) * tileheight;

            position.push(
                (x), ((y)), (0),
                (x + tilewidth), ((y)), (0),
                (x + tilewidth), ((y + tileheight)), (0),
                (x + tilewidth), ((y + tileheight)), (0),
                (x), ((y + tileheight)), (0),
                (x), ((y)), (0)
            );
            uv.push(
                (ux) / w, 1 - (uy) / h,
                (ux + tilewidth) / w, 1 - (uy) / h,
                (ux + tilewidth) / w, 1 - (uy + tileheight) / h,
                (ux + tilewidth) / w, 1 - (uy + tileheight) / h,
                (ux) / w, 1 - (uy + tileheight) / h,
                (ux) / w, 1 - (uy) / h
            )
        }
    }
    private readonly tileInfoMap = new Map<number, TileInfo>();
    readonly node = new Transform;
    constructor(
        private readonly tilesets: Tileset[],
        private readonly textures: Texture[],
        readonly data: number[],
        readonly x: number,
        readonly y: number,
        readonly width: number,
        readonly height: number,
    ) {
        this.buildTileInfoMap();
    }
    initEntities(levelNode: Transform, gl: OGLRenderingContext, spriteVertex: string, spriteFragment: string, internalIconName: string, namesMap: Map<string, Set<string | undefined>>) {
        const chunk = this;
        for (let j = 0; j < chunk.data.length; j++) {
            const gid = chunk.data[j];
            const tile = this.tileInfoMap.get(gid);
            if (tile && tile.entity) {
                const texture = this.textures.find(texture => (texture.image as HTMLImageElement).src.indexOf(internalIconName) !== -1);

                const x = (j % chunk.width + chunk.x + 0.5) * tile.w;
                const y = (Math.floor(j / chunk.width + chunk.y) + 0.5) * tile.h;
                if (!texture) {
                    throw new Error("texture is undefined");
                }
                if (tile.name !== "Player") {
                    const w = texture.width;
                    const h = texture.height;
                    const mesh = new Mesh(gl, {
                        geometry: new Plane(gl, {
                            width: chunk.width,
                            height: chunk.height,
                        }),
                        program: new Program(gl, {
                            vertex: spriteVertex,
                            fragment: spriteFragment,
                            uniforms: {
                                tMap: { value: texture }
                            },
                            frontFace: gl.CW,
                            transparent: true
                        })
                    });
                    const uvAttr = mesh.geometry.attributes.uv;
                    uvAttr.data = new Float32Array([
                        (tile.x) / w, 1 - (tile.y + tile.h) / h,
                        (tile.x + tile.w) / w, 1 - (tile.y + tile.h) / h,
                        (tile.x) / w, 1 - (tile.y) / h,
                        (tile.x + tile.w) / w, 1 - (tile.y) / h,
                    ]);
                    mesh.geometry.updateAttribute(uvAttr);
                    mesh.name = "test" + counterHandler.counter++;
                    mesh.setParent(levelNode);
                    mesh.position.x = x;
                    mesh.position.y = -y;
                    mesh.rotation.x = Math.PI;
                    mesh.updateMatrix();
                    mesh.geometry.computeBoundingBox();
                    mesh.geometry.computeBoundingSphere();

                    const tileNameSet = namesMap.get(tile.name);
                    if (tileNameSet) {
                        tileNameSet.add(mesh.name);
                    } else {
                        const newNameSet = new Set<string>();
                        newNameSet.add(mesh.name);
                        namesMap.set(tile.name, newNameSet);
                    }
                }
            }
        }
    }
    initCollisions(levelNode: Transform, gl: OGLRenderingContext, vertex: string, fragment: string) {
        let tilewidth = 0;
        let tileheight = 0;
        const rows = this.height;
        const cols = this.width;
        const contours = (getContours(ndarray(this.data.map(x => {
            const tile = this.tileInfoMap.get(x);
            if (tile && tile.collider) {
                tilewidth = tile.w;
                tileheight = tile.h;
                return 1;
            } else {
                return 0;
            }
        }), [rows, cols]), false));
        if (!tileheight || !tilewidth) {
            return;
        }
        for (let index = 0; index < contours.length; index++) {
            const contour = contours[index];
            const position = contour.reduce((prev, point, index, arr) => {
                const p = [...point];
                p[0] = (p[0] + this.x) * tilewidth;
                p[1] = -((p[1] + this.y)) * tileheight;
                const nextP = [...arr[(index + 1) % arr.length]];
                nextP[0] = (nextP[0] + this.x) * tilewidth;
                nextP[1] = -((nextP[1] + this.y)) * tileheight;
                prev.push(...p, -radius, ...p, radius, ...nextP, radius, ...nextP, radius, ...nextP, -radius, ...p, -radius);
                return prev;
            }, []);
            const mesh = new Mesh(gl, {
                geometry: new Geometry(gl, {
                    position: { data: new Float32Array(position), size: 3 },
                }),
                program: new Program(gl, {
                    vertex,
                    fragment,
                    uniforms: {
                        uColor: {
                            value: new Vec3(0.7, 0.7, 0.7)
                        }
                    },
                    cullFace: false
                })
            });
            mesh.name = "test" + counterHandler.counter++;
            mesh.setParent(levelNode);
            mesh.geometry.computeBoundingBox();
            mesh.geometry.computeBoundingSphere();
        }
    }
    private buildTileInfoMap() {
        const tilesets = this.tilesets;
        for (const gid of this.data) {
            if (gid === 0) {
                continue;
            }
            const tileset = tilesets.find(tileset => tileset.firstgid <= gid && gid < (tileset.firstgid + tileset.tilecount));
            if (!tileset) {
                throw new Error("tileset is undefined");
            }
            const tx = (((gid - tileset.firstgid) % tileset.columns) + tileset.spacing) * tileset.tilewidth;
            const ty = (Math.floor((gid - tileset.firstgid) / tileset.columns) + tileset.spacing) * tileset.tileheight;
            const tileDef = tileset.tiles?.find(t => t.id === (gid - tileset.firstgid));
            if (!tileDef) {
                continue;
            }
            const name = tileDef.properties?.find(prop => prop.name === "name")?.value;
            if (!name) {
                throw new Error("name is undefined");
            }
            this.tileInfoMap.set(gid, {
                name,
                x: tx,
                y: ty,
                w: (tileset.tilewidth),
                h: (tileset.tileheight),
                entity: tileDef.objectgroup.objects?.find(o => o.name === "Entity") ? true : false,
                collider: tileDef.objectgroup.objects?.find(o => o.name === "Collider") ? true : false,
            });
        }
    }
}