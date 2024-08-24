import { GroupLayer } from "./GroupLayer.js";
import { Geometry, Mesh, OGLRenderingContext, Plane, Program, RenderTarget, Sphere, Texture, Transform, Vec2, Vec3 } from "ogl";
import { LayerLayer, Tiled, TiledLayer, Tileset } from "../misc/TiledParser.js";
import { radius } from "../misc/radius.js";
import { TileLayer } from "./TileLayer.js";
import { Chunk } from "./Chunk.js";
export class Level extends GroupLayer {
    constructor(
        readonly name: string,
        x: number,
        y: number,
        private readonly exitMeshNameSet: Set<string | undefined>,
        private readonly pickaxeMeshNameSet: Set<string | undefined>,
        private readonly rockMeshNameSet: Set<string | undefined>,
        private readonly tileLayersData: LayerLayer[]
    ) {
        super(x, y);
    }
    initTiledData(
        tilesets: Tileset[],
        scene: Transform,
        gl: OGLRenderingContext,
        vertex: string,
        fragment: string,
        spriteVertex: string,
        spriteFragment: string,
        renderTarget: RenderTarget,
        textures: Texture[],
        internalIconName: string,
    ) {
        const level = this;
        const levelNode = this.node;
        levelNode.name = level.name;
        levelNode.setParent(scene);
        const layerInstances = level.tileLayersData;
        for (let layerIndex = 0; layerIndex < layerInstances.length; layerIndex++) {
            const layerLayer = layerInstances[layerIndex];
            const chunks: Chunk[] = []
            layerLayer.chunks.forEach(chunk => {
                chunks.push(new Chunk(chunk.data, chunk.x, chunk.y, chunk.width, chunk.height))
            })
            const tileLayer = new TileLayer(layerLayer.name, chunks);
            this.tileLayers.push(tileLayer)
            level.initRenderTarget(tilesets, gl, renderTarget)
            if (tileLayer.name !== "Entities") {
                tileLayer.drawLayer(tilesets, textures, renderTarget, gl, spriteVertex, spriteFragment);
            }
            tileLayer.initTileChunks(tilesets, levelNode, gl, vertex, fragment, spriteVertex, spriteFragment, textures, internalIconName, this.exitMeshNameSet, this.pickaxeMeshNameSet, this.rockMeshNameSet)
        }

    }

}
