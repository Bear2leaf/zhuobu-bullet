import { Box, Camera, Geometry, Mat4, Mesh, OGLRenderingContext, Plane, Program, RenderTarget, Sphere, Texture, Transform, Triangle, Vec2, Vec3, Vec4 } from "ogl";
import Level from "./Level.js";
import { getContours } from "../misc/contour2d.js";
import ndarray from "../misc/ndarray/ndarray.js";
import { Convert, Tiled } from "../misc/TiledParser.js";
import { radius } from "../misc/radius.js";

export default class TiledLevel implements Level {

    private fragment: string = "";
    private vertex: string = "";
    private spriteFragment: string = "";
    private spriteVertex: string = "";
    private tiledData?: Tiled;
    private radius = 0;
    private counter = 0;
    private current = 0;
    private readonly internalIconName = "finalbossblues-icons_full_16";
    private readonly center = new Vec3();
    private readonly textures: Texture[] = [];
    private readonly renderTargets: RenderTarget[] = [];
    private readonly collections: Transform[] = [];
    private readonly entityIdSet = new Set<string | undefined>();
    onaddmesh?: (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>) => void;
    onaddball?: (transform: number[]) => void;
    constructor(private readonly gl: OGLRenderingContext) {
    }
    getIndex() {
        return this.current;
    }
    getCenter(): Vec3 {
        return this.center;
    }

    drawLayer(identifer: string) {
        const tiledData = this.tiledData;
        if (!tiledData) {
            throw new Error("tiledData is undefined");
        }
        const levels = tiledData.layers;
        for (let index = 0; index < levels.length; index++) {
            const level = levels[index];
            const layer = level.layers?.find(inst => inst.name === identifer);
            const gid = layer?.chunks[0].data.find(gid => gid);
            if (!gid) {
                throw new Error("gid is undefined");
            }
            const tileset = tiledData.tilesets.find(tileset => tileset.firstgid <= gid && gid < (tileset.firstgid + tileset.tilecount))
            if (!tileset) {
                throw new Error("tileset is undefined");
            }
            if (!layer) {
                throw new Error("parsing error")
            }
            const texture = this.textures.find(texture => (texture.image as HTMLImageElement).src.endsWith(tileset.image));
            if (!texture) {
                throw new Error("texture is undefined")
            }
            const w = texture.width;
            const h = texture.height;
            const renderTarget = this.renderTargets[index];
            const position = new Array;
            const uv = new Array;
            const gridSize = tiledData.tilewidth;
            const min = new Vec2();
            const max = new Vec2();
            for (let i = 0; i < layer.chunks.length; i++) {
                const chunk = layer.chunks[i];
                min.x = Math.min(chunk.x, min.x);
                min.y = Math.min(chunk.y, min.y);
                max.x = Math.max(chunk.x + chunk.width, max.x);
                max.y = Math.max(chunk.y + chunk.height, max.y);
                for (let j = 0; j < chunk.data.length; j++) {
                    const gid = chunk.data[j];
                    if (gid === 0) {
                        continue;
                    }
                    const ux = ((gid - tileset.firstgid) % tileset.columns) * (tileset.tilewidth + tileset.spacing);
                    const uy = Math.floor((gid - tileset.firstgid) / tileset.columns) * (tileset.tileheight + tileset.spacing);
                    const x = ((j % chunk.width) + chunk.x) * gridSize;
                    const y = (Math.floor(j / chunk.width) + chunk.y) * gridSize;

                    position.push(x);
                    position.push((y));
                    position.push(0);
                    position.push(x + gridSize);
                    position.push((y));
                    position.push(0);
                    position.push(x + gridSize);
                    position.push((y + gridSize));
                    position.push(0);
                    position.push(x + gridSize);
                    position.push((y + gridSize));
                    position.push(0);
                    position.push(x);
                    position.push((y + gridSize));
                    position.push(0);
                    position.push(x);
                    position.push((y));
                    position.push(0);
                    uv.push((ux) / w);
                    uv.push(1 - (uy) / h);
                    uv.push((ux + gridSize) / w);
                    uv.push(1 - (uy) / h);
                    uv.push((ux + gridSize) / w);
                    uv.push(1 - (uy + gridSize) / h);
                    uv.push((ux + gridSize) / w);
                    uv.push(1 - (uy + gridSize) / h);
                    uv.push((ux) / w);
                    uv.push(1 - (uy + gridSize) / h);
                    uv.push((ux) / w);
                    uv.push(1 - (uy) / h);
                }
            }
            const gl = this.gl;
            const spriteVertex = this.spriteVertex;
            const spriteFragment = this.spriteFragment;
            //MAGIC!!! this 0.1 offset make REAL PIXEL PERFECT
            const camera = new Camera(gl, {
                left: 0.1 + min.x * tileset.tilewidth,
                right: max.x * tileset.tilewidth,
                top: max.y * tileset.tileheight,
                bottom: 0.1 + min.y * tileset.tileheight,
                near: 0,
                far: -1
            })
            const scene = new Mesh(gl, {
                geometry: new Geometry(gl, {
                    position: {
                        size: 3,
                        data: new Float32Array(position)
                    },
                    uv: {
                        size: 2,
                        data: new Float32Array(uv)
                    },
                }),
                program: new Program(gl, {
                    vertex: spriteVertex,
                    fragment: spriteFragment,
                    uniforms: {
                        tMap: { value: texture }
                    },
                    transparent: true
                })
            });
            gl.renderer.render({
                scene,
                camera,
                target: renderTarget,
                clear: false
            })
        }
    }
    async load() {

        this.vertex = await (await fetch("resources/glsl/level.vert.sk")).text();
        this.fragment = await (await fetch("resources/glsl/level.frag.sk")).text();
        this.spriteVertex = this.spriteVertex = await (await fetch("resources/glsl/sprite.vert.sk")).text();
        this.spriteFragment = this.spriteFragment = await (await fetch("resources/glsl/sprite.frag.sk")).text();
        const tiledJsonText = await (await fetch("resources/tiled/starter.json")).text();
        this.tiledData = Convert.toTiled(tiledJsonText);
        const gl = this.gl;
        for await (const tileset of this.tiledData.tilesets) {
            if (tileset.image) {
                await new Promise((resoive) => {
                    const image = new Image();
                    image.onload = () => {
                        this.textures.push(new Texture(gl, {
                            image,
                            width: image.width,
                            height: image.height,
                            magFilter: gl.NEAREST,
                            minFilter: gl.NEAREST
                        }));
                        resoive(void (0));
                    };
                    image.src = `resources/tiled/${tileset.image}`;
                })
            }
        }
    }
    updateLevel(reverse: boolean) {
        if (reverse) {
            this.current = this.current === 0 ? (this.collections.length - 1) : (this.current - 1)
        } else {
            this.current = (this.current + 1) % this.collections.length;
        }
    }

    init(scene: Transform) {
        const gl = this.gl;
        const tiledData = this.tiledData;
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
            console.log(min, max, width, height)
            const renderTarget = new RenderTarget(gl, {
                width,
                height,
                minFilter: gl.NEAREST,
                magFilter: gl.NEAREST,
                depth: false
            });
            this.renderTargets.push(renderTarget);
        }
        this.drawLayer("Background");
        this.drawLayer("Collisions");
        for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
            const level = levels[levelIndex];
            const levelNode = new Transform();
            levelNode.name = level.name;
            levelNode.setParent(scene);
            this.collections.push(levelNode);
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
                                    vertex: this.vertex,
                                    fragment: this.fragment,
                                    uniforms: {
                                        uColor: {
                                            value: new Vec3(0.7, 0.7, 0.7)
                                        }
                                    },
                                    cullFace: false
                                })
                            });
                            mesh.name = "test" + this.counter++;
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
                            if (tile.name === "Exit") {
                                const texture = this.textures.find(texture => (texture.image as HTMLImageElement).src.indexOf(this.internalIconName) !== -1)

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
                                        vertex: this.spriteVertex,
                                        fragment: this.spriteFragment,
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
                                mesh.name = "test" + this.counter++;
                                mesh.setParent(levelNode)
                                mesh.position.x = x;
                                mesh.position.y = -y;
                                mesh.position.z = -radius + 0.01;
                                mesh.rotation.x = Math.PI;
                                mesh.updateMatrix();
                                mesh.geometry.computeBoundingBox();
                                mesh.geometry.computeBoundingSphere();
                                this.entityIdSet.add(mesh.name);
                            }
                        }

                    }
                }
            }

            const renderTarget = this.renderTargets[levelIndex];
            const mesh = new Mesh(gl, {
                geometry: new Plane(gl, {
                    width: renderTarget.width,
                    height: renderTarget.height,
                }),
                program: new Program(gl, {
                    vertex: this.spriteVertex,
                    fragment: this.spriteFragment,
                    uniforms: {
                        tMap: { value: renderTarget.texture }
                    },
                    frontFace: gl.CW,
                    transparent: true
                })
            });
            mesh.name = "test" + this.counter++;
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
                        vertex: this.vertex,
                        fragment: this.fragment,
                        uniforms: {
                            uColor: {
                                value: new Vec3(0.4, 0.4, 0.4)
                            }
                        }
                    })
                });
                mesh.name = "test" + this.counter++;
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
                        vertex: this.vertex,
                        fragment: this.fragment,
                        uniforms: {
                            uColor: {
                                value: new Vec3(0.4, 0.4, 0.4)
                            }
                        }
                    })
                });
                mesh.name = "test" + this.counter++;
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
    request(scene: Transform) {
        const tiledData = this.tiledData;
        if (!tiledData) {
            throw new Error("tiledData is undefined");
        }
        const gridSize = tiledData.tilewidth;
        const levels = tiledData.layers;
        const level = levels[this.current];
        const layerInstances = level.layers;
        for (const layerInstance of layerInstances) {
            if (layerInstance.name === "Entities") {
                for (const chunk of layerInstance.chunks) {
                    for (let j = 0; j < chunk.data.length; j++) {
                        const gid = chunk.data[j];
                        if (gid === 0) {
                            continue;
                        }
                        const x = (j % chunk.width) * gridSize + chunk.x * gridSize;
                        const y = Math.floor(j / chunk.width) * gridSize + chunk.y * gridSize;
                        const tileset = tiledData.tilesets.find(tileset => tileset.firstgid <= gid && gid < (tileset.firstgid + tileset.tilecount))
                        if (!tileset) {
                            throw new Error("tileset is undefined");
                        }
                        const tileDef = tileset.tiles?.find(t => t.id === (gid - tileset.firstgid));
                        if (!tileDef) {
                            throw new Error("tileDef is undefined");
                        }
                        const name = tileDef.properties.find(prop => prop.name === "name")?.value;
                        const entityWorldX = x + chunk.width * 0.5;
                        const entityWorldY = -y - chunk.height * 0.5;
                        if (name === "Player") {
                            this.onaddball && this.onaddball(new Mat4().translate(new Vec3(entityWorldX, entityWorldY, 0)))
                        }
                    }
                }
            }
        }
        scene.children.forEach((child, index) => (index === 0 || index === (this.current + 1)) ? (child.visible = true) : (child.visible = false))
        const min = new Vec3(Infinity, Infinity, 0)
        const max = new Vec3(-Infinity, -Infinity, 0);
        for (const child of scene.children[this.current + 1].children) {
            const mesh = child as Mesh;
            const attributeData = mesh.geometry.getPosition().data;
            const indices = mesh.geometry.attributes.index?.data;
            this.onaddmesh && this.onaddmesh(mesh.name, mesh.matrix, [...attributeData || []], [...indices || []], { entity: this.entityIdSet.has(mesh.name) })
            if (!(mesh.geometry instanceof Plane || mesh.geometry instanceof Sphere)) {
                const meshMin = mesh.geometry.bounds.min;
                const meshMax = mesh.geometry.bounds.max;
                min.x = Math.min(min.x, meshMin.x);
                min.y = Math.min(min.y, meshMin.y);
                max.x = Math.max(max.x, meshMax.x);
                max.y = Math.max(max.y, meshMax.y);
            }
        }
        this.radius = max.distance(min) / 2;
        this.center.copy(max.add(min).multiply(0.5))
    }
    getRadius(): number {
        return this.radius;
    }
    isMazeMode(): boolean {
        return true;
    }
}