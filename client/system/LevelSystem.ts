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
    onaddmesh?: (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>) => void;
    ondisablemesh?: (name: string | undefined) => void;
    onenablemesh?: (name: string | undefined) => void;
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
    getTeleportDestinationName() {
        return this.collections[this.current].getTeleportDestinationName();
    }
    getPickaxe() {
        this.collections[this.current].hidePickaxe();
    }
    removeRock(name: string) {
        this.collections[this.current].hideRock(name);
    }
    checkTeleport(collision: string) {
        return this.collections[this.current].checkTeleport(collision);
    }
    checkNeedExit(collision: string): boolean {
        return this.collections[this.current].checkNeedExit(collision);
    }
    checkGetPickaxe(collision: string): boolean {
        return this.collections[this.current].checkGetPickaxe(collision);
    }
    checkRock(collision: string) {
        return this.collections[this.current].checkRock(collision);
    }
    hideDirDown() {
        this.collections[this.current].hideDirDown();
        const names = this.collections[this.current].getDirDownNames();
        for (const name of names) {
            this.ondisablemesh && this.ondisablemesh(name)
        }
    }
    showDirDown() {
        this.collections[this.current].showDirDown();
        const names = this.collections[this.current].getDirDownNames();
        for (const name of names) {
            this.onenablemesh && this.onenablemesh(name)
        }
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
                layer.layers
            );
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
        const tiledLayer = levels[this.current];
        const layerInstances = tiledLayer.layers;
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
        const level = this.collections[this.current];
        for (const child of level.node.children) {
            if (child instanceof Mesh) {
                this.buildChildCollision(child, min, max);
            }
        }
        for (const tileLayer of level.tileLayers) {
            for (const child of tileLayer.node.children) {
                if (child instanceof Mesh) {
                    this.buildChildCollision(child, min, max);
                }
            }
        }
        this.collections[this.current].resetVisibility()
        this.radius = max.distance(min) / 2;
        this.center.copy(max.add(min).multiply(0.5));
    }
    private buildChildCollision(child: Mesh, min: Vec3, max: Vec3) {

        const mesh = child;
        const attributeData = mesh.geometry.getPosition().data;
        const indices = mesh.geometry.attributes.index?.data;
        this.onaddmesh && this.onaddmesh(mesh.name, mesh.matrix, [...attributeData || []], [...indices || []])
        if (!(mesh.geometry instanceof Plane || mesh.geometry instanceof Sphere)) {
            const meshMin = mesh.geometry.bounds.min;
            const meshMax = mesh.geometry.bounds.max;
            min.x = Math.min(min.x, meshMin.x);
            min.y = Math.min(min.y, meshMin.y);
            max.x = Math.max(max.x, meshMax.x);
            max.y = Math.max(max.y, meshMax.y);
        }
    }
}