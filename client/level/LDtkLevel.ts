import { Box, Camera, Geometry, Mat4, Mesh, OGLRenderingContext, Plane, Program, RenderTarget, Texture, Transform, Triangle, Vec3, Vec4 } from "ogl";
import Level from "./Level.js";
import { getContours } from "../misc/contour2d.js";
import ndarray from "../misc/ndarray/ndarray.js";
import { Convert, LDtk } from "../misc/LDtkParser.js";
import { radius } from "../misc/radius.js";

export default class LDtkLevel implements Level {

    private fragment: string = "";
    private vertex: string = "";
    private spriteFragment: string = "";
    private spriteVertex: string = "";
    private ldtkData?: LDtk;
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

        const levels = this.ldtkData?.levels;
        if (!levels) {
            throw new Error("levels is undefined")
        }
        for (let index = 0; index < levels.length; index++) {
            const level = levels[index];
            const layerInstance = level.layerInstances?.find(inst => inst.__identifier === identifer);
            if (!layerInstance) {
                throw new Error("parsing error")
            }
            const texture = this.textures.find(texture => layerInstance.__tilesetRelPath && (texture.image as HTMLImageElement).src.endsWith(layerInstance.__tilesetRelPath));
            if (!texture) {
                throw new Error("texture is undefined")
            }
            const w = texture.width;
            const h = texture.height;
            const renderTarget = this.renderTargets[index];
            const position = new Float32Array(layerInstance.autoLayerTiles.length * 6 * 3);
            const uv = new Float32Array(layerInstance.autoLayerTiles.length * 6 * 2);
            const gridSize = layerInstance.__gridSize;
            for (let index = 0; index < layerInstance.autoLayerTiles.length; index++) {
                const tileInstance = layerInstance.autoLayerTiles[index];
                position[index * 3 * 6 + 0 + 3 * 0] = tileInstance.px[0];
                position[index * 3 * 6 + 1 + 3 * 0] = (tileInstance.px[1]);
                position[index * 3 * 6 + 2 + 3 * 0] = 0;
                position[index * 3 * 6 + 0 + 3 * 1] = tileInstance.px[0] + gridSize;
                position[index * 3 * 6 + 1 + 3 * 1] = (tileInstance.px[1]);
                position[index * 3 * 6 + 2 + 3 * 1] = 0;
                position[index * 3 * 6 + 0 + 3 * 2] = tileInstance.px[0] + gridSize;
                position[index * 3 * 6 + 1 + 3 * 2] = (tileInstance.px[1] + gridSize);
                position[index * 3 * 6 + 2 + 3 * 2] = 0;
                position[index * 3 * 6 + 0 + 3 * 3] = tileInstance.px[0] + gridSize;
                position[index * 3 * 6 + 1 + 3 * 3] = (tileInstance.px[1] + gridSize);
                position[index * 3 * 6 + 2 + 3 * 3] = 0;
                position[index * 3 * 6 + 0 + 3 * 4] = tileInstance.px[0];
                position[index * 3 * 6 + 1 + 3 * 4] = (tileInstance.px[1] + gridSize);
                position[index * 3 * 6 + 2 + 3 * 4] = 0;
                position[index * 3 * 6 + 0 + 3 * 5] = tileInstance.px[0];
                position[index * 3 * 6 + 1 + 3 * 5] = (tileInstance.px[1]);
                position[index * 3 * 6 + 2 + 3 * 5] = 0;
                const ux = tileInstance.src[0];
                const uy = tileInstance.src[1];
                if (tileInstance.f === 0b00) {
                    uv[index * 2 * 6 + 0 + 2 * 0] = (ux) / w;
                    uv[index * 2 * 6 + 1 + 2 * 0] = 1 - (uy) / h;
                    uv[index * 2 * 6 + 0 + 2 * 1] = (ux + gridSize) / w;
                    uv[index * 2 * 6 + 1 + 2 * 1] = 1 - (uy) / h;
                    uv[index * 2 * 6 + 0 + 2 * 2] = (ux + gridSize) / w;
                    uv[index * 2 * 6 + 1 + 2 * 2] = 1 - (uy + gridSize) / h;
                    uv[index * 2 * 6 + 0 + 2 * 3] = (ux + gridSize) / w;
                    uv[index * 2 * 6 + 1 + 2 * 3] = 1 - (uy + gridSize) / h;
                    uv[index * 2 * 6 + 0 + 2 * 4] = (ux) / w;
                    uv[index * 2 * 6 + 1 + 2 * 4] = 1 - (uy + gridSize) / h;
                    uv[index * 2 * 6 + 0 + 2 * 5] = (ux) / w;
                    uv[index * 2 * 6 + 1 + 2 * 5] = 1 - (uy) / h;
                } else if (tileInstance.f === 0b01) {
                    // flip x
                    uv[index * 2 * 6 + 0 + 2 * 0] = (ux + gridSize) / w;
                    uv[index * 2 * 6 + 1 + 2 * 0] = 1 - (uy) / h;
                    uv[index * 2 * 6 + 0 + 2 * 1] = (ux) / w;
                    uv[index * 2 * 6 + 1 + 2 * 1] = 1 - (uy) / h;
                    uv[index * 2 * 6 + 0 + 2 * 2] = (ux) / w;
                    uv[index * 2 * 6 + 1 + 2 * 2] = 1 - (uy + gridSize) / h;
                    uv[index * 2 * 6 + 0 + 2 * 3] = (ux) / w;
                    uv[index * 2 * 6 + 1 + 2 * 3] = 1 - (uy + gridSize) / h;
                    uv[index * 2 * 6 + 0 + 2 * 4] = (ux + gridSize) / w;
                    uv[index * 2 * 6 + 1 + 2 * 4] = 1 - (uy + gridSize) / h;
                    uv[index * 2 * 6 + 0 + 2 * 5] = (ux + gridSize) / w;
                    uv[index * 2 * 6 + 1 + 2 * 5] = 1 - (uy) / h;
                } else if (tileInstance.f === 0b10) {
                    // flip y
                    uv[index * 2 * 6 + 0 + 2 * 0] = (ux) / w;
                    uv[index * 2 * 6 + 1 + 2 * 0] = 1 - (uy + gridSize) / h;
                    uv[index * 2 * 6 + 0 + 2 * 1] = (ux + gridSize) / w;
                    uv[index * 2 * 6 + 1 + 2 * 1] = 1 - (uy + gridSize) / h;
                    uv[index * 2 * 6 + 0 + 2 * 2] = (ux + gridSize) / w;
                    uv[index * 2 * 6 + 1 + 2 * 2] = 1 - (uy) / h;
                    uv[index * 2 * 6 + 0 + 2 * 3] = (ux + gridSize) / w;
                    uv[index * 2 * 6 + 1 + 2 * 3] = 1 - (uy) / h;
                    uv[index * 2 * 6 + 0 + 2 * 4] = (ux) / w;
                    uv[index * 2 * 6 + 1 + 2 * 4] = 1 - (uy) / h;
                    uv[index * 2 * 6 + 0 + 2 * 5] = (ux) / w;
                    uv[index * 2 * 6 + 1 + 2 * 5] = 1 - (uy + gridSize) / h;
                } else if (tileInstance.f === 0b11) {
                    // flip xy
                    uv[index * 2 * 6 + 0 + 2 * 0] = (ux + gridSize) / w;
                    uv[index * 2 * 6 + 1 + 2 * 0] = 1 - (uy + gridSize) / h;
                    uv[index * 2 * 6 + 0 + 2 * 1] = (ux) / w;
                    uv[index * 2 * 6 + 1 + 2 * 1] = 1 - (uy + gridSize) / h;
                    uv[index * 2 * 6 + 0 + 2 * 2] = (ux) / w;
                    uv[index * 2 * 6 + 1 + 2 * 2] = 1 - (uy) / h;
                    uv[index * 2 * 6 + 0 + 2 * 3] = (ux) / w;
                    uv[index * 2 * 6 + 1 + 2 * 3] = 1 - (uy) / h;
                    uv[index * 2 * 6 + 0 + 2 * 4] = (ux + gridSize) / w;
                    uv[index * 2 * 6 + 1 + 2 * 4] = 1 - (uy) / h;
                    uv[index * 2 * 6 + 0 + 2 * 5] = (ux + gridSize) / w;
                    uv[index * 2 * 6 + 1 + 2 * 5] = 1 - (uy + gridSize) / h;
                } else {
                    throw new Error("unsupport filp param: " + tileInstance.f)
                }
            }
            const gl = this.gl;
            const spriteVertex = this.spriteVertex;
            const spriteFragment = this.spriteFragment;
            //MAGIC!!! this 0.1 offset make REAL PIXEL PERFECT
            const camera = new Camera(gl, {
                left: 0.1,
                right: renderTarget.width,
                top: renderTarget.height,
                bottom: 0.1,
                near: 0,
                far: -1
            })

            const scene = new Mesh(gl, {
                geometry: new Geometry(gl, {
                    position: {
                        size: 3,
                        data: position
                    },
                    uv: {
                        size: 2,
                        data: uv
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
        const ldtkJsonText = await (await fetch("resources/ldtk/starter.json")).text();
        this.ldtkData = Convert.toLDtk(ldtkJsonText);
        const gl = this.gl;
        for await (const tileset of this.ldtkData.defs.tilesets) {
            if (tileset.relPath) {
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
                    image.src = `resources/ldtk/${tileset.relPath}`;
                })
            } else if (tileset.identifier === "Internal_Icons") {
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
                    image.src = `resources/ldtk/atlas/${this.internalIconName}.png`;
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
        const levels = this.ldtkData?.levels;
        if (!levels) {
            throw new Error("levels is undefined");
        }
        for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
            const level = levels[levelIndex];
            const renderTarget = new RenderTarget(gl, {
                width: level.pxWid,
                height: level.pxHei,
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
            levelNode.name = level.identifier;
            levelNode.setParent(scene);
            this.collections.push(levelNode);
            const layerInstances = level.layerInstances || [];
            for (const layerInstance of layerInstances) {
                if (layerInstance.__identifier === "Collisions") {
                    const collisions = layerInstance;
                    const rows = collisions.__cHei;
                    const cols = collisions.__cWid;

                    const scaleGrid = layerInstance.__gridSize;
                    const gridSize = collisions.__gridSize;
                    const contours = (getContours(ndarray(collisions.intGridCsv.map(x => x === 0 ? 0 : 1), [rows, cols]), false));
                    for (let index = 0; index < contours.length; index++) {
                        const contour = contours[index];
                        const position = contour.reduce((prev, point, index, arr) => {
                            const p = [...point];
                            p[0] = (p[0] + level.worldX / gridSize) * scaleGrid;
                            p[1] = -((p[1] + level.worldY / gridSize)) * scaleGrid;
                            const nextP = [...arr[(index + 1) % arr.length]];
                            nextP[0] = (nextP[0] + level.worldX / gridSize) * scaleGrid;
                            nextP[1] = -((nextP[1] + level.worldY / gridSize)) * scaleGrid;
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
                } else if (layerInstance.__identifier === "Entities") {
                    for (const entityInst of layerInstance.entityInstances) {
                        const entityWorldX = (entityInst.__worldX || 0) + entityInst.width * (0.5 - entityInst.__pivot[0]);
                        const entityWorldY = -(entityInst.__worldY || 0) - entityInst.height * (0.5 - entityInst.__pivot[1]);
                        if (entityInst.__identifier === "Exit") {
                            const tile = entityInst.__tile;
                            if (!tile) {
                                throw new Error("tile is undefined");
                            }
                            const texture = this.textures.find(texture => (texture.image as HTMLImageElement).src.indexOf(this.internalIconName) !== -1)

                            if (!texture) {
                                throw new Error("texture is undefined");
                            }
                            const w = texture.width;
                            const h = texture.height;
                            const mesh = new Mesh(gl, {
                                geometry: new Plane(gl, {
                                    width: entityInst.width,
                                    height: entityInst.height,
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
            const offsetX = (level.worldX + level.pxWid / 2);
            const offsetY = -(level.worldY + level.pxHei / 2)
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
        const levels = this.ldtkData?.levels;
        if (!levels) {
            throw new Error("levels is undefined");
        }
        const min = new Vec3();
        const max = new Vec3();
        this.radius = 0;
        const level = levels[this.current];
        const layerInstances = level.layerInstances || [];
        for (const layerInstance of layerInstances) {
            if (layerInstance.__identifier === "Entities") {
                for (const entityInst of layerInstance.entityInstances) {
                    const entityWorldX = (entityInst.__worldX || 0) + entityInst.width * (0.5 - entityInst.__pivot[0]);
                    const entityWorldY = -(entityInst.__worldY || 0) - entityInst.height * (0.5 - entityInst.__pivot[1]);
                    if (entityInst.__identifier === "Player") {
                        this.onaddball && this.onaddball(new Mat4().translate(new Vec3(entityWorldX, entityWorldY, 0)))
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