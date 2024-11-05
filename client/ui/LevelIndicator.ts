import { Geometry, Mesh, OGLRenderingContext, Plane, Program, Text, Texture, Transform, Vec3 } from "ogl";
import UIElement from "./UIElement.js";

export default class LevelIndicator implements UIElement {
    private readonly mesh: Mesh;
    private fragment: string = "";
    private vertex: string = "";
    constructor(private readonly gl: OGLRenderingContext, name: string, position: Vec3) {

        const mesh = new Mesh(gl);
        mesh.name = name
        mesh.position.copy(position);
        this.mesh = mesh;
    }
    async load() {
        this.vertex = await (await fetch(`resources/glsl/${this.mesh.name}.vert.sk`)).text();
        this.fragment = await (await fetch(`resources/glsl/${this.mesh.name}.frag.sk`)).text();

    }
    hide() {
        this.getMesh().visible = false;
    }
    show() {
        this.getMesh().visible = true;
    }
    getMesh() {
        return this.mesh;
    }
    setParent(scene: Transform) {
        this.getMesh().setParent(scene);
    }
    isDown(): boolean {
        return false;
    }
    down() {
    }
    release() {
    }
    init() {
        const gl = this.gl;

        const vertexPrefix =  /* glsl */ `#version 300 es
                #define attribute in
                #define varying out
                #define texture2D texture
            `;

        const fragmentPrefix =  /* glsl */ `#version 300 es
                precision highp float;
                #define varying in
                #define texture2D texture
                #define gl_FragColor FragColor
                out vec4 FragColor;
            `;

        const program = new Program(gl, {
            vertex: vertexPrefix + this.vertex,
            fragment: fragmentPrefix + this.fragment,
            transparent: true,
            uniforms: {
                uCurrent: { value: 3 }
            }
        });
        const geometry = new Geometry(gl, {
            position: { size: 1, data: new Float32Array([0, 1, 2, 3, 4, 5, 6]) },
        });
        this.getMesh().program = program;
        this.getMesh().geometry = geometry;
        this.getMesh().mode = gl.POINTS;
    }
}