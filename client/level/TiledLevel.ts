import { GLTF, Plane, Transform, Vec3 } from "ogl";

import { Mesh, OGLRenderingContext, Program, RenderTarget, Texture, Vec2 } from "ogl";
import { LayerLayer, Tileset } from "../misc/TiledParser.js";
import { counterHandler, radius } from "../misc/radius.js";
import { TileLayer } from "../tiled/TileLayer.js";
import { Level } from "./Level.js";

export class TiledLevel implements Level {
    readonly tileLayers: TileLayer[] = [];
    readonly node: Transform = new Transform;
    readonly min: Vec3 = new Vec3;
    readonly max: Vec3 = new Vec3;
    readonly properties: Record<string, string | number | boolean> = {};
    private readonly textures: Texture[] = [];
    requested = false;
    constructor(
        readonly name: string,
        readonly x: number,
        readonly y: number,
        private readonly tileLayersData: LayerLayer[],
        private readonly tilesets: Tileset[],
        private readonly gridWidth: number,
        private readonly gridHeight: number
    ) { }
    initGltfLevel(gltf?: GLTF): void {
    }
    checkNodeEntity(node: Transform, name: string | undefined) {
        return this.tileLayers.some(layer => node.name && layer.getTileInfo(node.name, "name", name))
    }
    checkEntityName(meshName: string, name: string) {
        return this.tileLayers.some(layer => layer.getTileInfo(meshName, "name", name))
    }
    getTeleportDestinationName() {
        const names = this.getMeshNames("TeleportDestination")
        const name = names[0]
        if (names.length !== 1 || !name) {
            throw new Error("wrong teleportDestinationMeshNameSet");
        }
        return name;
    }
    check(meshName: string, name: string) {
        return this.checkEntityName(meshName, name)
    }
    getMeshNames(name: string) {
        return this.tileLayers.reduce<string[]>((prev, curr) => {
            prev.push(...curr.getMeshNamesByPropertyCondition("name", name))
            return prev;
        }, [])
    }
    updateVisible(name: string, visible: boolean) {
        this.node?.traverse(node => {
            const find = this.checkNodeEntity(node, name);
            if (find) {
                node.visible = visible;
            }
            return find;
        })
    }
    checkRock(collision: string): boolean {
        if (this.checkEntityName(collision, "Rock")) {
            let hasPickaxe = false;
            this.node?.traverse(node => {
                const find = this.checkNodeEntity(node, "Pickaxe");
                if (find) {
                    hasPickaxe = !node.visible;
                }
                return find;
            });
            return hasPickaxe;
        }
        return false;
    }


    init() {
        const layerInstances = this.tileLayersData;
        for (let layerIndex = 0; layerIndex < layerInstances.length; layerIndex++) {
            const layerLayer = layerInstances[layerIndex];
            const tileLayer = new TileLayer(layerLayer.name, layerLayer.chunks, this.tilesets, this.textures, this.gridWidth, this.gridHeight);
            this.tileLayers.push(tileLayer);
            tileLayer.node.setParent(this.node);
        }
        this.node.name = this.name;
        const level = this;


        level.tileLayers.reduce((lprev, lcurr) => {
            const min = lcurr.chunks.reduce((prev, curr) => {
                prev.x = Math.min(curr.x, prev.x);
                prev.y = Math.min(curr.y, prev.y);
                return prev;
            }, new Vec3);
            lprev.x = Math.min(min.x, lprev.x);
            lprev.y = Math.min(min.y, lprev.y);
            return lprev;
        }, this.min);
        level.tileLayers.reduce((lprev, lcurr) => {
            const max = lcurr.chunks.reduce((prev, curr) => {
                prev.x = Math.max(curr.x + curr.width, prev.x);
                prev.y = Math.max(curr.y + curr.height, prev.y);
                return prev;
            }, new Vec3);
            lprev.x = Math.max(max.x, lprev.x);
            lprev.y = Math.max(max.y, lprev.y);
            return lprev;
        }, this.max);
    }
    resetVisibility(): void {
        this.node?.traverse(child => {
            if (this.tileLayers.some(layer => child.name && layer.getTileInfo(child.name))) {
                child.visible = true
            }
        });
    }
    setTextures(textures: Texture[]) {
        this.textures.push(...textures);
    }
    initRenderTarget(renderTarget: RenderTarget) {
        const gridSize = this.tilesets[0].tilewidth;
        const width = (this.max.x - this.min.x) * gridSize;
        const height = (this.max.y - this.min.y) * gridSize;
        renderTarget.setSize(width, height)
        this.requested = true;
    }
    initGraphicsBuffer(
        gl: OGLRenderingContext,
        vertex: string,
        fragment: string,
        spriteVertex: string,
        spriteFragment: string,
        renderTarget: RenderTarget,
    ) {
        const gridSize = this.tilesets[0].tilewidth;
        for (const tileLayer of this.tileLayers) {
            const min = this.min.clone().multiply(gridSize);
            const max = this.max.clone().multiply(gridSize);
            const minVec2 = new Vec2(min.x, min.y);
            const maxVec2 = new Vec2(max.x, max.y);
            tileLayer.drawLayer(renderTarget, gl, spriteVertex, spriteFragment, minVec2, maxVec2);
            tileLayer.initTileChunks(gl, vertex, fragment, spriteVertex, spriteFragment)
        }
    }
    initGraphics(renderTarget: RenderTarget, gl: OGLRenderingContext, spriteVertex: string, spriteFragment: string, vertex: string, fragment: string) {
        const gridSize = this.tilesets[0].tilewidth;
        const offsetX = (this.x + (this.min.x * gridSize) + renderTarget.width / 2);
        const offsetY = -(this.y + (this.min.y * gridSize) + renderTarget.height / 2);
        {
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
            mesh.name = "test" + counterHandler.counter++;
            mesh.position.x = offsetX;
            mesh.position.y = offsetY;
            mesh.rotation.x = Math.PI;
            mesh.position.z = -radius;
            mesh.updateMatrix();
            mesh.setParent(this.node);
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
            mesh.name = "test" + counterHandler.counter++;
            mesh.setParent(this.node);
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
            mesh.name = "test" + counterHandler.counter++;
            mesh.setParent(this.node);
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