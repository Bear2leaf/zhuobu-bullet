import { Transform, Texture, RenderTarget, OGLRenderingContext, GLTF, Vec2, Vec3, Mesh } from "ogl";
import { TileLayer } from "../tiled/TileLayer";
import { Level } from "./Level";

export class GltfLevel implements Level {
    readonly min: Vec3 = new Vec3(Infinity, Infinity, Infinity);
    readonly max: Vec3 = new Vec3(-Infinity, -Infinity, -Infinity);
    readonly node: Transform = new Transform;
    readonly tileLayers: TileLayer[] = [];
    requested: boolean = false;
    constructor(
        name: string
    ) {
        this.node.name = name;
    }
    initGltfLevel(gltf?: GLTF): void {
        if (!gltf || !this.node.name) {
            throw new Error("gltf or node name is not defined");
        }
        const levelNode = gltf.scene[0].children.find(child => child.name === this.node.name);
        if (!levelNode) {
            throw new Error("levelNode not found");
        }
        levelNode.setParent(this.node);
        levelNode.traverse(node => {
            if (node instanceof Mesh) {
                node.geometry.computeBoundingBox();
                const min = node.geometry.bounds.min;
                const max = node.geometry.bounds.max;
                min.applyMatrix4(node.worldMatrix);
                max.applyMatrix4(node.worldMatrix);
                this.min.x = Math.min(this.min.x, min.x);
                this.min.y = Math.min(this.min.y, min.y);
                this.min.z = Math.min(this.min.z, min.z);
                this.max.x = Math.max(this.max.x, max.x);
                this.max.y = Math.max(this.max.y, max.y);
                this.max.z = Math.max(this.max.z, max.z);
            }
        })
        this.requested = true;
    }
    checkNodeEntity(node: Transform, name: string | undefined): boolean {
        return false;
    }
    checkEntityName(meshName: string, name: string): boolean {
        return false;
    }
    getTeleportDestinationName(): string {
        throw new Error("Method not implemented.");
    }
    check(meshName: string, name: string): boolean {
        return meshName.startsWith("Goal") && name === "Exit";
    }
    getMeshNames(name: string): string[] {
        return [];
    }
    updateVisible(name: string, visible: boolean): void {
    }
    checkRock(collision: string): boolean {
        return false;
    }
    init(): void {
    }
    resetVisibility(): void {
    }
    setTextures(textures: Texture[]): void {
    }
    initRenderTarget(renderTarget: RenderTarget): void {
    }
    initGraphicsBuffer(gl: OGLRenderingContext, vertex: string, fragment: string, spriteVertex: string, spriteFragment: string, renderTarget: RenderTarget): void {
    }
    initGraphics(renderTarget: RenderTarget, gl: OGLRenderingContext, spriteVertex: string, spriteFragment: string, vertex: string, fragment: string): void {
    }
}