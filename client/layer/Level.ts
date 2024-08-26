import { GroupLayer } from "./GroupLayer.js";
import { Geometry, Mesh, OGLRenderingContext, Plane, Program, RenderTarget, Sphere, Texture, Transform, Vec2, Vec3 } from "ogl";
import { LayerLayer, Tiled, TiledLayer, Tileset } from "../misc/TiledParser.js";
import { counterHandler, radius } from "../misc/radius.js";
export class Level extends GroupLayer {
    constructor(
        name: string,
        x: number,
        y: number,
        tileLayersData: LayerLayer[]
    ) {
        super(name, x, y, tileLayersData);
    }
    getDirDownNames() {
        return [...this.namesMap.get("DirDown") || []]
    }
    showDirDown() {
        this.node?.traverse(node => {
            const find = this.namesMap.get("DirDown")?.has(node.name);
            if (find) {
                node.visible = true;
            }
            return find;
        })
    }
    hideDirDown() {
        this.node?.traverse(node => {
            const find = this.namesMap.get("DirDown")?.has(node.name);
            if (find) {
                node.visible = false;
            }
            return find;
        })
    }
    getTeleportDestinationName() {
        const names = [...this.namesMap.get("TeleportDestination") || []];
        const name = names[0]
        if (names.length !== 1 || !name) {
            throw new Error("wrong teleportDestinationMeshNameSet");
        }
        return name;
    }
    checkNeedExit(collision: string): boolean {
        return this.namesMap.get("Exit")?.has(collision) || false;
    }
    checkTeleport(collision: string) {
        return this.namesMap.get("Teleport")?.has(collision);
    }
    checkGetPickaxe(collision: string): boolean {
        return this.namesMap.get("Pickaxe")?.has(collision) || false;
    }
    checkRock(collision: string): boolean {
        if (this.namesMap.get("Rock")?.has(collision)) {
            let hasPickaxe = false;
            this.node?.traverse(node => {
                const find = this.namesMap.get("Pickaxe")?.has(node.name);
                if (find) {
                    hasPickaxe = !node.visible;
                }
                return find;
            });
            return hasPickaxe;
        }
        return false;
    }
    hidePickaxe() {
        this.node?.traverse(node => {
            const find = this.namesMap.get("Pickaxe")?.has(node.name);
            if (find) {
                node.visible = false;
            }
            return find;
        })
    }
    hideRock() {
        this.node?.traverse(node => {
            const find = this.namesMap.get("Rock")?.has(node.name);
            if (find) {
                node.visible = false;
            }
            return find;
        })
    }


}
