import { Transform, Texture, RenderTarget, OGLRenderingContext } from "ogl";
import { TileLayer } from "../tiled/TileLayer";
import { Level } from "./Level";

export class GltfLevel implements Level {
    readonly node: Transform = new Transform;
    readonly tileLayers: TileLayer[] = [];
    requested: boolean = false;
    constructor(
        name: string
    ) {
        this.node.name = name;
    }
    checkNodeEntity(node: Transform, name: string | undefined): boolean {
        throw new Error("Method not implemented.");
    }
    checkEntityName(meshName: string, name: string): boolean {
        throw new Error("Method not implemented.");
    }
    getTeleportDestinationName(): string {
        throw new Error("Method not implemented.");
    }
    check(meshName: string, name: string): boolean {
        throw new Error("Method not implemented.");
    }
    getMeshNames(name: string): string[] {
        return [];
    }
    updateVisible(name: string, visible: boolean): void {
    }
    checkRock(collision: string): boolean {
        throw new Error("Method not implemented.");
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