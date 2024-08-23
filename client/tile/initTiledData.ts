import { Geometry, Mesh, OGLRenderingContext, Plane, Program, RenderTarget, Sphere, Texture, Transform, Vec2, Vec3 } from "ogl";
import { Tiled } from "../misc/TiledParser.js";
import { radius } from "../misc/radius.js";
import { getContours } from "../misc/contour2d.js";
import ndarray from "../misc/ndarray/ndarray.js";
import { drawLayer } from "./drawLayer.js";
let counter = 0;
export function initTiledData(
    tiledData: Tiled,
    gl: OGLRenderingContext,
    scene: Transform,
    vertex: string,
    fragment: string,
    spriteVertex: string,
    spriteFragment: string,
    ballVertex: string,
    ballFragment: string,
    renderTargets: RenderTarget[],
    textures: Texture[],
    collections: Transform[],
    internalIconName: string,
    exitMeshNameSet: Set<string | undefined>,
    pickaxeMeshNameSet: Set<string | undefined>,
    rockMeshNameSet: Set<string | undefined>,
) {
    const program = new Program(gl, {
        vertex: ballVertex,
        fragment: ballFragment,
        uniforms: {
            uColor: {
                value: new Vec3(0.7, 0.2, 0.7)
            }
        }
    });
    const geometry = new Sphere(gl, { radius });
    const mesh = new Mesh(gl, {
        geometry,
        program,
    });
    mesh.setParent(scene);
    mesh.name = "Ball"
    if (!tiledData) {
        throw new Error("tiledData is undefined");
    }
    const gridSize = tiledData.tilewidth;
    const levels = tiledData.layers;
    for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
        const level = levels[levelIndex];
        const min = level.layers.reduce((lprev, lcurr) => {
            const min = lcurr.chunks.reduce((prev, curr) => {
                prev.x = Math.min(curr.x, prev.x);
                prev.y = Math.min(curr.y, prev.y);
                return prev;
            }, new Vec2);
            lprev.x = Math.min(min.x, lprev.x);
            lprev.y = Math.min(min.y, lprev.y);
            return lprev;
        }, new Vec2)
        const max = level.layers.reduce((lprev, lcurr) => {
            const max = lcurr.chunks.reduce((prev, curr) => {
                prev.x = Math.max(curr.x + curr.width, prev.x);
                prev.y = Math.max(curr.y + curr.height, prev.y);
                return prev;
            }, new Vec2);
            lprev.x = Math.max(max.x, lprev.x);
            lprev.y = Math.max(max.y, lprev.y);
            return lprev;
        }, new Vec2);
        const width = (max.x - min.x) * gridSize;
        const height = (max.y - min.y) * gridSize;
        const renderTarget = new RenderTarget(gl, {
            width,
            height,
            minFilter: gl.NEAREST,
            magFilter: gl.NEAREST,
            depth: false
        });
        renderTargets.push(renderTarget);
    }
    drawLayer(tiledData, "Background", textures, renderTargets, gl, spriteVertex, spriteFragment);
    drawLayer(tiledData, "Collisions", textures, renderTargets, gl, spriteVertex, spriteFragment);
    for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
        const level = levels[levelIndex];
        const levelNode = new Transform();
        levelNode.name = level.name;
        levelNode.setParent(scene);
        collections.push(levelNode);
        const layerInstances = level.layers || [];
        for (const layer of layerInstances) {
            if (layer.name === "Collisions") {
                for (let i = 0; i < layer.chunks.length; i++) {
                    const chunk = layer.chunks[i];
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
                        mesh.name = "test" + counter++;
                        mesh.setParent(levelNode);
                        mesh.geometry.computeBoundingBox();
                        mesh.geometry.computeBoundingSphere();
                    }
                }
            } else if (layer.name === "Entities") {
                for (let i = 0; i < layer.chunks.length; i++) {
                    const chunk = layer.chunks[i];
                    for (let j = 0; j < chunk.data.length; j++) {
                        const gid = chunk.data[j];
                        if (gid === 0) {
                            continue;
                        }
                        const tileset = tiledData.tilesets.find(tileset => tileset.firstgid <= gid && gid < (tileset.firstgid + tileset.tilecount))
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
                        const x = (j % chunk.width + chunk.x) * gridSize + (0.5 * tileset.tilewidth);
                        const y = Math.floor(j / chunk.width + chunk.y) * gridSize + (0.5 * tileset.tileheight);
                        const tile = {
                            name,
                            x: tx,
                            y: ty,
                            w: (tileset.tilewidth + tileset.spacing),
                            h: (tileset.tileheight + tileset.spacing)
                        }
                        if (tile.name === "Exit" || tile.name === "Rock" || tile.name === "Pickaxe" || tile.name === "DirDown") {
                            const texture = textures.find(texture => (texture.image as HTMLImageElement).src.indexOf(internalIconName) !== -1)

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
                            ])
                            mesh.geometry.updateAttribute(uvAttr);
                            mesh.name = "test" + counter++;
                            mesh.setParent(levelNode)
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
            }
        }

        const renderTarget = renderTargets[levelIndex];
        const mesh = new Mesh(gl, {
            geometry: new Plane(gl, {
                width: renderTarget.width,
                height: renderTarget.height,
            }),
            program: new Program(gl, {
                vertex: spriteVertex,
                fragment: spriteFragment,
                uniforms: {
                    tMap: { value: renderTarget.texture }
                },
                frontFace: gl.CW,
                transparent: true
            })
        });
        mesh.name = "test" + counter++;
        const min = level.layers.reduce((lprev, lcurr) => {
            const min = lcurr.chunks.reduce((prev, curr) => {
                prev.x = Math.min(curr.x, prev.x);
                prev.y = Math.min(curr.y, prev.y);
                return prev;
            }, new Vec2);
            lprev.x = Math.min(min.x, lprev.x);
            lprev.y = Math.min(min.y, lprev.y);
            return lprev;
        }, new Vec2)
        const offsetX = (level.x + (min.x * gridSize) + renderTarget.width / 2);
        const offsetY = -(level.y + (min.y * gridSize) + renderTarget.height / 2);
        mesh.position.x = offsetX;
        mesh.position.y = offsetY;
        mesh.rotation.x = Math.PI;
        mesh.position.z = -radius;
        mesh.updateMatrix()
        mesh.setParent(levelNode);
        mesh.geometry.computeBoundingBox();
        mesh.geometry.computeBoundingSphere();
        {
            const mesh = new Mesh(gl, {
                geometry: new Plane(gl, {
                    width: renderTarget.width,
                    height: renderTarget.height,
                }),
                program: new Program(gl, {
                    vertex,
                    fragment,
                    uniforms: {
                        uColor: {
                            value: new Vec3(0.4, 0.4, 0.4)
                        }
                    }
                })
            });
            mesh.name = "test" + counter++;
            mesh.setParent(levelNode)
            mesh.position.x = offsetX;
            mesh.position.y = offsetY;
            mesh.position.z = radius;
            mesh.visible = false;
            mesh.updateMatrix();
            mesh.geometry.computeBoundingBox();
            mesh.geometry.computeBoundingSphere();
        }
        {
            const mesh = new Mesh(gl, {
                geometry: new Plane(gl, {
                    width: renderTarget.width,
                    height: renderTarget.height,
                }),
                program: new Program(gl, {
                    vertex,
                    fragment,
                    uniforms: {
                        uColor: {
                            value: new Vec3(0.4, 0.4, 0.4)
                        }
                    }
                })
            });
            mesh.name = "test" + counter++;
            mesh.setParent(levelNode)
            mesh.position.x = offsetX;
            mesh.position.y = offsetY;
            mesh.position.z = -radius;
            mesh.visible = false;
            mesh.updateMatrix();
            mesh.geometry.computeBoundingBox();
            mesh.geometry.computeBoundingSphere();
        }
    }

}