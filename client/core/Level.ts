import { Mesh, GLTFProgram, Vec3, GLTFLoader, AttributeData, OGLRenderingContext, Transform, Box, Raycast, Vec2, Renderer, Camera, Mat4, GLTFMesh, Euler, Quat, GLTFMaterial } from "ogl";
import { createProgram } from "../misc/createProgram";

export default class Level {

    private readonly mouse = new Vec2();
    private readonly collections: Transform[] = [];
    private readonly light = { value: new Vec3() };
    private gltffragment: string = "";
    private gltfvertex: string = "";
    private current = 0;
    radius = 0;
    mazeMode = false;
    onaddmesh?: (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>) => void;
    onaddball?: (transform: number[]) => void;
    constructor(private readonly gl: OGLRenderingContext) {
    }
    getIndex() {
        return (this.current + this.collections.length - 1) % this.collections.length;
    }
    async load() {

        this.gltfvertex = await (await fetch("resources/glsl/gltf.vert.sk")).text();
        this.gltffragment = await (await fetch("resources/glsl/gltf.frag.sk")).text();
        const gltf = (await GLTFLoader.load(this.gl, `resources/gltf/Maze.glb`));
        if (gltf.lights.directional[0].direction) {
            this.light.value = gltf.lights.directional[0].direction.value.multiply(new Vec3(1, 1, 1)).normalize();
        }
        gltf.scene[0].children.find(child => child.name === "MISC")?.setParent(null);
        for (let index = 0; index < gltf.scene[0].children.length; index++) {
            this.collections.push(gltf.scene[0].children[index]);
        }
    }
    setIndex(level: number) {
        this.current = level;
    }
    request(scene: Transform, reverse = false) {
        this.collections.forEach((collection) => collection.visible = false);
        if (reverse) {
            this.current--;
            if (this.current < 0) {
                this.current = this.collections.length - 1;
            }
            this.current--;
            if (this.current < 0) {
                this.current = this.collections.length - 1;
            }
        }
        const collection = this.collections[this.current];
        let maxRadius = 0;
        collection.children.forEach((child) => {
            const primitive = child.children[0] as Mesh & { program: GLTFProgram };
            const primitiveExtras = primitive.extras && (primitive.extras as Record<string, boolean>);
            const materialExtras = primitive.program.gltfMaterial?.extras && (primitive.program?.gltfMaterial?.extras as Record<string, boolean>);
            const extras = {...primitiveExtras, ...materialExtras};
            primitive.program = createProgram(primitive, false, this.gltfvertex, this.gltffragment, true, { direction: this.light })
            if (this.onaddball && extras?.spawnPoint) {
                this.onaddball(child.matrix.toArray())
                this.mazeMode = extras.mazeMode;
                return;
            }
            const attributeData = primitive.geometry.getPosition().data;
            const indices = primitive.geometry.attributes.index.data as AttributeData;
            attributeData && this.onaddmesh && this.onaddmesh(child.name, child.matrix, [...attributeData], [...indices], extras);
            child.visible = true;
            primitive.geometry.computeBoundingSphere();
            maxRadius = Math.max(maxRadius, primitive.geometry.bounds.radius);
        });
        this.radius = maxRadius;
        collection.visible = true;
        collection.parent?.setParent(scene)
        this.current = (this.current + 1) % this.collections.length;
    }
}