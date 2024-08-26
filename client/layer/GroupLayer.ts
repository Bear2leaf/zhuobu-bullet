import { Plane, Transform, Vec3 } from "ogl";
import { Layer } from "./Layer.js";

import { Vec2, Camera, Mesh, Geometry, Program, Texture, RenderTarget, OGLRenderingContext } from "ogl";
import { LayerLayer, Tiled, TiledLayer, Tileset } from "../misc/TiledParser.js";
import { counterHandler, radius } from "../misc/radius.js";
import { TileLayer } from "./TileLayer.js";

export class GroupLayer implements Layer {
    readonly tileLayers: TileLayer[] = [];
    readonly node: Transform = new Transform;
    readonly min: Vec2 = new Vec2;
    readonly max: Vec2 = new Vec2;
    readonly properties: Record<string, string | number | boolean> = {};
    readonly namesMap = new Map<string, Set<string| undefined>>();
    constructor(
        readonly name: string,
        readonly x: number,
        readonly y: number,
        private readonly tileLayersData: LayerLayer[]
    ) { }
    init() {
        const layerInstances = this.tileLayersData;
        for (let layerIndex = 0; layerIndex < layerInstances.length; layerIndex++) {
            const layerLayer = layerInstances[layerIndex];
            const tileLayer = new TileLayer(layerLayer.name, layerLayer.chunks);
            this.tileLayers.push(tileLayer);
            tileLayer.node.setParent(this.node);
        }
        this.node.name = this.name;
        const level = this;


        level.tileLayers.reduce((lprev, lcurr) => {
            const min = lcurr.chunks.reduce((prev, curr) => {
                prev.x = Math.min(curr.x, prev.x);
                prev.y = Math.min(curr.y, prev.y);
                return prev;
            }, new Vec2);
            lprev.x = Math.min(min.x, lprev.x);
            lprev.y = Math.min(min.y, lprev.y);
            return lprev;
        }, this.min);
        level.tileLayers.reduce((lprev, lcurr) => {
            const max = lcurr.chunks.reduce((prev, curr) => {
                prev.x = Math.max(curr.x + curr.width, prev.x);
                prev.y = Math.max(curr.y + curr.height, prev.y);
                return prev;
            }, new Vec2);
            lprev.x = Math.max(max.x, lprev.x);
            lprev.y = Math.max(max.y, lprev.y);
            return lprev;
        }, this.max);
    }
}