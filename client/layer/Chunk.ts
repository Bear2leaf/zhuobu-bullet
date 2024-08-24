import { Geometry, Mesh, OGLRenderingContext, Plane, Program, Texture, Transform, Vec2, Vec3 } from "ogl";
import { Layer } from "./Layer.js";
import { Tileset } from "../misc/TiledParser.js";
import { getContours } from "../misc/contour2d.js";
import ndarray from "../misc/ndarray/ndarray.js";
import { counterHandler, radius } from "../misc/radius.js";

export class Chunk implements Layer {
    initEntities(levelNode: Transform, tilesets: Tileset[], textures: Texture[], gl: OGLRenderingContext, internalIconName: string, spriteVertex: string, spriteFragment: string, exitMeshNameSet: Set<string | undefined>, pickaxeMeshNameSet: Set<string | undefined>, rockMeshNameSet: Set<string | undefined>) {
        const chunk = this;
        for (let j = 0; j < chunk.data.length; j++) {
            const gid = chunk.data[j];
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
                throw new Error("tileDef is undefined");
            }
            const name = tileDef.properties.find(prop => prop.name === "name")?.value;
            if (!name) {
                throw new Error("name is undefined");
            }
            const gridSize = tileset.tilewidth;
            const x = (j % chunk.width + chunk.x) * gridSize + (0.5 * tileset.tilewidth);
            const y = Math.floor(j / chunk.width + chunk.y) * gridSize + (0.5 * tileset.tileheight);
            const tile = {
                name,
                x: tx,
                y: ty,
                w: (tileset.tilewidth + tileset.spacing),
                h: (tileset.tileheight + tileset.spacing)
            };
            if (tile.name === "Exit" || tile.name === "Rock" || tile.name === "Pickaxe" || tile.name === "DirDown") {
                const texture = textures.find(texture => (texture.image as HTMLImageElement).src.indexOf(internalIconName) !== -1);

                if (!texture) {
                    throw new Error("texture is undefined");
                }
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
                if (tile.name === "Exit") {
                    exitMeshNameSet.add(mesh.name);
                } else if (tile.name === "Pickaxe") {
                    pickaxeMeshNameSet.add(mesh.name);
                } else if (tile.name === "Rock") {
                    rockMeshNameSet.add(mesh.name);
                } else if (tile.name === "DirDown") {
                    // rockMeshNameSet.add(mesh.name);
                } else {
                    throw new Error("error tile name");
                }

            }
        }
    }
    initCollisions(gridSize: number, levelNode: Transform, gl: OGLRenderingContext, vertex: string, fragment: string) {
        const chunk = this;
        const cw = chunk.width;
        const ch = chunk.height;
        const chunkData = new Array(ch);
        for (let ci = 0; ci < chunkData.length; ci++) {
            chunkData[ci] = new Array(cw);
            for (let cj = 0; cj < chunkData[ci].length; cj++) {
                chunkData[ci][cj] = chunk.data[ci * cw + cj];
            }
        }
        const collisions = chunk;
        const rows = collisions.height;
        const cols = collisions.width;
        const contours = (getContours(ndarray(collisions.data.map(x => x === 0 ? 0 : 1), [rows, cols]), false));
        for (let index = 0; index < contours.length; index++) {
            const contour = contours[index];
            const position = contour.reduce((prev, point, index, arr) => {
                const p = [...point];
                p[0] = (p[0] + chunk.x) * gridSize;
                p[1] = -((p[1] + chunk.y)) * gridSize;
                const nextP = [...arr[(index + 1) % arr.length]];
                nextP[0] = (nextP[0] + chunk.x) * gridSize;
                nextP[1] = -((nextP[1] + chunk.y)) * gridSize;
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
    readonly node: Transform = new Transform;
    constructor(
        readonly data: number[],
        readonly x: number,
        readonly y: number,
        readonly width: number,
        readonly height: number,
    ) {
    }
}