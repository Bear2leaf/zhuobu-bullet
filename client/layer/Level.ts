import { GroupLayer } from "./GroupLayer.js";
import { Geometry, Mesh, OGLRenderingContext, Plane, Program, RenderTarget, Sphere, Texture, Transform, Vec2, Vec3 } from "ogl";
import { LayerLayer, Tiled, Tileset } from "../misc/TiledParser.js";
import { counterHandler, radius } from "../misc/radius.js";
export class Level extends GroupLayer {
    constructor(
        name: string,
        x: number,
        y: number,
        tileLayersData: LayerLayer[],
        tilesets: Tileset[],
    ) {
        super(name, x, y, tileLayersData, tilesets);
    }
    checkNodeEntity(node: Transform, name: string | undefined) {
        return this.tileLayers.some(layer => node.name && layer.checkEntity(node.name, "name", name))
    }
    checkEntityName(meshName: string, name: string) {
        return this.tileLayers.some(layer => layer.checkEntity(meshName, "name", name))
    }
    getTeleportDestinationName() {
        const names = this.getMeshNames("TeleportDestination")
        const name = names[0]
        if (names.length !== 1 || !name) {
            throw new Error("wrong teleportDestinationMeshNameSet");
        }
        return name;
    }
    check(meshName: string, name: string) {
        return this.checkEntityName(meshName, name)
    }
    getMeshNames(name: string) {
        return this.tileLayers.reduce<string[]>((prev, curr) => {
            prev.push(...curr.getEntitiesByPropertyCondition("name", name))
            return prev;
        }, [])
    }
    updateVisible(name: string, visible: boolean) {
        this.node?.traverse(node => {
            const find = this.checkNodeEntity(node, name);
            if (find) {
                node.visible = visible;
            }
            return find;
        })
    }
    checkRock(collision: string): boolean {
        if (this.checkEntityName(collision, "Rock")) {
            let hasPickaxe = false;
            this.node?.traverse(node => {
                const find = this.checkNodeEntity(node, "Pickaxe");
                if (find) {
                    hasPickaxe = !node.visible;
                }
                return find;
            });
            return hasPickaxe;
        }
        return false;
    }


}
