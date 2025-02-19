import { Camera, GLTF, GLTFLoader, Mesh, OGLRenderingContext, Renderer, RenderTarget, Shadow, Texture, Transform } from "ogl";
import { PhysicsObject } from "../worker/ammo.worker.js";
import DracoTask from "../draco/DracoTask.js";
import { createProgram } from "../engine/createProgram.js";
import LevelSystem from "./LevelSystem.js";
import { System } from "./System.js";

export class RenderSystem implements System {
    readonly levelRoot = new Transform;
    private gltfFragment: string = "";
    private gltfVertex: string = "";
    private gltf?: GLTF;
    private _renderer?: Renderer;
    _shadow?: Shadow;
    oninitcameras?: (gl: OGLRenderingContext) => void;
    oninitui?: (gl: OGLRenderingContext) => void;
    oninitlevels?: (gltf: GLTF) => void;
    private get shadow() {
        if (!this._shadow) {
            throw new Error("shadow is not initialized");
        }
        return this._shadow;
    }
    private get renderer() {
        if (this._renderer === undefined) {
            throw new Error("renderer is not initialized");
        }
        return this._renderer;
    }
    private get gl() {
        return this.renderer.gl;
    }
    initRenderer(canvas: HTMLCanvasElement, windowInfo: WechatMinigame.WindowInfo) {
        const renderer = new Renderer({ dpr: windowInfo.pixelRatio, canvas, antialias: true, width: windowInfo.windowWidth, height: windowInfo.windowHeight });
        this._renderer = renderer;
        this.oninitcameras && this.oninitcameras(renderer.gl);
        this.oninitui && this.oninitui(renderer.gl);
    }
    async load(): Promise<void> {
        this.gltfVertex = await (await fetch("resources/glsl/gltf.vert.sk")).text();
        this.gltfFragment = await (await fetch("resources/glsl/gltf.frag.sk")).text();
        const gl = this.gl;


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
        task.onmessage({ data: { type: 'init', id: (counter++).toString(), decoderConfig: { locateFile: () => "resources/wasm/draco_decoder.wasm" } } });
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
                    const noCastShadow = node.program.gltfMaterial.name === "Transparent" || (node.program.gltfMaterial.extras && node.program.gltfMaterial.extras.castShadow === false);
                    createProgram(node, this.gltfVertex, this.gltfFragment, true, !noCastShadow)
                    node.program.uniforms.tShadow = { value: this.shadow.target.texture };
                    this.shadow.add({ mesh: node, cast: !noCastShadow, receive: true });
                }
            })
        })
        this.oninitanimations && this.oninitanimations(this.gltf);
    }
    oninitanimations?: (gltf: GLTF) => void;
    init(): void {
        this.gl.clearColor(0.3, 0.3, 0.6, 1);
    }
    start(): void {
        if (!this.gltf) {
            throw new Error("gltf not initialized");
        }
        for (const scene of this.gltf.scene) {
            for (const collection of scene.children) {
                if (collection.name === "others") {
                    const ball = collection.children.find(child => child.name === "Ball");
                    ball?.setParent(this.levelRoot);
                }
            }
        }
        this.oninitlevels && this.oninitlevels(this.gltf);
    }
    update(timeStamp: number): void {
        this.onrender && this.onrender(this.renderer, this.shadow);
    }
    onrender?: (renderer: Renderer, shadow: Shadow) => void;
    initCurrentLevel(current: number) {
        this.oninitlevel && this.oninitlevel(current, this.gltf);


    }
    oninitlevel?: (current: number, gltf: GLTF | undefined) => void;
    updateMesh(objects: PhysicsObject[], levelSystem: LevelSystem) {
        const scene = this.levelRoot;
        scene.visible = true;
        for (let index = 0; index < objects.length; index++) {
            let child: Transform | undefined;
            const name = objects[index][7];
            child = scene.children.find(child => child.name === name);
            if (child === undefined) {
                child = scene.children[levelSystem.current + 1].children.find(child => child.name === name);
            }
            if (child) {
                const phyObject = objects[index];
                child.position.fromArray(phyObject.slice(0, 3) as number[])
                child.quaternion.fromArray(phyObject.slice(3, 7) as number[])
            }
        }
    }
}