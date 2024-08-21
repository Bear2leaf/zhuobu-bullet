import { Box, Camera, Geometry, Mat4, Mesh, OGLRenderingContext, Plane, Program, RenderTarget, Texture, Transform, Triangle, Vec3, Vec4 } from "ogl";
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
            for (let i = 0; i < layer.chunks.length; i++) {
                const chunk = layer.chunks[i];
                for (let j = 0; j < chunk.data.length; j++) {
                    const gid = chunk.data[j];
                    if (gid === 0) {
                        continue;
                    }
                    const ux = (((gid - tileset.firstgid) % tileset.columns) + tileset.spacing) * tileset.tilewidth;
                    const uy = (Math.floor((gid - tileset.firstgid) / tileset.columns) + tileset.spacing) * tileset.tileheight;
                    const x = (j % chunk.width) * gridSize + chunk.x;
                    const y = Math.floor(j / chunk.width) * gridSize + chunk.y;
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
                left: 0.1,
                right: layer.width * tileset.tilewidth,
                top: layer.height * tileset.tileheight,
                bottom: 0.1,
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
        console.log(this.current)
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
            const renderTarget = new RenderTarget(gl, {
                width: level.layers[0].width * gridSize,
                height: level.layers[0].height * gridSize,
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
                            if (gid !== 0) {
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
                                const tile = {
                                    name,
                                    x: tx,
                                    y: ty,
                                    w: tileset.tilewidth,
                                    h: tileset.tileheight
                                }
                                const entityWorldX = (chunk.x || 0) + chunk.width * (0.5);
                                const entityWorldY = -(chunk.y || 0) - chunk.height * (0.5);
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
                                    mesh.position.x = entityWorldX;
                                    mesh.position.y = entityWorldY;
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
            }

            for (let index = 0; index < this.renderTargets.length; index++) {
                const layer = level.layers[index];
                const renderTarget = this.renderTargets[index];
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
                const offsetX = (layer.x + layer.width / 2);
                const offsetY = -(layer.y + layer.height / 2);
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

    }
    request(scene: Transform) {
        const tiledData = this.tiledData;
        if (!tiledData) {
            throw new Error("tiledData is undefined");
        }
        const gridSize = tiledData.tilewidth;
        const levels = tiledData.layers;
        const min = new Vec3();
        const max = new Vec3();
        this.radius = 0;
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
                        const x = (j % chunk.width) * gridSize + chunk.x;
                        const y = Math.floor(j / chunk.width) * gridSize + chunk.y;
                        const tileset = tiledData.tilesets.find(tileset => tileset.firstgid <= gid && gid < (tileset.firstgid + tileset.tilecount))
                        if (!tileset) {
                            throw new Error("tileset is undefined");
                        }
                        const tileDef = tileset.tiles?.find(t => t.id === (gid - tileset.firstgid));
                        if (!tileDef) {
                            throw new Error("tileDef is undefined");
                        }
                        const name = tileDef.properties.find(prop => prop.name === "name")?.value;
                        const entityWorldX = (chunk.x + x) + chunk.width * (0.5);
                        const entityWorldY = -(chunk.y + y) - chunk.height * (0.5);
                        if (name === "Player") {
                            this.onaddball && this.onaddball(new Mat4().translate(new Vec3(entityWorldX, entityWorldY, 0)))
                        }
                    }
                }
            }
        }
        scene.children.forEach((child, index) => (index === 0 || index === (this.current + 1)) ? (child.visible = true) : (child.visible = false))
        for (const child of scene.children[this.current + 1].children) {
            const mesh = child as Mesh;
            const attributeData = mesh.geometry.getPosition().data;
            const indices = mesh.geometry.attributes.index?.data;
            this.onaddmesh && this.onaddmesh(mesh.name, mesh.matrix, [...attributeData || []], [...indices || []], { entity: this.entityIdSet.has(mesh.name) })
            this.radius = Math.max(this.radius, mesh.geometry.bounds.radius);
            const meshMin = mesh.geometry.bounds.min;
            const meshMax = mesh.geometry.bounds.max;
            min.x = Math.min(meshMin.x, min.x);
            min.y = Math.min(meshMin.y, min.y);
            min.z = Math.min(meshMin.z, min.z);
            max.x = Math.max(meshMax.x, max.x);
            max.y = Math.max(meshMax.y, max.y);
            max.z = Math.max(meshMax.z, max.z);
        }
        this.center.copy(new Vec3(max.x + min.x, max.y + min.y, 0));
    }
    getRadius(): number {
        return this.radius;
    }
    isMazeMode(): boolean {
        return true;
    }
}