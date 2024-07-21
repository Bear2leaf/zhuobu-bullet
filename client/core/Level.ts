import { Mesh, GLTFProgram, Skin, Texture, Program, Vec3, GLTF, GLTFLoader, AttributeData, OGLRenderingContext, Transform, Box, Raycast, Vec2, Renderer, Camera, Mat4 } from "ogl";

function createProgram(node: Mesh, shadow: boolean, vertex?: string, fragment?: string, isWebgl2: boolean = true, light?: GLTF["lights"]["directional"][0]) {

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
            uEnvDiffuse: { value: 1 },
            uEnvSpecular: { value: 1 },

            uLightDirection: light?.direction || { value: new Vec3(0, 1, 1) },
            uLightColor: { value: new Vec3(1) },

            uAlpha: { value: 1 },
            uAlphaCutoff: { value: gltf.alphaCutoff },
        },
        transparent: gltf.alphaMode === 'BLEND',
        cullFace: gltf.doubleSided ? false : gl.BACK,
    });
    (program as GLTFProgram).gltfMaterial = gltf;
    return program;
}
export default class Level {

    private readonly mouse = new Vec2();
    private readonly gltfs: GLTF[] = new Array(6);
    private gltffragment: string = "";
    private gltfvertex: string = "";
    private current = 0;
    private readonly identity = new Mat4().identity();
    onclick?: (tag?: string) => void;
    onaddmesh?: (transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>) => void;
    constructor(private readonly gl: OGLRenderingContext) {
    }
    getIndex() {
        return (this.current + this.gltfs.length - 1) % this.gltfs.length;
    }
    async load() {

        this.gltfvertex = await (await fetch("resources/glsl/gltf.vert.sk")).text();
        this.gltffragment = await (await fetch("resources/glsl/gltf.frag.sk")).text();
        for (let index = 0; index < this.gltfs.length; index++) {
            this.gltfs[index] = (await GLTFLoader.load(this.gl, `resources/gltf/Level${index}.glb`));
        }
    }
    setIndex(level: number) {
        this.current = level;
    }
    request(scene: Transform) {
        const gltf = this.gltfs[this.current];
        gltf.meshes.forEach(mesh => {
            mesh.primitives.forEach(primitive => {
                primitive.program = createProgram(primitive, false, this.gltfvertex, this.gltffragment, true, gltf.lights.directional[0])
                const attributeData = primitive.geometry.getPosition().data;
                const indices = primitive.geometry.attributes.index.data as AttributeData;
                const transform = primitive.parent?.worldMatrix || this.identity;
                primitive.parent?.setParent(scene)
                attributeData && this.onaddmesh && this.onaddmesh(transform, [...attributeData], [...indices], primitive.extras as Record<string, boolean> | undefined);
            })
        });
        this.current = (this.current + 1) % this.gltfs.length;
    }
}