import { Transform, Texture, RenderTarget, OGLRenderingContext } from "ogl";
import { TileLayer } from "../tiled/TileLayer";

export interface Level {
    readonly node: Transform;
    readonly tileLayers: TileLayer[];
    requested: boolean;
    checkNodeEntity(node: Transform, name: string | undefined): boolean;
    checkEntityName(meshName: string, name: string): boolean
    getTeleportDestinationName(): string;
    check(meshName: string, name: string): boolean;
    getMeshNames(name: string): string[];
    updateVisible(name: string, visible: boolean): void;
    checkRock(collision: string): boolean

    init(): void;
    resetVisibility(): void
    setTextures(textures: Texture[]): void;
    initRenderTarget(renderTarget: RenderTarget): void;
    initGraphicsBuffer(
        gl: OGLRenderingContext,
        vertex: string,
        fragment: string,
        spriteVertex: string,
        spriteFragment: string,
        renderTarget: RenderTarget,
    ): void
    initGraphics(renderTarget: RenderTarget, gl: OGLRenderingContext, spriteVertex: string, spriteFragment: string, vertex: string, fragment: string): void
}