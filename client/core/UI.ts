import { Camera, Geometry, Mesh, Plane, Program, Raycast, Renderer, Text, Texture, Transform, Vec2 } from "ogl";

export default class UI {
    private readonly camera: Camera;
    private readonly scene: Transform;
    private readonly font: string = "FiraSans-Bold";
    private readonly texture: Texture;
    private readonly releaseBgTexture: Texture;
    private readonly mouse = new Vec2();
    private text?: Text;
    private fontData?: object;
    private fragment: string = "";
    private vertex: string = "";
    private bgFragment: string = "";
    private bgVertex: string = "";
    onclick?: (tag?: string) => void;
    constructor(private readonly renderer: Renderer) {
        const gl = this.renderer.gl;
        const { width, height, dpr } = this.renderer;
        const ratio = width / height;

        const camera = this.camera = new Camera(gl, {
            left: ratio * -5 * dpr,
            right: ratio * 5 * dpr,
            top: 0,
            bottom: -10 * dpr
        })
        this.camera.position.z = 1;
        this.scene = new Transform();
        this.texture = new Texture(gl);
        this.releaseBgTexture = new Texture(gl, {
            magFilter: gl.NEAREST,
            minFilter: gl.NEAREST,
        });
        const info = new Mesh(gl);
        info.name = "text"
        info.setParent(this.scene);
        const release = new Mesh(gl);
        release.name = "release"
        release.position.y = -9 * dpr;
        release.setParent(this.scene);

        const releaseBg = new Mesh(gl);
        releaseBg.setParent(release);

        const mouse = this.mouse;
        // Create a raycast object
        const raycast = new Raycast();
        const touch = (e: { x: number, y: number }) => {
            mouse.set(2.0 * (e.x / renderer.width) - 1.0, 2.0 * (1.0 - e.y / renderer.height) - 1.0);

            // Update the ray's origin and direction using the camera and mouse
            raycast.castMouse(camera, mouse);


            // raycast.intersectBounds will test against the bounds of each mesh, and
            // return an array of intersected meshes in order of closest to farthest
            const hits = raycast.intersectBounds([info, releaseBg]);

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
            hits.forEach(hit => {
                this.onclick && this.onclick(hit.name || hit.parent?.name)
            })
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
    getBgMesh(name: string) {
        const mesh = this.getMesh(name);
        const bgMesh = mesh.children[0];
        if (bgMesh === undefined || !(bgMesh instanceof Mesh)) {
            throw new Error("bgMesh in undefined: " + name);
        }
        return bgMesh as Mesh;
    }
    async load() {
        const gl = this.renderer.gl;
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
        const program = new Program(gl, {
            vertex: this.vertex,
            fragment: this.fragment,
            transparent: true,
            cullFace: false,
            depthWrite: false,
            uniforms: { tMap: { value: this.texture }, uColor: { value: [0.2, 0.1, 0.3] } },

        });
        this.getMesh("text").program = program;
        this.getMesh("release").program = program;
        this.getBgMesh("release").program = new Program(gl, {
            vertex: this.bgVertex,
            fragment: this.bgFragment,
            transparent: true,
            cullFace: false,
            depthWrite: false,
            uniforms: { tMap: { value: this.releaseBgTexture }, uDimension: { value: [0, 0] } },
        });
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
        const releaseText = this.text = new Text({
            font,
            text: "RELEASE",
            align: "center",
        });
        const release = this.getMesh("release");
        release.geometry = new Geometry(gl, {
            position: { size: 3, data: releaseText.buffers.position },
            uv: { size: 2, data: releaseText.buffers.uv },
            // id provides a per-character index, for effects that may require it
            id: { size: 1, data: releaseText.buffers.id },
            index: { data: releaseText.buffers.index },
        });
        release.geometry.computeBoundingBox();
        const offset = release.geometry.bounds.max.y + release.geometry.bounds.min.y;
        const dimension = [Math.abs(release.geometry.bounds.max.x - release.geometry.bounds.min.x) + 1, release.geometry.bounds.max.y - release.geometry.bounds.min.y + 1];
        this.getBgMesh("release").geometry = new Plane(gl, {
            width: dimension[0],
            height: dimension[1],
        });
        this.getBgMesh("release").program.uniforms.uDimension.value = dimension.reverse().map(x => x / 10);
        this.getBgMesh("release").position.y += offset / 2;
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