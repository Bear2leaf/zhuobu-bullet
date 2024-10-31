import { Geometry, Mesh, OGLRenderingContext, Plane, Program, Text, Texture, Transform, Vec3 } from "ogl";
import UIElement from "./UIElement.js";

export default class Button implements UIElement {
    private readonly font: string = "ZCOOLQingKeHuangYou-Regular";
    private readonly texture: Texture;
    private readonly bgTexture: Texture;
    private readonly bgTextureDown: Texture;
    private readonly mesh: Mesh;
    private text?: Text;
    private fontData?: object;
    private fragment: string = "";
    private vertex: string = "";
    private bgFragment: string = "";
    private bgVertex: string = "";
    constructor(private readonly gl: OGLRenderingContext, name: string, private readonly position: Vec3, background = false, private readonly type: 0 | 1 = 0) {

        this.texture = new Texture(gl);
        this.bgTexture = new Texture(gl, {
            magFilter: gl.NEAREST,
            minFilter: gl.NEAREST,
        });
        this.bgTextureDown = new Texture(gl, {
            magFilter: gl.NEAREST,
            minFilter: gl.NEAREST,
        });
        const mesh = new Mesh(gl);
        mesh.name = name
        mesh.position.copy(position);
        const releaseBg = new Mesh(gl);
        releaseBg.setParent(mesh);
        releaseBg.visible = background;
        this.mesh = mesh;
    }
    async load() {

        this.vertex = await (await fetch("resources/glsl/text.vert.sk")).text();
        this.fragment = await (await fetch("resources/glsl/text.frag.sk")).text();
        this.bgVertex = await (await fetch("resources/glsl/image.vert.sk")).text();
        this.bgFragment = await (await fetch("resources/glsl/image.frag.sk")).text();
        this.fontData = await (await fetch(`resources/font/${this.font}.json`)).json();
        const image = new Image();
        image.onload = () => (this.texture.image = image);
        image.src = `resources/font/${this.font}.png`;
        const bgImage = new Image();
        bgImage.onload = () => (this.bgTexture.image = bgImage);
        bgImage.src = `resources/image/${this.type === 0 ? "input_square" : "input_square"}.png`;
        const bgImageDown = new Image();
        bgImageDown.onload = () => (this.bgTextureDown.image = bgImageDown);
        bgImageDown.src = `resources/image/${this.type === 0 ? "input_square_down" : "input_square_down"}.png`;
    }
    getMesh() {
        return this.mesh;
    }
    getBgMesh() {
        const mesh = this.getMesh();
        const bgMesh = mesh.children[0];
        if (bgMesh === undefined || !(bgMesh instanceof Mesh)) {
            throw new Error("bgMesh in undefined");
        }
        return bgMesh as Mesh;
    }
    setParent(scene: Transform) {
        this.getMesh().setParent(scene);
    }
    isDown(): boolean {
        return this.getBgMesh().program.uniforms.tMap.value === this.bgTextureDown;
    }
    down() {
        this.getBgMesh().program.uniforms.tMap.value = this.bgTextureDown;
    }
    release() {
        this.getBgMesh().program.uniforms.tMap.value = this.bgTexture;
    }
    init() {
        const gl = this.gl;
        const font = this.fontData;
        const color = [0.2, 0.1, 0.3];
        if (this.type === 1) {
            // color.fill(0)
        }
        const program = new Program(gl, {
            vertex: this.vertex,
            fragment: this.fragment,
            transparent: true,
            cullFace: false,
            depthWrite: false,
            uniforms: { tMap: { value: this.texture }, uColor: { value: color } },

        });
        this.getMesh().visible = false;
        this.getMesh().program = program;
        this.getBgMesh().program = new Program(gl, {
            vertex: this.bgVertex,
            fragment: this.bgFragment,
            transparent: true,
            cullFace: false,
            depthWrite: false,
            uniforms: { tMap: { value: this.bgTexture }, uDimension: { value: [0, 0] } },
        });
        this.text = new Text({
            font,
            text: "",
            align: "center",
        });
        this.generateText("");
    }
    generateText(data: string) {
        const gl = this.gl;
        const text = this.text;
        if (text === undefined) {
            throw new Error("text is undefined");
        }
        text.update({ text: data });
        const geometry = new Geometry(gl, {
            position: { size: 3, data: text.buffers.position },
            uv: { size: 2, data: text.buffers.uv },
            // id provides a per-character index, for effects that may require it
            id: { size: 1, data: text.buffers.id },
            index: { data: text.buffers.index },
        });
        geometry.computeBoundingBox();
        const offset = geometry.bounds.max.y + geometry.bounds.min.y;
        const padding = this.type === 0 ? 1 : 2;
        const dimension = [Math.abs(geometry.bounds.max.x - geometry.bounds.min.x) + padding, Math.abs(geometry.bounds.max.y - geometry.bounds.min.y) + padding];
        this.getMesh().geometry = geometry;
        this.getBgMesh().geometry = new Plane(gl, {
            width: dimension[0],
            height: dimension[1],
        });
        this.getBgMesh().program.uniforms.uDimension.value = dimension.map(x => 1 / x);
        this.getBgMesh().position.y = + offset / 2;
    }
}