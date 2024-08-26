import { Camera, Geometry, Mesh, OGLRenderingContext, Plane, Program, RenderTarget, Texture, Transform, Vec2, Vec3 } from "ogl";
import { Layer } from "./Layer.js";
import { LayerLayer, Tileset, Chunk as _Chunk } from "../misc/TiledParser.js";
import { Chunk } from "./Chunk.js";
export class TileLayer implements Layer {
    readonly chunks: Chunk[];
    readonly node: Transform = new Transform;
    constructor(
        readonly name: string,
        chunks: _Chunk[],
    ) {
        this.chunks = [];
        chunks.forEach(chunk => {
            const c = new Chunk(chunk.data, chunk.x, chunk.y, chunk.width, chunk.height);
            this.chunks.push(c)
        })
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
            min.x = Math.min(chunk.x, min.x);
            min.y = Math.min(chunk.y, min.y);
            max.x = Math.max(chunk.x + chunk.width, max.x);
            max.y = Math.max(chunk.y + chunk.height, max.y);
            for (let j = 0; j < chunk.data.length; j++) {
                const gid = chunk.data[j];
                if (gid === 0) {
                    continue;
                }
                const ux = ((gid - tileset.firstgid) % tileset.columns) * (tileset.tilewidth + tileset.spacing);
                const uy = Math.floor((gid - tileset.firstgid) / tileset.columns) * (tileset.tileheight + tileset.spacing);
                const x = ((j % chunk.width) + chunk.x) * gridSize;
                const y = (Math.floor(j / chunk.width) + chunk.y) * gridSize;

                position.push(
                    (x), ((y)), (0),
                    (x + gridSize), ((y)), (0),
                    (x + gridSize), ((y + gridSize)), (0),
                    (x + gridSize), ((y + gridSize)), (0),
                    (x), ((y + gridSize)), (0),
                    (x), ((y)), (0)
                );
                uv.push(
                    (ux) / w, 1 - (uy) / h,
                    (ux + gridSize) / w, 1 - (uy) / h,
                    (ux + gridSize) / w, 1 - (uy + gridSize) / h,
                    (ux + gridSize) / w, 1 - (uy + gridSize) / h,
                    (ux) / w, 1 - (uy + gridSize) / h,
                    (ux) / w, 1 - (uy) / h
                )
            }
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
    initTileChunks(tilesets: Tileset[], gl: OGLRenderingContext, vertex: string, fragment: string, spriteVertex: string, spriteFragment: string, textures: Texture[], internalIconName: string, namesMap: Map<string, Set<string | undefined>>) {

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
                chunk.initCollisions(gridSize, this.node, gl, vertex, fragment)
            }
        }
        else if (layer.name === "Entities") {
            for (let i = 0; i < layer.chunks.length; i++) {
                const chunk = layer.chunks[i];
                chunk.initEntities(this.node, tilesets, textures, gl, internalIconName, spriteVertex, spriteFragment, namesMap);
            }
        }
    }
}