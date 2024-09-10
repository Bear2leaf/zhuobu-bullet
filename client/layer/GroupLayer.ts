import { Plane, Transform, Vec3 } from "ogl";
import { Layer } from "./Layer.js";

import { Vec2, Camera, Mesh, Geometry, Program, Texture, RenderTarget, OGLRenderingContext } from "ogl";
import { LayerLayer, Tiled, Tileset } from "../misc/TiledParser.js";
import { counterHandler, radius } from "../misc/radius.js";
import { TileLayer } from "./TileLayer.js";

export class GroupLayer implements Layer {
    readonly tileLayers: TileLayer[] = [];
    readonly node: Transform = new Transform;
    readonly min: Vec2 = new Vec2;
    readonly max: Vec2 = new Vec2;
    readonly properties: Record<string, string | number | boolean> = {};
    private readonly textures: Texture[] = [];
    constructor(
        readonly name: string,
        readonly x: number,
        readonly y: number,
        private readonly tileLayersData: LayerLayer[],
        private readonly tilesets: Tileset[],
        private readonly gridWidth: number,
        private readonly gridHeight: number
    ) { }
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
            }, new Vec2);
            lprev.x = Math.min(min.x, lprev.x);
            lprev.y = Math.min(min.y, lprev.y);
            return lprev;
        }, this.min);
        level.tileLayers.reduce((lprev, lcurr) => {
            const max = lcurr.chunks.reduce((prev, curr) => {
                prev.x = Math.max(curr.x + curr.width, prev.x);
                prev.y = Math.max(curr.y + curr.height, prev.y);
                return prev;
            }, new Vec2);
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
            tileLayer.drawLayer(renderTarget, gl, spriteVertex, spriteFragment, this.min.clone().multiply(gridSize), this.max.clone().multiply(gridSize));
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