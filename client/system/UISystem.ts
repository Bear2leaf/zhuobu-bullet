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
        return [...this.sprites, ...this.switches, ...this.buttons].filter(o => o.getMesh().geometry && o.getMesh().program);
    }

    constructor(private readonly renderer: Renderer, private readonly scene: Transform) {
        const gl = this.renderer.gl;
        const { dpr } = this.renderer;

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

    }
    update(): void {
        throw new Error("Method not implemented.");
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
    updateInfo(data: string) {
        this.buttons.find(button => button.getMesh().name === "info")?.updateText(data);
    }
    updateHelp(data: string) {
        this.buttons.find(button => button.getMesh().name === "help")?.updateText(data);
    }
    updateLevel(data: string) {
        this.buttons.find(button => button.getMesh().name === "level")?.updateText(data);
    }
    render(camera: Camera) {
        this.renderer.render({ scene: this.scene, camera, clear: false })
    }
}