import { Camera, Geometry, Mesh, OGLRenderingContext, Plane, Program, Raycast, Renderer, Text, Texture, Transform, Vec2, Vec3 } from "ogl";
import Button from "../ui/Button.js";
import Sprite from "../ui/Sprite.js";
import Switch from "../ui/Switch.js";
import UIElement from "../ui/UIElement.js";
import { System } from "./System.js";
import LevelIndicator from "../ui/LevelIndicator.js";
export default class UISystem implements System {
    private _root?: Transform;
    private _gl?: OGLRenderingContext;
    private _dpr?: number;
    private get root(): Transform {
        if (!this._root) {
            throw new Error("root not initialized");
        }
        return this._root;
    }
    private get gl(): OGLRenderingContext {
        if (!this._gl) {
            throw new Error("gl not initialized");
        }
        return this._gl;
    }
    private get dpr(): number {
        if (!this._dpr) {
            throw new Error("dpr not initialized");
        }
        return this._dpr;
    }
    private readonly buttons: Button[] = [];
    private readonly sprites: Sprite[] = [];
    private readonly switches: Switch[] = [];
    private get levelIndicator(): LevelIndicator {
        if (!this._levelIndicator) {
            throw new Error("level indicator not initialized");
        }
        return this._levelIndicator;
    };
    private _levelIndicator?: LevelIndicator;
    freeze: boolean = false;
    get all(): UIElement[] {
        return [this.levelIndicator, ...this.sprites, ...this.switches, ...this.buttons].filter(o => o.getMesh());
    }

    update(timeStamp: number): void {
        this.levelIndicator.update(timeStamp);
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
    initUI (root: Transform, gl: OGLRenderingContext){
        this._root = root;
        this._gl = gl;
        this._dpr = gl.renderer.dpr;
        const dpr = this.dpr;
        this._levelIndicator = new LevelIndicator(gl, "indicator", new Vec3(0, -4 * dpr, 0));
    };
    init() {
        const gl = this.gl;
        const dpr = this.dpr;
        this.switches.push(new Switch(gl, "zoom", new Vec3(3, 4 * dpr, 0)));
        this.sprites.push(new Sprite(gl, "information", new Vec3(0, 4 * dpr, 0)));
        this.switches.push(new Switch(gl, "audio", new Vec3(-3, 4 * dpr, 0)));
        this.buttons.push(new Button(gl, "continue", new Vec3(0, -1, 0), true, 1));
        this.buttons.push(new Button(gl, "info", new Vec3(0, 4 * dpr, 0)));
        this.buttons.push(new Button(gl, "level", new Vec3(0, -3 * dpr, 0)));
        this.buttons.push(new Button(gl, "help", new Vec3(0, 0 * dpr, 0), true));

    }
    start(): void {
        for (const item of this.all) {
            item.init();
            item.getMesh().setParent(this.root);
            if (item.getMesh().name === "help") {
                item.getMesh().visible = false;
            } else if (item.getMesh().name === "level") {
                item.getMesh().visible = true;
            }
        }
    }
}