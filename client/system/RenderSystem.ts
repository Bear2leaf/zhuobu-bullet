import { GLTF, GLTFLoader, Mesh, OGLRenderingContext, Renderer, RenderTarget, Texture, Transform } from "ogl";
import { PhysicsObject } from "../../worker/ammo.worker.js";
import DracoTask from "../draco/DracoTask.js";
import { createProgram } from "../misc/createProgram.js";
import LevelSystem from "./LevelSystem.js";
import { System } from "./System.js";

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
    private readonly textures: Texture[] = [];
    private readonly renderTargets: RenderTarget[] = [];
    private gltf?: GLTF;
    private readonly images: string[] = [];
    private _renderer?: Renderer;
    oninitcameras?: (gl: OGLRenderingContext) => void;
    oninitui?: (gl: OGLRenderingContext) => void;
    oninitlevels?: () => void;

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
        this.ballVertex = await (await fetch("resources/glsl/simple.vert.sk")).text();
        this.ballFragment = await (await fetch("resources/glsl/simple.frag.sk")).text();
        this.vertex = await (await fetch("resources/glsl/level.vert.sk")).text();
        this.fragment = await (await fetch("resources/glsl/level.frag.sk")).text();
        this.spriteVertex = await (await fetch("resources/glsl/sprite.vert.sk")).text();
        this.spriteFragment = await (await fetch("resources/glsl/sprite.frag.sk")).text();
        this.gltfVertex = await (await fetch("resources/glsl/gltf.vert.sk")).text();
        this.gltfFragment = await (await fetch("resources/glsl/gltf.frag.sk")).text();
        const gl = this.gl;
        for await (const imageSrc of this.images) {
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
                image.src = `resources/tiled/${imageSrc}`;
            })
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
                    createProgram(node, this.gltfVertex, this.gltfFragment, true)
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
        for (const scene of this.gltf?.scene || []) {
            for (const collection of scene.children) {
                if (collection.name === "others") {
                    const ball = collection.children.find(child => child.name === "Ball");
                    ball?.setParent(this.levelRoot);
                }
            }
        }
        this.oninitlevels && this.oninitlevels();
    }
    update(timeStamp: number): void {
        this.onrender && this.onrender(this.renderer);
    }
    onrender?: (renderer: Renderer) => void;
    setImages(images: string[]) {
        this.images.push(...images);
    }
    initCurrentLevel(current: number) {
        const renderTarget = new RenderTarget(this.gl, {
            minFilter: this.gl.NEAREST,
            magFilter: this.gl.NEAREST,
            depth: false
        });
        this.renderTargets.push(renderTarget);
        this.oninitlevel && this.oninitlevel(current, renderTarget, this.textures, this.gl, this.gltf, this.vertex, this.fragment, this.spriteVertex, this.spriteFragment);
        

    }
    oninitlevel?: (current: number, renderTarget: RenderTarget, textures: Texture[], gl: OGLRenderingContext, gltf: GLTF | undefined, vertex: string, fragment: string, spriteVertex: string, spriteFragment: string) => void;
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