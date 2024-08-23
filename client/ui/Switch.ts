import { Geometry, Mesh, OGLRenderingContext, Plane, Program, Text, Texture, Transform, Vec3 } from "ogl";
import UIElement from "./UIElement.js";

export default class Switch implements UIElement {
    private readonly textureOn: Texture;
    private readonly textureOff: Texture;
    private readonly textureOnDown: Texture;
    private readonly textureOffDown: Texture;
    private readonly mesh: Mesh;
    private fragment: string = "";
    private vertex: string = "";
    constructor(private readonly gl: OGLRenderingContext, name: string, position: Vec3) {

        this.textureOn = new Texture(gl);
        this.textureOff = new Texture(gl);
        this.textureOnDown = new Texture(gl);
        this.textureOffDown = new Texture(gl);
        const mesh = new Mesh(gl);
        mesh.name = name
        mesh.position.copy(position);
        this.mesh = mesh;
    }
    async load() {

        this.vertex = await (await fetch("resources/glsl/sprite.vert.sk")).text();
        this.fragment = await (await fetch("resources/glsl/sprite.frag.sk")).text();
        const imageOn = new Image();
        imageOn.onload = () => (this.textureOn.image = imageOn);
        imageOn.src = `resources/image/${this.mesh.name}_on.png`;
        const imageOff = new Image();
        imageOff.onload = () => (this.textureOff.image = imageOff);
        imageOff.src = `resources/image/${this.mesh.name}_off.png`;
        const imageOnDown = new Image();
        imageOnDown.onload = () => (this.textureOnDown.image = imageOnDown);
        imageOnDown.src = `resources/image/${this.mesh.name}_on_down.png`;
        const imageOffDown = new Image();
        imageOffDown.onload = () => (this.textureOffDown.image = imageOffDown);
        imageOffDown.src = `resources/image/${this.mesh.name}_off_down.png`;
    }
    hide() {
        this.getMesh().visible = false;
    }
    show() {
        this.getMesh().visible = true;
    }
    on() {
        this.getMesh().program.uniforms.tMap.value = this.textureOn;
    }
    off() {
        this.getMesh().program.uniforms.tMap.value = this.textureOff;
    }
    isDown(): boolean {
        return this.getMesh().program.uniforms.tMap.value === this.textureOffDown ||
            this.getMesh().program.uniforms.tMap.value === this.textureOnDown;
    }
    down() {
        if (this.getMesh().program.uniforms.tMap.value === this.textureOff) {
            this.getMesh().program.uniforms.tMap.value = this.textureOffDown;
        } else if (this.getMesh().program.uniforms.tMap.value === this.textureOn) {
            this.getMesh().program.uniforms.tMap.value = this.textureOnDown;
        }
    }
    release() {
        if (this.getMesh().program.uniforms.tMap.value === this.textureOffDown) {
            this.getMesh().program.uniforms.tMap.value = this.textureOff;
        } else if (this.getMesh().program.uniforms.tMap.value === this.textureOnDown) {
            this.getMesh().program.uniforms.tMap.value = this.textureOn;
        }
    }
    getMesh() {
        return this.mesh;
    }
    setParent(scene: Transform) {
        this.getMesh().setParent(scene);
    }
    init() {
        const gl = this.gl;
        const program = new Program(gl, {
            vertex: this.vertex,
            fragment: this.fragment,
            transparent: true,
            cullFace: false,
            depthWrite: false,
            uniforms: { tMap: { value: this.textureOn } },

        });
        const geometry = new Plane(gl, { width: 2, height: 2 })
        this.getMesh().program = program;
        this.getMesh().geometry = geometry;
    }
}