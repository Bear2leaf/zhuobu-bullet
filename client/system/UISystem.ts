import { Camera, Geometry, Mesh, Plane, Program, Raycast, Renderer, Text, Texture, Transform, Vec2, Vec3 } from "ogl";
import Button from "../ui/Button.js";
import Sprite from "../ui/Sprite.js";
import Switch from "../ui/Switch.js";
import UIElement from "../ui/UIElement.js";
import { System } from "./System.js";

export default class UISystem implements System {
    private readonly buttons: Button[] = [];
    private readonly sprites: Sprite[] = [];
    private readonly switches: Switch[] = [];
    get all(): UIElement[] {
        return [...this.sprites, ...this.switches, ...this.buttons].filter(o => o.getMesh());
    }

    constructor(private readonly renderer: Renderer, private readonly scene: Transform, private readonly camera: Camera) {
        const gl = this.renderer.gl;
        const { dpr } = this.renderer;

        this.switches.push(new Switch(gl, "zoom", new Vec3(3, 4 * dpr, 0)));
        this.sprites.push(new Sprite(gl, "information", new Vec3(0, 4 * dpr, 0)));
        this.switches.push(new Switch(gl, "audio", new Vec3(-3, 4 * dpr, 0)));
        this.buttons.push(new Button(gl, "continue", new Vec3(0, -1, 0), true, 1));
        this.switches.push(new Switch(gl, "pause", new Vec3(0, -4, 0)));
        this.buttons.push(new Button(gl, "info", new Vec3(0, 4 * dpr, 0)));
        this.buttons.push(new Button(gl, "level", new Vec3(0, -4 * dpr, 0)));
        this.sprites.push(new Sprite(gl, "prev", new Vec3(-3, -4 * dpr, 0)));
        this.sprites.push(new Sprite(gl, "next", new Vec3(3, -4 * dpr, 0)));
        this.buttons.push(new Button(gl, "help", new Vec3(0, 0 * dpr, 0), true));

    }
    update(): void {
        this.renderer.render({ scene: this.scene, camera: this.camera, clear: false })
    }
    async load() {
        for await (const item of this.all) {
            await item.load();
        }
    }
    getUIElement<T extends UIElement>(name: string): T {
        const button = this.all.find(button => button?.getMesh().name === name);
        if (!button) {
            throw new Error("button not found: " + name);
        }
        return button as T;
    }
    init() {
        for (const item of this.all) {
            item.init();
            item.getMesh().setParent(this.scene);
            if (item.getMesh().name === "help") {
                item.getMesh().visible = false;
            } else if (item.getMesh().name === "level") {
                item.getMesh().visible = true;
            } else if (item.getMesh().name === "pause") {
                item.getMesh().visible = false;
            }
        }
    }
}