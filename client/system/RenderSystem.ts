import { Camera, Geometry, GLTF, GLTFLoader, Mesh, OGLRenderingContext, Plane, Program, Renderer, RenderTarget, Sphere, Texture, Transform, Vec2, Vec3 } from "ogl";
import { System } from "./System.js";
import { Tiled } from "../misc/TiledParser.js";
import LevelSystem from "./LevelSystem.js";
import { WorkerMessage } from "../../worker/ammo.worker.js";
import { radius } from "../misc/radius.js";
import DracoTask from "../draco/DracoTask.js";
import { createProgram } from "../misc/createProgram.js";
import AnimationSystem from "./AnimationSystem.js";

export class RenderSystem implements System {
    readonly uiRoot = new Transform;
    readonly levelRoot = new Transform;
    private fragment: string = "";
    private ballVertex: string = "";
    private ballFragment: string = "";
    private vertex: string = "";
    private spriteFragment: string = "";
    private spriteVertex: string = "";
    private gltfFragment: string = "";
    private gltfVertex: string = "";
    get gl() {
        return this.renderer.gl;
    }
    private readonly textures: Texture[] = [];
    private readonly renderTargets: RenderTarget[] = [];
    private gltf?: GLTF;
    constructor(private readonly renderer: Renderer
        , private readonly camera: Camera
        , private readonly uiCamera: Camera
        , private readonly levelSystem: LevelSystem
        , private readonly animationSystem: AnimationSystem
    ) {
    }
    tiledData?: Tiled;
    async load(): Promise<void> {
        if (!this.tiledData) {
            throw new Error("tiledData is undefined");
        }
        this.ballVertex = await (await fetch("resources/glsl/simple.vert.sk")).text();
        this.ballFragment = await (await fetch("resources/glsl/simple.frag.sk")).text();
        this.vertex = await (await fetch("resources/glsl/level.vert.sk")).text();
        this.fragment = await (await fetch("resources/glsl/level.frag.sk")).text();
        this.spriteVertex = await (await fetch("resources/glsl/sprite.vert.sk")).text();
        this.spriteFragment = await (await fetch("resources/glsl/sprite.frag.sk")).text();
        this.gltfVertex = await (await fetch("resources/glsl/gltf.vert.sk")).text();
        this.gltfFragment = await (await fetch("resources/glsl/gltf.frag.sk")).text();
        const gl = this.gl;
        for await (const tileset of this.tiledData.tilesets) {
            if (tileset.image) {
                await new Promise((resoive) => {
                    const image = new Image();
                    image.onload = () => {
                        this.textures.push(new Texture(gl, {
                            image,
                            width: image.width,
                            height: image.height,
                            magFilter: gl.NEAREST,
                            minFilter: gl.NEAREST
                        }));
                        resoive(void (0));
                    };
                    image.src = `resources/tiled/${tileset.image}`;
                })
            }
        }


        const desc = GLTFLoader.unpackGLB(await (await fetch('resources/gltf/marble.glb')).arrayBuffer()) as any;
        const task = new DracoTask();

        const promiseMap = new Map<string, { resolve: () => void, reject: (reason?: any) => void, primitiveAccessors: Record<string, {}>, indicesAccessor: {} }>();
        const promises = new Array<Promise<void>>();
        task.postMessage = (data: any) => {
            if (data.type === 'decode') {
                const primitives = promiseMap.get(data.id)!.primitiveAccessors as Record<string, { bufferView: number }>;
                for (const attribute of data.geometry.attributes) {
                    const primitive = primitives[attribute.name];
                    const index = desc.buffers.push({ byteLength: attribute.array.byteLength, binary: attribute.array.buffer }) - 1;
                    const bufferViewIndex = desc.bufferViews.push({ buffer: index, byteOffset: 0, byteLength: attribute.array.byteLength }) - 1;
                    primitive.bufferView = bufferViewIndex;
                }
                {
                    const indices = promiseMap.get(data.id)!.indicesAccessor as { bufferView: number, componentType: number };
                    const index = desc.buffers.push({ byteLength: data.geometry.index.array.byteLength, binary: data.geometry.index.array.buffer }) - 1;
                    const bufferViewIndex = desc.bufferViews.push({ buffer: index, byteOffset: 0, byteLength: data.geometry.index.array.byteLength }) - 1;
                    indices.bufferView = bufferViewIndex;
                    indices.componentType = 5125;
                }
                promiseMap.get(data.id)!.resolve();
            }
        }
        let counter = 0;
        task.onmessage({ data: { type: 'init', id: (counter++).toString(), decoderConfig: { locateFile: () => "resources/wasm/draco_decoder_gltf.wasm" } } });
        const bufferViews = desc.bufferViews;
        const buffers = desc.buffers;
        const accessors = desc.accessors;
        const componentTypeToTypedArray = {
            5120: "Int8Array",
            5121: "Uint8Array",
            5122: "Int16Array",
            5123: "Uint16Array",
            5125: "Uint32Array",
            5126: "Float32Array",
        }
        for (const mesh of desc.meshes) {
            for (const primitive of mesh.primitives) {
                const { attributes, bufferView } = primitive.extensions.KHR_draco_mesh_compression;
                const bufferViewData = bufferViews[bufferView];
                const buffer = buffers[bufferViewData.buffer];
                const data = new Uint8Array(buffer.binary, bufferViewData.byteOffset, bufferViewData.byteLength);
                const primitiveAccessors: Record<string, {}> = {};
                const attributeTypedArrayNames = Object.keys(primitive.attributes).reduce<Record<string, string>>((prev, key) => {
                    const accessor = accessors[primitive.attributes[key]];
                    primitiveAccessors[key] = accessor;
                    prev[key] = componentTypeToTypedArray[accessor.componentType as keyof typeof componentTypeToTypedArray];
                    return prev;
                }, {});
                task.onmessage({
                    data: {
                        type: 'decode', id: (counter++).toString(), buffer: data, taskConfig: {
                            attributeIDs: attributes,
                            attributeTypes: attributeTypedArrayNames
                        }
                    }
                });
                promises.push(new Promise((resolve, reject) => {
                    promiseMap.set((counter - 1).toString(),
                        { resolve, reject, primitiveAccessors, indicesAccessor: accessors[primitive.indices] });
                }))
            }
        }
        await Promise.all(promises);
        this.gltf = await GLTFLoader.parse(gl, desc, "");
        this.gltf.scene.forEach(scene => {
            scene.traverse(node => {
                if (node instanceof Mesh) {
                    createProgram(node, false, this.gltfVertex, this.gltfFragment, true)
                }
            })
        })
        this.animationSystem.initAnimations(this.gltf);
    }
    init(): void {
        for (const scene of this.gltf?.scene || []) {
            for (const collection of scene.children) {
                if (collection.name === "others") {
                    const ball = collection.children.find(child => child.name === "Ball");
                    ball?.setParent(this.levelRoot);
                }
            }
        }
        for (const level of this.levelSystem.collections) {
            level.init()
            level.node.setParent(this.levelRoot);
        }
    }
    initCurrentLevel(current: number) {
        const level = this.levelSystem.collections[current];
        if (level.requested) {
            return;
        }
        const renderTarget = new RenderTarget(this.gl, {
            minFilter: this.gl.NEAREST,
            magFilter: this.gl.NEAREST,
            depth: false
        });
        this.renderTargets.push(renderTarget);
        level.setTextures(this.textures);
        level.initRenderTarget(renderTarget)
        level.initGraphicsBuffer(this.gl, this.vertex, this.fragment, this.spriteVertex, this.spriteFragment, renderTarget)
        level.initGraphics(renderTarget, this.gl, this.spriteVertex, this.spriteFragment, this.vertex, this.fragment);
        level.initGltfLevel(this.gltf);

    }
    update(timeStamp: number): void {

        this.renderer.render({ scene: this.levelRoot, camera: this.camera });
        this.renderer.render({ scene: this.uiRoot, camera: this.uiCamera, clear: false });
    }

    hideMesh(name: string, levelSystem: LevelSystem) {
        const scene = this.levelRoot;
        let child: Transform | undefined;
        if (name === "Ball") {
            child = scene.children.find(child => child.visible && (child instanceof Mesh))
        } else {
            child = scene.children[levelSystem.current + 1].children.find(child => child.visible && child.name === name)
        }
        child && (child.visible = false);
    }
    showMesh(name: string, levelSystem: LevelSystem) {
        const scene = this.levelRoot;
        let child: Transform | undefined;
        if (name === "Ball") {
            child = scene.children.find(child => child.visible && (child instanceof Mesh))
        } else {
            child = scene.children[levelSystem.current + 1].children.find(child => child.visible && child.name === name)
        }
        child && (child.visible = true);
    }

    updateMesh(message: WorkerMessage & { type: "update" }, levelSystem: LevelSystem) {
        const scene = this.levelRoot;
        scene.visible = true;
        for (let index = 0; index < message.objects.length; index++) {
            let child: Transform | undefined;
            const name = message.objects[index][7];
            child = scene.children.find(child => child.name === name);
            if (child === undefined) {
                child = scene.children[levelSystem.current + 1].children.find(child => child.name === name);
            }
            if (child) {
                const phyObject = message.objects[index];
                child.position.fromArray(phyObject.slice(0, 3) as number[])
                child.quaternion.fromArray(phyObject.slice(3, 7) as number[])
            }
        }
    }
}