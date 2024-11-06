import { Geometry, Mesh, OGLRenderingContext, Plane, Program, Text, Texture, Transform, Vec3 } from "ogl";
import UIElement from "./UIElement.js";

export default class LevelIndicator implements UIElement {
    private readonly mesh: Mesh;
    private fragment: string = "";
    private vertex: string = "";
    private readonly uCurrent: { value: number } = { value: 0 };
    private next: number = 0;
    private total: number = 6;
    constructor(private readonly gl: OGLRenderingContext, name: string, position: Vec3) {

        const mesh = new Mesh(gl);
        mesh.name = name
        mesh.position.copy(position);
        this.mesh = mesh;
    }
    confirm() {
        if (this.next === this.uCurrent.value) {
            return;
        }
        this.next = Math.round(this.uCurrent.value);
        this.onselectlevel && this.onselectlevel(this.next);
    }
    update(timeStamp: number) {
        if (this.uCurrent.value < this.next) {
            this.uCurrent.value = Math.min(this.next, this.uCurrent.value + timeStamp);
        } else if (this.uCurrent.value > this.next) {
            this.uCurrent.value = Math.max(this.next, this.uCurrent.value - timeStamp);
        }
    }
    updateTotal(total: number, specials: Set<number>) {
        this.total = total;
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

        const gl = this.gl;
        const program = new Program(gl, {
            vertex: vertexPrefix + this.vertex,
            fragment: fragmentPrefix + this.fragment,
            transparent: true,
            uniforms: {
                uCurrent: this.uCurrent
            }
        });
        const arr = new Float32Array(this.total * 2);
        for (let i = 0; i < this.total * 2; i += 2) {
            arr[i] = i / 2;
            arr[i + 1] = specials.has(i / 2) ? 1 : 0;
        }
        const geometry = new Geometry(gl, {
            position: { size: 2, data: arr },
        });
        this.getMesh().program = program;
        this.getMesh().geometry = geometry;
        this.getMesh().mode = gl.POINTS;
        this.getMesh().geometry.computeBoundingSphere();
    }
    updateCurrent(delta: number, exact = false) {
        if (exact) {
            this.next = delta;
            return;
        }
        this.uCurrent.value += delta;
        if (this.uCurrent.value < 0) {
            this.uCurrent.value = 0;
        } else if (this.uCurrent.value > this.total - 1) {
            this.uCurrent.value = this.total - 1;
        }
    }
    getCurrent() {
        return Math.round(this.uCurrent.value);
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

    }
    onselectlevel?: (level: number) => void;
}