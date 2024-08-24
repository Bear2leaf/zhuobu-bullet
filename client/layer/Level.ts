import { GroupLayer } from "./GroupLayer.js";
import { Geometry, Mesh, OGLRenderingContext, Plane, Program, RenderTarget, Sphere, Texture, Transform, Vec2, Vec3 } from "ogl";
import { LayerLayer, Tiled, TiledLayer, Tileset } from "../misc/TiledParser.js";
import { counterHandler, radius } from "../misc/radius.js";
export class Level extends GroupLayer {
    constructor(
        name: string,
        x: number,
        y: number,
        private readonly exitMeshNameSet: Set<string | undefined>,
        private readonly pickaxeMeshNameSet: Set<string | undefined>,
        private readonly rockMeshNameSet: Set<string | undefined>,
        tileLayersData: LayerLayer[]
    ) {
        super(name, x, y, tileLayersData);
    }
    initRenderTarget(tilesets: Tileset[], renderTarget: RenderTarget) {
        const gridSize = tilesets[0].tilewidth;
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
        textures: Texture[],
        internalIconName: string,
        tilesets: Tileset[]
    ) {
        for (const tileLayer of this.tileLayers) {
            if (tileLayer.name !== "Entities") {
                tileLayer.drawLayer(tilesets, textures, renderTarget, gl, spriteVertex, spriteFragment);
            }
            tileLayer.initTileChunks(tilesets, this.node, gl, vertex, fragment, spriteVertex, spriteFragment, textures, internalIconName, this.exitMeshNameSet, this.pickaxeMeshNameSet, this.rockMeshNameSet)
        }
    }
    initGraphics(renderTarget: RenderTarget, tilesets: Tileset[], gl: OGLRenderingContext, spriteVertex: string, spriteFragment: string, vertex: string, fragment: string) {

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


}
