import { Camera, Geometry, Mesh, Plane, Program, Raycast, Renderer, Text, Texture, Transform, Vec2, Vec3 } from "ogl";
import Button from "../ui/Button.js";

export default class UI {
    private readonly camera: Camera;
    private readonly scene: Transform;
    private readonly mouse = new Vec2();
    private readonly buttons: Button[] = [];
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
        const releaseY = -9 * gl.renderer.dpr;

        this.buttons.push(new Button(gl, "release", new Vec3(0, releaseY, 0), true));
        this.buttons.push(new Button(gl, "zoom", new Vec3(-3, -4, 0), true));
        this.buttons.push(new Button(gl, "audio", new Vec3(3, -4, 0), true));
        this.buttons.push(new Button(gl, "info", new Vec3(0, 0, 0)));
        this.buttons.push(new Button(gl, "level", new Vec3(0, -2, 0)));
        this.buttons.push(new Button(gl, "prev", new Vec3(-3, -2, 0), true));
        this.buttons.push(new Button(gl, "next", new Vec3(3, -2, 0), true));

        const mouse = this.mouse;
        // Create a raycast object
        const raycast = new Raycast();
        const touch = (e: { x: number, y: number }) => {
            mouse.set(2.0 * (e.x / renderer.width) - 1.0, 2.0 * (1.0 - e.y / renderer.height) - 1.0);

            // Update the ray's origin and direction using the camera and mouse
            raycast.castMouse(camera, mouse);


            // raycast.intersectBounds will test against the bounds of each mesh, and
            // return an array of intersected meshes in order of closest to farthest
            const hits = raycast.intersectBounds(this.buttons.map(button => button.getMesh()));

            // Update our feedback using this array
            hits.forEach(hit => {
                this.onclick && this.onclick(hit.name || hit.parent?.name);
            })
        }

        document.addEventListener("click", touch)
        document.addEventListener("touchstart", (e) => touch({ x: e.touches[0].pageX, y: e.touches[0].pageY }))
    }
    async load() {
        for await (const button of this.buttons) {
            await button.load();
        }
    }
    getButton(name: string) {
        const button = this.buttons.find(button => button?.getMesh().name === name);
        if (!button) {
            throw new Error("button not found: " + name);
        }
        return button;
    }
    init() {
        for (const button of this.buttons) {
            button.init();
            button.setParent(this.scene);
        }
        this.buttons.find(button => button.getMesh().name === "prev")?.updateText("<");
        this.buttons.find(button => button.getMesh().name === "next")?.updateText(">");
        this.buttons.find(button => button.getMesh().name === "zoom")?.updateText("ZOOM");
        this.buttons.find(button => button.getMesh().name === "audio")?.updateText("AUDIO");
    }
    updateInfo(data: string) {
        this.buttons.find(button => button.getMesh().name === "info")?.updateText(data);
    }
    updateLevel(data: string) {
        this.buttons.find(button => button.getMesh().name === "level")?.updateText(data);
    }
    render() {
        this.renderer.render({ scene: this.scene, camera: this.camera, clear: false })
    }
}