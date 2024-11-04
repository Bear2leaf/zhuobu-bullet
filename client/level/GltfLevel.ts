import { Transform, Texture, RenderTarget, OGLRenderingContext, GLTF, Vec2, Vec3 } from "ogl";
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
            this.min.x = Math.min(this.min.x, node.position.x);
            this.min.y = Math.min(this.min.y, node.position.y);
            this.min.z = Math.min(this.min.z, node.position.z);
            this.max.x = Math.max(this.max.x, node.position.x);
            this.max.y = Math.max(this.max.y, node.position.y);
            this.max.z = Math.max(this.max.z, node.position.z);
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
        return false;
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