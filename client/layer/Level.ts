import { GroupLayer } from "./GroupLayer.js";
import { Geometry, Mesh, OGLRenderingContext, Plane, Program, RenderTarget, Sphere, Texture, Transform, Vec2, Vec3 } from "ogl";
import { LayerLayer, Tiled, TiledLayer, Tileset } from "../misc/TiledParser.js";
import { counterHandler, radius } from "../misc/radius.js";
export class Level extends GroupLayer {
    constructor(
        name: string,
        x: number,
        y: number,
        tileLayersData: LayerLayer[]
    ) {
        super(name, x, y, tileLayersData);
    }
    resetVisibility(): void {
        const names = [...this.namesMap.values()].reduce<Set<string | undefined>>((prev, curr) => {
            curr.forEach(o => prev.add(o));
            return prev;
        }, new Set())
        this.node?.traverse(child => {
            if (names.has(child.name)) {
                child.visible = true
            }
        });
    }
    getDirDownNames() {
        return [...this.namesMap.get("DirDown") || []]
    }
    showDirDown() {
        this.node?.traverse(node => {
            const find = this.namesMap.get("DirDown")?.has(node.name);
            if (find) {
                node.visible = true;
            }
            return find;
        })
    }
    hideDirDown() {
        this.node?.traverse(node => {
            const find = this.namesMap.get("DirDown")?.has(node.name);
            if (find) {
                node.visible = false;
            }
            return find;
        })
    }
    getTeleportDestinationName() {
        const names = [...this.namesMap.get("TeleportDestination") || []];
        const name = names[0]
        if (names.length !== 1 || !name) {
            throw new Error("wrong teleportDestinationMeshNameSet");
        }
        return name;
    }
    checkNeedExit(collision: string): boolean {
        return this.namesMap.get("Exit")?.has(collision) || false;
    }
    checkTeleport(collision: string) {
        return this.namesMap.get("Teleport")?.has(collision);
    }
    checkGetPickaxe(collision: string): boolean {
        return this.namesMap.get("Pickaxe")?.has(collision) || false;
    }
    checkRock(collision: string): boolean {
        if (this.namesMap.get("Rock")?.has(collision)) {
            let hasPickaxe = false;
            this.node?.traverse(node => {
                const find = this.namesMap.get("Pickaxe")?.has(node.name);
                if (find) {
                    hasPickaxe = !node.visible;
                }
                return find;
            });
            return hasPickaxe;
        }
        return false;
    }
    hidePickaxe() {
        this.node?.traverse(node => {
            const find = this.namesMap.get("Pickaxe")?.has(node.name);
            if (find) {
                node.visible = false;
            }
            return find;
        })
    }
    hideRock() {
        this.node?.traverse(node => {
            const find = this.namesMap.get("Rock")?.has(node.name);
            if (find) {
                node.visible = false;
            }
            return find;
        })
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
            tileLayer.initTileChunks(tilesets, gl, vertex, fragment, spriteVertex, spriteFragment, textures, internalIconName, this.namesMap)
        }
    }
    initGraphics(renderTarget: RenderTarget, tilesets: Tileset[], gl: OGLRenderingContext, spriteVertex: string, spriteFragment: string, vertex: string, fragment: string) {
        const gridSize = tilesets[0].tilewidth;
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
