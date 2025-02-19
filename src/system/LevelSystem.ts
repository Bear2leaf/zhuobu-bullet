import { Mat4, Mesh, Plane, Sphere, Transform, Vec3 } from "ogl";
import { GltfLevel } from "../engine/GltfLevel.js";
import { radius, radius3d } from "../engine/radius.js";
import { System } from "./System.js";

export default class LevelSystem implements System {
    radius = 0;
    current = 0;
    isMazeMode = true;
    readonly center = new Vec3();
    readonly collections: GltfLevel[] = [];
    onaddmesh?: (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>, convex?: boolean) => void;
    ondisablemesh?: (name: string | undefined) => void;
    onenablemesh?: (name: string | undefined) => void;
    onaddball?: (transform: number[], isBall: boolean) => void;
    update(): void {
    }

    async load() {

        
    }
    isCurrentGltfLevel() {
        return this.collections[this.current] instanceof GltfLevel;
    }
    updateLevel(reverse: boolean) {
        if (reverse) {
            this.current = this.current === 0 ? (this.collections.length - 1) : (this.current - 1)
        } else {
            this.current = (this.current + 1) % this.collections.length;
        }
    }
    checkTeleport(collision: string) {
        return this.collections[this.current].check(collision, "Teleport");
    }
    checkNeedExit(collision: string): boolean {
        return this.collections[this.current].check(collision, "Exit");
    }
    getCurrentLevelNode(name: string) {
        let node: Transform | undefined;
        this.collections[this.current].node.traverse(n => !!(n.name === name && (node = n)))
        return node;
    }
    init() {
    }
    start(): void {
    }
    request(scene: Transform) {
        scene.children.forEach((child, index) => (index === 0 || index === (this.current + 1)) ? (child.visible = true) : (child.visible = false))
        const level = this.collections[this.current];
            this.radius = level.max.distance(level.min) / 2 * devicePixelRatio;
            this.center.copy(level.max.clone().add(level.min.clone()).multiply(0.5));
            level.node.traverse(node => {
                const mesh = node;
                mesh.updateMatrixWorld();
                if (mesh.name && mesh.name.startsWith("Spawn")) {
                    mesh.visible = false;
                    scene.children[0].scale.set(radius3d, radius3d, radius3d)
                    this.onaddball && this.onaddball(mesh.worldMatrix, false)
                } else if (mesh instanceof Mesh) {
                    const attributeData = mesh.geometry.getPosition().data;
                    const indices = mesh.geometry.attributes.index?.data;
                    const name = mesh.parent?.name;
                    if (name) {
                        this.onaddmesh && this.onaddmesh(name, mesh.worldMatrix, [...attributeData || []], [...indices || []], {}, !!(mesh.parent?.extras as any)?.convex)
                    }
                }
            });
    }
}