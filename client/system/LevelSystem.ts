import { Box, Camera, Geometry, Mat4, Mesh, OGLRenderingContext, Plane, Program, RenderTarget, Sphere, Texture, Transform, Triangle, Vec2, Vec3, Vec4 } from "ogl";
import { Convert, Tiled } from "../misc/TiledParser.js";
import { System } from "./System.js";
import { Level } from "../layer/Level.js";

export default class LevelSystem implements System {
    tiledData?: Tiled;
    radius = 0;
    current = 0;
    isMazeMode = true;
    readonly center = new Vec3();
    readonly collections: Level[] = [];
    readonly exitMeshNameSet = new Set<string | undefined>();
    readonly dirDownMeshNameSet = new Set<string | undefined>();
    readonly rockMeshNameSet = new Set<string | undefined>();
    readonly pickaxeMeshNameSet = new Set<string | undefined>();
    onaddmesh?: (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>) => void;
    onaddball?: (transform: number[]) => void;
    update(): void {
        throw new Error("Method not implemented.");
    }

    async load() {

        const tiledJsonText = await (await fetch("resources/tiled/starter.json")).text();
        this.tiledData = Convert.toTiled(tiledJsonText);
    }
    updateLevel(reverse: boolean) {
        if (reverse) {
            this.current = this.current === 0 ? (this.collections.length - 1) : (this.current - 1)
        } else {
            this.current = (this.current + 1) % this.collections.length;
        }
    }
    checkNeedExit(collision: string): boolean {
        return this.exitMeshNameSet.has(collision);
    }
    checkGetPickaxe(collision: string): boolean {
        return this.pickaxeMeshNameSet.has(collision);
    }
    init() {
        const tiledData = this.tiledData;
        if (!tiledData) {
            throw new Error("tiledData is undefined");
        }
        tiledData.layers.forEach(layer => {
            const level = new Level(
                layer.name,
                layer.x,
                layer.y,
                this.exitMeshNameSet,
                this.pickaxeMeshNameSet,
                this.rockMeshNameSet,
                layer.layers
            );
            level.node.name = layer.name;
            this.collections.push(level);
        })
    }
    request(scene: Transform) {
        const tiledData = this.tiledData;
        if (!tiledData) {
            throw new Error("tiledData is undefined");
        }
        const gridSize = tiledData.tilewidth;
        const levels = tiledData.layers;
        const level = levels[this.current];
        const layerInstances = level.layers;
        for (const layerInstance of layerInstances) {
            if (layerInstance.name === "Entities") {
                for (const chunk of layerInstance.chunks) {
                    for (let j = 0; j < chunk.data.length; j++) {
                        const gid = chunk.data[j];
                        if (gid === 0) {
                            continue;
                        }
                        const x = (j % chunk.width) * gridSize + chunk.x * gridSize;
                        const y = Math.floor(j / chunk.width) * gridSize + chunk.y * gridSize;
                        const tileset = tiledData.tilesets.find(tileset => tileset.firstgid <= gid && gid < (tileset.firstgid + tileset.tilecount))
                        if (!tileset) {
                            throw new Error("tileset is undefined");
                        }
                        const tileDef = tileset.tiles?.find(t => t.id === (gid - tileset.firstgid));
                        if (!tileDef) {
                            throw new Error("tileDef is undefined");
                        }
                        const name = tileDef.properties.find(prop => prop.name === "name")?.value;
                        const entityWorldX = x + chunk.width * 0.5;
                        const entityWorldY = -y - chunk.height * 0.5;
                        if (name === "Player") {
                            this.onaddball && this.onaddball(new Mat4().translate(new Vec3(entityWorldX, entityWorldY, 0)))
                        }
                    }
                }
            }
        }
        scene.children.forEach((child, index) => (index === 0 || index === (this.current + 1)) ? (child.visible = true) : (child.visible = false))
        const min = new Vec3(Infinity, Infinity, 0)
        const max = new Vec3(-Infinity, -Infinity, 0);
        for (const child of scene.children[this.current + 1].children.filter(child => child instanceof Mesh)) {
            const mesh = child as Mesh;
            const attributeData = mesh.geometry.getPosition().data;
            const indices = mesh.geometry.attributes.index?.data;
            this.onaddmesh && this.onaddmesh(mesh.name, mesh.matrix, [...attributeData || []], [...indices || []], { exit: this.exitMeshNameSet.has(mesh.name), rock: this.rockMeshNameSet.has(mesh.name), pickaxe: this.pickaxeMeshNameSet.has(mesh.name), dirDown: this.dirDownMeshNameSet.has(mesh.name) })
            if (!(mesh.geometry instanceof Plane || mesh.geometry instanceof Sphere)) {
                const meshMin = mesh.geometry.bounds.min;
                const meshMax = mesh.geometry.bounds.max;
                min.x = Math.min(min.x, meshMin.x);
                min.y = Math.min(min.y, meshMin.y);
                max.x = Math.max(max.x, meshMax.x);
                max.y = Math.max(max.y, meshMax.y);
            } else if (this.exitMeshNameSet.has(mesh.name) || this.rockMeshNameSet.has(mesh.name) || this.pickaxeMeshNameSet.has(mesh.name) || this.dirDownMeshNameSet.has(mesh.name)) {
                mesh.visible = true;
            }
        }
        this.radius = max.distance(min) / 2;
        this.center.copy(max.add(min).multiply(0.5))
    }
}