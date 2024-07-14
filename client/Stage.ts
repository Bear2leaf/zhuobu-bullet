import { Box, Camera, Mesh, Program, Renderer, Transform, Vec3, Plane, Sphere, GLTF, GLTFLoader, AttributeData, Orbit, GLTFProgram, Skin, Texture, Mat4, Quat, Euler } from "ogl";
import Device, { BodyId } from "./device/Device.js";
import { WorkerMessage } from "../worker/ammo.worker.js";
import UI from "./UI.js";
import { mat4 } from "gl-matrix";

function createProgram(node: Mesh, shadow: boolean, vertex?: string, fragment?: string, isWebgl2: boolean = true) {

    const gl = node.gl;
    const gltf = (node.program as GLTFProgram).gltfMaterial || {};

    const vertexPrefix = isWebgl2
        ? /* glsl */ `#version 300 es
            #define attribute in
            #define varying out
            #define texture2D texture
        `
        : ``;

    const fragmentPrefix = isWebgl2
        ? /* glsl */ `#version 300 es
            precision highp float;
            #define varying in
            #define texture2D texture
            #define gl_FragColor FragColor
            out vec4 FragColor;
        `
        : /* glsl */ `#extension GL_OES_standard_derivatives : enable
            precision highp float;
        `;

    let defines = `
            ${node.geometry.attributes.uv ? `#define UV` : ``}
            ${node.geometry.attributes.normal ? `#define NORMAL` : ``}
            ${node.geometry.isInstanced ? `#define INSTANCED` : ``}
            ${shadow ? `#define SHADOW` : ``}
            ${(node as Skin).boneTexture ? `#define SKINNING` : ``}
            ${gltf.alphaMode === 'MASK' ? `#define ALPHA_MASK` : ``}
            ${gltf.baseColorTexture ? `#define COLOR_MAP` : ``}
            ${gltf.normalTexture ? `#define NORMAL_MAP` : ``}
            ${gltf.metallicRoughnessTexture ? `#define RM_MAP` : ``}
            ${gltf.occlusionTexture ? `#define OCC_MAP` : ``}
            ${gltf.emissiveTexture ? `#define EMISSIVE_MAP` : ``}
            ${gltf.emissiveTexture ? `#define EMISSIVE_MAP` : ``}
        `;
    vertex = vertexPrefix + defines + vertex;
    fragment = fragmentPrefix + defines + fragment;
    const lutTexture = new Texture(gl);
    const envDiffuseTexture = new Texture(gl);
    const envSpecularTexture = new Texture(gl);
    const program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
            uBaseColorFactor: { value: gltf.baseColorFactor || [1, 1, 1, 1] },
            tBaseColor: { value: gltf.baseColorTexture ? gltf.baseColorTexture.texture : null },

            tRM: { value: gltf.metallicRoughnessTexture ? gltf.metallicRoughnessTexture.texture : null },
            uRoughness: { value: gltf.roughnessFactor !== undefined ? gltf.roughnessFactor : 1 },
            uMetallic: { value: gltf.metallicFactor !== undefined ? gltf.metallicFactor : 1 },

            tNormal: { value: gltf.normalTexture ? gltf.normalTexture.texture : null },
            uNormalScale: { value: gltf.normalTexture ? gltf.normalTexture.scale || 1 : 1 },

            tOcclusion: { value: gltf.occlusionTexture ? gltf.occlusionTexture.texture : null },

            tEmissive: { value: gltf.emissiveTexture ? gltf.emissiveTexture.texture : null },
            uEmissive: { value: gltf.emissiveFactor || [0, 0, 0] },

            tLUT: { value: lutTexture },
            tEnvDiffuse: { value: envDiffuseTexture },
            tEnvSpecular: { value: envSpecularTexture },
            uEnvDiffuse: { value: 0.5 },
            uEnvSpecular: { value: 0.5 },

            uLightDirection: { value: new Vec3(0, 1, 1) },
            uLightColor: { value: new Vec3(2.5) },

            uAlpha: { value: 1 },
            uAlphaCutoff: { value: gltf.alphaCutoff },
        },
        transparent: gltf.alphaMode === 'BLEND',
        cullFace: gltf.doubleSided ? false : gl.BACK,
    });
    (program as GLTFProgram).gltfMaterial = gltf;
    return program;
}
export default class Stage {
    private readonly renderer: Renderer;
    private readonly scene: Transform;
    private readonly camera: Camera;
    private readonly ui: UI;
    private readonly control: Orbit;
    private readonly gltfs: GLTF[] = [];
    private fragment: string = "";
    private vertex: string = "";
    private gltffragment: string = "";
    private gltfvertex: string = "";
    private started = false;
    onclick?: (tag?: string) => void;
    onorientationchange?: (quat: Quat) => void;
    private halfWidth: number = 0;
    private halfHeight: number = 0;
    private halfDepth: number = 0;

    constructor(device: Device) {
        const [width, height, dpr] = device.getWindowInfo();
        const renderer = this.renderer = new Renderer({ dpr, canvas: device.getCanvasGL() });
        const gl = renderer.gl;
        gl.clearColor(0.3, 0.3, 0.3, 1);
        const camera = this.camera = new Camera(gl, {
            aspect: width / height,
            fov: 45
        })
        camera.position.z = 0.5;
        renderer.setSize(width, height);
        this.scene = new Transform();
        this.ui = new UI(renderer);
        this.control = new Orbit(camera, {
            enableZoom: false,
            enablePan: false
        });
    }
    setBorder(halfWidth: number, halfHeight: number, halfDepth: number) {
        this.halfWidth = halfWidth;
        this.halfHeight = halfHeight;
        this.halfDepth = halfDepth
    }
    async load() {

        this.vertex = await (await fetch("resources/glsl/simple.vert.sk")).text();
        this.fragment = await (await fetch("resources/glsl/simple.frag.sk")).text();
        this.gltfvertex = await (await fetch("resources/glsl/gltf.vert.sk")).text();
        this.gltffragment = await (await fetch("resources/glsl/gltf.frag.sk")).text();
        await this.ui.load();

        this.gltfs.push(await GLTFLoader.load(this.renderer.gl, `resources/gltf/Demo.glb`));
        this.gltfs.push(await GLTFLoader.load(this.renderer.gl, `resources/gltf/Level0.glb`));
    }
    onaddmesh?: (total: number, vertices: number[], indices: number[], propertities?: Record<string, boolean>) => void;
    start() {
        const scene = this.scene;
        scene.scale.multiply(0.01);
        {
            this.ui.init();
            this.ui.onclick = (tag) => {
                this.onclick && this.onclick(tag);
            }
            this.ui.updateText("hello")
        }
        this.started = true;
    }
    stop() {
        // Stop next frame
        this.started = false;
    }

    removeBody(index: number) {
        const child = this.scene.children[index];
        child.setParent(null);
    }

    private readonly quat = new Quat()
    private readonly matrix = new Mat4();
    // Game loop
    loop = (timeStamp: number) => {
        if (!this.started) {
            return;
        }

        this.control.update();
        this.renderer.render({ scene: this.scene, camera: this.camera });
        this.ui.render();
        this.quat.fill(0)
        this.matrix.fromArray(this.camera.viewMatrix.multiply(this.scene.worldMatrix));
        this.matrix.getRotation(this.quat);
        this.onorientationchange && this.onorientationchange(this.quat)
    }
    updateBody(message: WorkerMessage & { type: "update" }) {
        const scene = this.scene;
        this.ui.updateText(`fps: ${message.currFPS}, avg: ${message.allFPS}`);
        for (let index = 0; index < message.objects.length; index++) {
            const child = scene.children[index];
            const phyObject = message.objects[index];
            child.position.fromArray(phyObject.slice(0, 3))
            child.quaternion.fromArray(phyObject.slice(3, 7))
        }
    }
    addBody(message: WorkerMessage & { type: "addBody" }) {
        const gl = this.renderer.gl;
        const vertex = this.vertex;
        const fragment = this.fragment;
        const id = message.data;
        const scene = this.scene;
        if (id === BodyId.Ball) {
            const program = new Program(this.renderer.gl, {
                vertex,
                fragment,
                uniforms: {
                    uColor: {
                        value: new Vec3(0.2, 0.8, 1.0)
                    }
                }
            });
            const geometry = new Sphere(gl, { radius: 1 });
            const mesh = new Mesh(gl, {
                geometry,
                program,
            });
            mesh.setParent(scene);
        } else {
            const program = new Program(this.renderer.gl, {
                vertex,
                fragment,
                // Don't cull faces so that plane is double sided - default is gl.BACK
                uniforms: {
                    uColor: {
                        value: new Vec3(1, 1, 1)
                    }
                }
            });
            const width = ((BodyId.WallRight === id || BodyId.WallLeft === id) ? this.halfDepth : this.halfWidth) * 2;
            const height = ((BodyId.WallTop === id || BodyId.WallBottom === id) ? this.halfDepth : this.halfHeight) * 2;
            const geometry = new Plane(gl, { width, height, });
            const mesh = new Mesh(gl, {
                geometry,
                program,
            });
            mesh.setParent(scene);
        }
    }
    resetLevel() {
        const keepLength = Object.keys(BodyId).length / 2;
        const children = this.scene.children;
        while (children.length > keepLength) {
            const child = children.pop();
            child?.setParent(null);
        }
    }
    level = 0;
    requestLevel() {
        const gltf = this.gltfs[this.level];
        const scene = this.scene;
        const total = gltf.meshes.map(mesh => mesh.primitives.length).reduce((prev, cur) => {
            prev += cur;
            return prev;
        }, 0)
        gltf.meshes.forEach(mesh => {
            mesh.primitives.forEach(primitive => {
                primitive.setParent(scene)
                primitive.program = createProgram(primitive, false, this.gltfvertex, this.gltffragment, true)
                const attributeData = primitive.geometry.getPosition().data;
                const indices = primitive.geometry.attributes.index.data as AttributeData;
                attributeData && this.onaddmesh && this.onaddmesh(total, [...attributeData], [...indices], primitive.extras as Record<string, boolean> | undefined);
            })
        });
        this.level = (this.level + 1) % this.gltfs.length;
    }

}


