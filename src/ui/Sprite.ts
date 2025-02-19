import { Geometry, Mesh, OGLRenderingContext, Plane, Program, Text, Texture, Transform, Vec3 } from "ogl";
import UIElement from "./UIElement.js";

export default class Sprite implements UIElement{
    private readonly texture: Texture;
    private readonly textureDown: Texture;
    private readonly mesh: Mesh;
    private fragment: string = "";
    private vertex: string = "";
    constructor(private readonly gl: OGLRenderingContext, name: string, position: Vec3) {

        this.texture = new Texture(gl);
        this.textureDown = new Texture(gl);
        const mesh = new Mesh(gl);
        mesh.name = name
        mesh.position.copy(position);
        this.mesh = mesh;
    }
    async load() {

        this.vertex = await (await fetch("resources/glsl/sprite.vert.sk")).text();
        this.fragment = await (await fetch("resources/glsl/sprite.frag.sk")).text();
        const image = new Image();
        image.onload = () => (this.texture.image = image);
        image.src = `resources/image/${this.mesh.name}.png`;
        const imageDown = new Image();
        imageDown.onload = () => (this.textureDown.image = imageDown);
        imageDown.src = `resources/image/${this.mesh.name}_down.png`;
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
        return this.getMesh().program.uniforms.tMap.value === this.textureDown;
    }
    down() {
        this.getMesh().program.uniforms.tMap.value = this.textureDown;
    }
    release() {
        this.getMesh().program.uniforms.tMap.value = this.texture;
    }
    init() {
        const gl = this.gl;
        const program = new Program(gl, {
            vertex: this.vertex,
            fragment: this.fragment,
            transparent: true,
            uniforms: { tMap: { value: this.texture } },

        });
        const geometry = new Plane(gl, { width: 2, height: 2 })
        this.getMesh().program = program;
        this.getMesh().geometry = geometry;
    }
}