import { Plane, Transform, Vec3 } from "ogl";
import { Layer } from "./Layer.js";

import { Vec2, Camera, Mesh, Geometry, Program, Texture, RenderTarget, OGLRenderingContext } from "ogl";
import { LayerLayer, Tiled, TiledLayer, Tileset } from "../misc/TiledParser.js";
import { counterHandler, radius } from "../misc/radius.js";
import { TileLayer } from "./TileLayer.js";

export class GroupLayer implements Layer {
    readonly tileLayers: TileLayer[] = [];
    readonly node: Transform = new Transform;
    readonly properties: Record<string, string | number | boolean> = {};
    constructor(
        readonly x: number,
        readonly y: number
    ) { }
    initLevelGraphic(renderTarget: RenderTarget, tilesets: Tileset[], gl: OGLRenderingContext, spriteVertex: string, spriteFragment: string, vertex: string, fragment: string) {

        const gridSize = tilesets[0].tilewidth;
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
        const min = this.tileLayers.reduce((lprev, lcurr) => {
            const min = lcurr.chunks.reduce((prev, curr) => {
                prev.x = Math.min(curr.x, prev.x);
                prev.y = Math.min(curr.y, prev.y);
                return prev;
            }, new Vec2);
            lprev.x = Math.min(min.x, lprev.x);
            lprev.y = Math.min(min.y, lprev.y);
            return lprev;
        }, new Vec2);
        const offsetX = (this.x + (min.x * gridSize) + renderTarget.width / 2);
        const offsetY = -(this.y + (min.y * gridSize) + renderTarget.height / 2);
        mesh.position.x = offsetX;
        mesh.position.y = offsetY;
        mesh.rotation.x = Math.PI;
        mesh.position.z = -radius;
        mesh.updateMatrix();
        mesh.setParent(this.node);
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

    initRenderTarget(tilesets: Tileset[], gl: OGLRenderingContext, renderTarget: RenderTarget) {
        const level = this;


        const gridSize = tilesets[0].tilewidth;
        const min = level.tileLayers.reduce((lprev, lcurr) => {
            const min = lcurr.chunks.reduce((prev, curr) => {
                prev.x = Math.min(curr.x, prev.x);
                prev.y = Math.min(curr.y, prev.y);
                return prev;
            }, new Vec2);
            lprev.x = Math.min(min.x, lprev.x);
            lprev.y = Math.min(min.y, lprev.y);
            return lprev;
        }, new Vec2);
        const max = level.tileLayers.reduce((lprev, lcurr) => {
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
        renderTarget.setSize(width, height)
    }
}