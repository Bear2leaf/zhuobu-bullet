import { Geometry, Mesh, OGLRenderingContext, Plane, Program, Text, Texture, Transform, Vec3 } from "ogl";

export default class Button {
    private readonly font: string = "FiraSans-Bold";
    private readonly texture: Texture;
    private readonly releaseBgTexture: Texture;
    private readonly mesh: Mesh;
    private text?: Text;
    private fontData?: object;
    private fragment: string = "";
    private vertex: string = "";
    private bgFragment: string = "";
    private bgVertex: string = "";
    constructor(private readonly gl: OGLRenderingContext, name: string, private readonly position: Vec3, background = false) {

        this.texture = new Texture(gl);
        this.releaseBgTexture = new Texture(gl, {
            magFilter: gl.NEAREST,
            minFilter: gl.NEAREST,
        });
        const release = new Mesh(gl);
        release.name = name
        release.position.copy(position);
        const releaseBg = new Mesh(gl);
        releaseBg.setParent(release);
        releaseBg.visible = background;
        this.mesh = release;
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
        bgImage.onload = () => (this.releaseBgTexture.image = bgImage);
        bgImage.src = `resources/image/button_square_line.png`;
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
    init() {
        const gl = this.gl;
        const font = this.fontData;
        const program = new Program(gl, {
            vertex: this.vertex,
            fragment: this.fragment,
            transparent: true,
            cullFace: false,
            depthWrite: false,
            uniforms: { tMap: { value: this.texture }, uColor: { value: [0.2, 0.1, 0.3] } },

        });
        this.getMesh().program = program;
        this.getBgMesh().program = new Program(gl, {
            vertex: this.bgVertex,
            fragment: this.bgFragment,
            transparent: true,
            cullFace: false,
            depthWrite: false,
            uniforms: { tMap: { value: this.releaseBgTexture }, uDimension: { value: [0, 0] } },
        });
        this.text = new Text({
            font,
            text: "",
            align: "center",
        });
        this.generateText("RELEASE");
    }
    updateText(data: string) {
        const font = this.fontData;
        if (font === undefined) {
            throw new Error("font is undefined");
        }
        this.generateText(data);
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
        const dimension = [Math.abs(geometry.bounds.max.x - geometry.bounds.min.x) + 1, Math.abs(geometry.bounds.max.y - geometry.bounds.min.y) + 1];
        this.getMesh().geometry = geometry;
        this.getBgMesh().geometry = new Plane(gl, {
            width: dimension[0],
            height: dimension[1],
        });
        this.getBgMesh().program.uniforms.uDimension.value = dimension.map(x => 1 / x);
        this.getBgMesh().position.y = + offset / 2;
    }
}