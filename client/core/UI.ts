import { Camera, Geometry, Mesh, Program, Raycast, Renderer, Text, Texture, Transform, Vec2 } from "ogl";

export default class UI {
    private readonly camera: Camera;
    private readonly scene: Transform;
    private readonly font: string = "FiraSans-Bold";
    private readonly texture: Texture;
    private readonly mouse = new Vec2();
    private text?: Text;
    private fontData?: object;
    private fragment: string = "";
    private vertex: string = "";
    onclick?: (tag?: string) => void;
    constructor(private readonly renderer: Renderer) {
        const gl = this.renderer.gl;
        const { width, height, dpr } = this.renderer;
        const ratio = width / height;

        const camera = this.camera = new Camera(gl, {
            left: ratio * -5 * dpr,
            right: ratio * 5 * dpr,
            top: 5 * dpr,
            bottom: -5 * dpr
        })
        this.camera.position.z = 1;
        this.scene = new Transform();
        this.texture = new Texture(gl);
        const mesh = new Mesh(gl);
        mesh.name = "text"
        mesh.setParent(this.scene);

        const mouse = this.mouse;
        // Create a raycast object
        const raycast = new Raycast();
        const touch = (e: { x: number, y: number }) => {
            mouse.set(2.0 * (e.x / renderer.width) - 1.0, 2.0 * (1.0 - e.y / renderer.height) - 1.0);

            // Update the ray's origin and direction using the camera and mouse
            raycast.castMouse(camera, mouse);


            // raycast.intersectBounds will test against the bounds of each mesh, and
            // return an array of intersected meshes in order of closest to farthest
            const hits = raycast.intersectBounds([mesh]);

            // Can intersect with geometry if the bounds aren't enough, or if you need
            // to find out the uv or normal value at the hit point.
            // Optional arguments include backface culling `cullFace`, and `maxDistance`
            // Both useful for doing early exits to help optimise.
            // const hits = raycast.intersectMeshes(meshes, {
            //     cullFace: true,
            //     maxDistance: 10,
            //     includeUV: true,
            //     includeNormal: true,
            // });
            // if (hits.length) console.log(hits[0].hit.uv);

            // Update our feedback using this array
            hits.forEach(hit => this.onclick && this.onclick(hit.name))
        }

        document.addEventListener("click", touch)
        document.addEventListener("touchstart", (e) => touch({ x: e.touches[0].pageX, y: e.touches[0].pageY }))
    }
    getMesh(name: string) {
        const mesh = this.scene.children.find(t => t.name === name && t instanceof Mesh) as Mesh;
        if (mesh === undefined) {
            throw new Error("mesh in undefined: " + name);
        }
        return mesh;
    }
    async load() {
        const gl = this.renderer.gl;
        this.vertex = await (await fetch("resources/glsl/text.vert.sk")).text();
        this.fragment = await (await fetch("resources/glsl/text.frag.sk")).text();

        this.fontData = await (await fetch(`resources/fonts/${this.font}.json`)).json();
        const image = new Image();
        image.onload = () => (this.texture.image = image);
        image.src = `resources/fonts/${this.font}.png`;
        this.getMesh("text").program = new Program(gl, {
            vertex: this.vertex,
            fragment: this.fragment,
            transparent: true,
            cullFace: false,
            depthWrite: false,
            uniforms: { tMap: { value: this.texture } },

        })
    }
    init() {
        const gl = this.renderer.gl;
        const font = this.fontData;
        const text = this.text = new Text({
            font,
            text: "",
            align: "center",
        });
        this.getMesh("text").geometry = new Geometry(gl, {
            position: { size: 3, data: text.buffers.position },
            uv: { size: 2, data: text.buffers.uv },
            // id provides a per-character index, for effects that may require it
            id: { size: 1, data: text.buffers.id },
            index: { data: text.buffers.index },
        });
    }
    updateText(data: string) {
        const font = this.fontData;
        const context = this.renderer.gl;
        if (font === undefined) {
            throw new Error("font is undefined");
        }
        const text = this.text;
        if (text === undefined) {
            throw new Error("text is undefined");
        }
        text.update({ text: data });
        this.getMesh("text").geometry = new Geometry(context, {
            position: { size: 3, data: text.buffers.position },
            uv: { size: 2, data: text.buffers.uv },
            // id provides a per-character index, for effects that may require it
            id: { size: 1, data: text.buffers.id },
            index: { data: text.buffers.index },
        });
    }
    render() {
        this.renderer.render({ scene: this.scene, camera: this.camera, clear: false })
    }
}