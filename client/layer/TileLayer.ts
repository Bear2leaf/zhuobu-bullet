import { Camera, Geometry, Mesh, OGLRenderingContext, Plane, Program, RenderTarget, Texture, Transform, Vec2, Vec3 } from "ogl";
import { Layer } from "./Layer.js";
import { LayerLayer, Property, Tileset, Chunk as _Chunk } from "../misc/TiledParser.js";
import { Chunk } from "./Chunk.js";
export class TileLayer implements Layer {
    readonly chunks: Chunk[];
    readonly node: Transform = new Transform;
    constructor(
        readonly name: string,
        chunks: _Chunk[],
        tilesets: Tileset[],
        textures: Texture[],
    ) {
        this.chunks = [];
        chunks.forEach(chunk => {
            const c = new Chunk(tilesets, textures, chunk.data, chunk.x, chunk.y, chunk.width, chunk.height);
            this.chunks.push(c)
        })
    }
    getTileInfo(name: string, propName?: string, propValue?: Property["value"]) {
        for (const chunk of this.chunks) {
            const tile = chunk.getTileInfo(name, propName, propValue);
            if (tile) {
                return tile;
            }
        }
    }
    getMeshNamesByPropertyCondition(propName: string, propValue: Property["value"]) {
        const entities = [];
        for (const chunk of this.chunks) {
            entities.push(...chunk.getEntitiesByPropertyCondition(propName, propValue));
        }
        return entities;
    }
    drawLayer(renderTarget: RenderTarget, gl: OGLRenderingContext, spriteVertex: string, spriteFragment: string, min: Vec2, max: Vec2) {
        const chunks = this.chunks;
        const position = new Array;
        const uv = new Array;
        const tMap = {
            value: new Texture(gl)
        }
        for (let i = 0; i < chunks.length; i++) {
            chunks[i].drawChunk(position, uv, tMap)
        }
        //MAGIC!!! this 0.1 offset make REAL PIXEL PERFECT
        const camera = new Camera(gl, {
            left: (min.x) || 0.1,
            right: (max.x) || -0.1,
            top: (max.y) || -0.1,
            bottom: (min.y) || 0.1,
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
                    tMap
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
    initTileChunks(gl: OGLRenderingContext, vertex: string, fragment: string, spriteVertex: string, spriteFragment: string) {
        const layer = this;
        for (let i = 0; i < layer.chunks.length; i++) {
            const chunk = layer.chunks[i];
            chunk.initCollisions(this.node, gl, vertex, fragment)
            chunk.initEntities(this.node, gl, spriteVertex, spriteFragment);
        }
    }
}