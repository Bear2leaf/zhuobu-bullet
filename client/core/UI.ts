import { Camera, Geometry, Mesh, Plane, Program, Raycast, Renderer, Text, Texture, Transform, Vec2, Vec3 } from "ogl";
import Button from "../ui/Button.js";
import Sprite from "../ui/Sprite.js";
import Switch from "../ui/Switch.js";
import ButtonStatus from "../ui/ButtonStatus.js";

export default class UI {
    private readonly camera: Camera;
    private readonly scene: Transform;
    private readonly mouse = new Vec2();
    private readonly buttons: Button[] = [];
    private readonly sprites: Sprite[] = [];
    private readonly switches: Switch[] = [];
    get all(): ButtonStatus[] {
        return [...this.sprites, ...this.switches, ...this.buttons].filter(o => o.getMesh().visible);
    }
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

        this.buttons.push(new Button(gl, "help", new Vec3(0, -7, 0), true));
        this.buttons.push(new Button(gl, "continue", new Vec3(0, -6 * dpr, 0), true, 1));
        this.switches.push(new Switch(gl, "pause", new Vec3(0, -9 * dpr, 0)));
        this.switches.push(new Switch(gl, "zoom", new Vec3(3, -5, 0)));
        this.switches.push(new Switch(gl, "audio", new Vec3(-3, -5, 0)));
        this.buttons.push(new Button(gl, "info", new Vec3(0, 0, 0)));
        this.buttons.push(new Button(gl, "level", new Vec3(0, -2, 0)));
        this.sprites.push(new Sprite(gl, "prev", new Vec3(-3, -2.6, 0)));
        this.sprites.push(new Sprite(gl, "next", new Vec3(3, -2.6, 0)));
        this.sprites.push(new Sprite(gl, "information", new Vec3(0, -5, 0)));

        const mouse = this.mouse;
        // Create a raycast object
        const raycast = new Raycast();
        const move = (e: { x: number, y: number }) => {
            mouse.set(2.0 * (e.x / renderer.width) - 1.0, 2.0 * (1.0 - e.y / renderer.height) - 1.0);

            // Update the ray's origin and direction using the camera and mouse
            raycast.castMouse(camera, mouse);


            // raycast.intersectBounds will test against the bounds of each mesh, and
            // return an array of intersected meshes in order of closest to farthest
            const hits = raycast.intersectBounds([
                ...this.buttons.map(button => button.getMesh())
                , ...this.sprites.map(sprite => sprite.getMesh())
                , ...this.switches.map(s => s.getMesh())
            ]);

            // Update our feedback using this array
            this.all.forEach(item => {
                item.release();
                hits.forEach(hit => {
                    if (item.getMesh().name === hit.name || item.getMesh().name === hit.parent?.name) {
                        item.down();
                    }
                })
            })
        }
        const start = (e: { x: number, y: number }) => {
            this.getButton("help").getMesh().visible = false;
            mouse.set(2.0 * (e.x / renderer.width) - 1.0, 2.0 * (1.0 - e.y / renderer.height) - 1.0);

            // Update the ray's origin and direction using the camera and mouse
            raycast.castMouse(camera, mouse);


            // raycast.intersectBounds will test against the bounds of each mesh, and
            // return an array of intersected meshes in order of closest to farthest
            const hits = raycast.intersectBounds([
                ...this.buttons.map(button => button.getMesh())
                , ...this.sprites.map(sprite => sprite.getMesh())
                , ...this.switches.map(s => s.getMesh())
            ]);

            // Update our feedback using this array
            this.all.forEach(item => {
                item.release();
                hits.forEach(hit => {
                    if (item.getMesh().name === hit.name || item.getMesh().name === hit.parent?.name) {
                        item.down();
                    }
                })
            })
        }
        const end = () => {
            // Update the ray's origin and direction using the camera and mouse
            raycast.castMouse(camera, mouse);


            // raycast.intersectBounds will test against the bounds of each mesh, and
            // return an array of intersected meshes in order of closest to farthest
            const hits = raycast.intersectBounds([
                ...this.buttons.map(button => button.getMesh())
                , ...this.sprites.map(sprite => sprite.getMesh())
                , ...this.switches.map(s => s.getMesh())
            ]);

            // Update our feedback using this array
            this.all.forEach(item => {
                hits.forEach(hit => {
                    if (item.getMesh().name === hit.name || item.getMesh().name === hit.parent?.name) {
                        if (item.isDown()) {
                            this.onclick && this.onclick(item.getMesh().name);
                        }
                    }
                })
                item.release();
            })
        }

        document.addEventListener("touchstart", (e) => start({ x: e.touches[0].pageX, y: e.touches[0].pageY }))
        document.addEventListener("touchmove", (e) => move({ x: e.touches[0].pageX, y: e.touches[0].pageY }))
        document.addEventListener("touchend", () => end())
        document.addEventListener("touchcancel", () => end())
    }
    async load() {
        for await (const button of this.buttons) {
            await button.load();
        }
        for await (const sprite of this.sprites) {
            await sprite.load();
        }
        for await (const s of this.switches) {
            await s.load();
        }
    }
    getButton(name: string) {
        const button = this.buttons.find(button => button?.getMesh().name === name);
        if (!button) {
            throw new Error("button not found: " + name);
        }
        return button;
    }
    getSprite(name: string) {
        const sprite = this.sprites.find(sprite => sprite?.getMesh().name === name);
        if (!sprite) {
            throw new Error("sprite not found: " + name);
        }
        return sprite;
    }
    getSwitch(name: string) {
        const button = this.switches.find(button => button?.getMesh().name === name);
        if (!button) {
            throw new Error("switch not found: " + name);
        }
        return button;
    }
    init() {
        for (const button of this.buttons) {
            button.init();
            button.setParent(this.scene);
            if (button.getMesh().name === "help") {
                button.getMesh().scale.multiply(0.5);
                button.getMesh().visible = false;
            }
        }
        for (const sprite of this.sprites) {
            sprite.init();
            sprite.setParent(this.scene);
        }
        for (const s of this.switches) {
            s.init();
            s.setParent(this.scene);
        }
    }
    down(name: string) {
        this.all.find(button => button.getMesh().name === name)?.down();
    }
    release(name: string) {
        this.all.find(button => button.getMesh().name === name)?.release();

    }
    updateInfo(data: string) {
        this.buttons.find(button => button.getMesh().name === "info")?.updateText(data);
    }
    updateHelp(data: string) {
        this.buttons.find(button => button.getMesh().name === "help")?.updateText(data);
    }
    updateLevel(data: string) {
        this.buttons.find(button => button.getMesh().name === "level")?.updateText(data);
    }
    render() {
        this.renderer.render({ scene: this.scene, camera: this.camera, clear: false })
    }
}