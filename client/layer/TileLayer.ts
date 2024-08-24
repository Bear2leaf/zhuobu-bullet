import { Camera, Geometry, Mesh, OGLRenderingContext, Plane, Program, RenderTarget, Texture, Transform, Vec2, Vec3 } from "ogl";
import { Layer } from "./Layer.js";
import { Chunk } from "./Chunk.js";
import { LayerLayer, Tileset } from "../misc/TiledParser.js";
export class TileLayer implements Layer {
    constructor(
        readonly name: string,
        readonly chunks: Chunk[],
        readonly node: Transform = new Transform,
    ) {
        chunks.forEach(chunk => chunk.node.setParent(this.node));
    }
    drawLayer(tilesets: Tileset[], textures: Texture[], renderTarget: RenderTarget, gl: OGLRenderingContext, spriteVertex: string, spriteFragment: string) {
        const chunks = this.chunks;
        const gid = chunks[0].data.find(gid => gid);
        if (!gid) {
            throw new Error("gid is undefined");
        }
        const tileset = tilesets.find(tileset => tileset.firstgid <= gid && gid < (tileset.firstgid + tileset.tilecount))
        if (!tileset) {
            throw new Error("tileset is undefined");
        }
        const texture = textures.find(texture => (texture.image as HTMLImageElement).src.endsWith(tileset.image));
        if (!texture) {
            throw new Error("texture is undefined")
        }
        const w = texture.width;
        const h = texture.height;
        const position = new Array;
        const uv = new Array;
        const gridSize = tileset.tilewidth;
        const min = new Vec2();
        const max = new Vec2();
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            chunk.initDrawData(w, h, gridSize, min, max, tileset, position, uv);
        }
        //MAGIC!!! this 0.1 offset make REAL PIXEL PERFECT
        const camera = new Camera(gl, {
            left: 0.1 + min.x * tileset.tilewidth,
            right: max.x * tileset.tilewidth,
            top: max.y * tileset.tileheight,
            bottom: 0.1 + min.y * tileset.tileheight,
            near: 0,
            far: -1
        })
        const scene = new Mesh(gl, {
            geometry: new Geometry(gl, {
                position: {
                    size: 3,
                    data: new Float32Array(position)
                },
                uv: {
                    size: 2,
                    data: new Float32Array(uv)
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
    initTileChunks(tilesets: Tileset[], levelNode: Transform, gl: OGLRenderingContext, vertex: string, fragment: string, spriteVertex: string, spriteFragment: string, textures: Texture[], internalIconName: string, exitMeshNameSet: Set<string | undefined>, pickaxeMeshNameSet: Set<string | undefined>, rockMeshNameSet: Set<string | undefined>) {

        const layer = this;
        const gid = layer.chunks[0].data.find(gid => gid);
        if (!gid) {
            throw new Error("gid is undefined");
        }
        const tileset = tilesets.find(tileset => tileset.firstgid <= gid && gid < (tileset.firstgid + tileset.tilecount))
        if (!tileset) {
            throw new Error("tileset is undefined");
        }
        const gridSize = tileset.tilewidth;
        if (layer.name === "Collisions") {
            for (let i = 0; i < layer.chunks.length; i++) {
                const chunk = layer.chunks[i];
                chunk.initCollisions(gridSize, levelNode, gl, vertex, fragment)
            }
        }
        else if (layer.name === "Entities") {
            for (let i = 0; i < layer.chunks.length; i++) {
                const chunk = layer.chunks[i];
                chunk.initEntities(levelNode, tilesets, textures, gl, internalIconName, spriteVertex, spriteFragment, exitMeshNameSet, pickaxeMeshNameSet, rockMeshNameSet);
            }
        }
    }
}