import { Camera, Euler, Mat4, Mesh, Orbit, Program, Quat, Renderer, Sphere, Transform, Vec3 } from "ogl";
import UISystem from "../system/UISystem.js";
import LevelSystem from "../system/LevelSystem.js";
import { CameraSystem } from "../system/CameraSystem.js";
import { RenderSystem } from "../system/RenderSystem.js";
import { InputSystem } from "../system/InputSystem.js";
export default class Engine {
    private readonly helpMsg = "操作说明：\n1.划动屏幕旋转关卡\n2.引导小球抵达终点\n3.点击缩放聚焦小球\n4.点击箭头切换关卡\n（点击关闭说明）";
    private readonly continueMsg = "恭喜过关！\n点击进入下一关"
    private readonly renderer: Renderer;
    private readonly uiSystem: UISystem;
    private readonly levelSystem: LevelSystem;
    private readonly inputSystem: InputSystem;
    private readonly quat = new Quat()
    private readonly matrix = new Mat4();
    private readonly gravityScale = 100;
    private readonly acc = new Vec3(0, -this.gravityScale, 0);
    private readonly availableLevels: Set<number> = new Set();
    readonly gravity = new Vec3;
    private readonly cameraSystem: CameraSystem;
    private readonly renderSystem: RenderSystem;
    private charset: string = "";
    private pause = true;
    private freezeUI = false;
    private isContinue: boolean = false;
    private continueButtonResolve?: (value: unknown) => void;
    onclick?: (tag?: string) => void;
    onupdatevelocity?: (name: string, x: number, y: number, z: number) => void;
    ontoggleaudio?: VoidFunction;
    onpause?: VoidFunction;
    onrelease?: VoidFunction;
    onresetworld?: VoidFunction;
    onremovemesh?: (name: string) => void;
    onaddmesh?: (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>) => void;
    onaddball?: (transform: number[]) => void;
    ongetpickaxe?: () => void;
    constructor(width: number, height: number, dpr: number, canvas: HTMLCanvasElement) {
        const renderer = this.renderer = new Renderer({ dpr, canvas });
        const gl = renderer.gl;
        gl.clearColor(0.3, 0.3, 0.6, 1);
        renderer.setSize(width, height);
        this.cameraSystem = new CameraSystem(gl, [width, height, dpr]);
        this.levelSystem = new LevelSystem();
        this.levelSystem.onaddmesh = (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>) => {
            this.onaddmesh && this.onaddmesh(name, transform, vertices, indices, propertities);
        }
        this.levelSystem.onaddball = (transform) => {
            this.onaddball && this.onaddball(transform);
        }
        this.renderSystem = new RenderSystem(gl, this.levelSystem);
        this.uiSystem = new UISystem(renderer, this.renderSystem.uiRoot);

        this.inputSystem = new InputSystem(width, height, this.cameraSystem.uiCamera, this.uiSystem);

    }
    async load() {

        this.charset = await (await fetch("resources/font/charset.txt")).text();
        await this.uiSystem.load();
        await this.levelSystem.load();
        this.renderSystem.tiledData = this.levelSystem.tiledData;
        await this.renderSystem.load();
    }
    handleCollision(data: [string, string]) {
        if (data[0] === "Ball") {
            console.log("collision: ", ...data)
            if (this.levelSystem.checkNeedExit(data[1])) {
                this.onupdatevelocity && this.onupdatevelocity(data[0], 0, 0, 0);
                this.levelSystem.updateLevel(false);
                this.onresetworld && this.onresetworld();
            } else if (this.levelSystem.checkGetPickaxe(data[1])) {
                this.ongetpickaxe && this.ongetpickaxe();
            }
        }
    }
    start() {
        this.levelSystem.init();
        this.uiSystem.init();
        this.inputSystem.init();
        this.inputSystem.initTouchEvents();
        this.renderSystem.init();
        this.availableLevels.add(0);
        this.inputSystem.onclick = (tag) => {
            if (this.freezeUI) {
                if (tag === "continue") {
                    this.continueButtonResolve && this.continueButtonResolve(void (0));
                    this.updateButton("continue");
                    this.continueButtonResolve = undefined;
                }
                return;
            }
            if (tag === "pause") {
                this.release();
            } else if (tag === "zoom") {
                this.cameraSystem.updateZoom();
                this.updateSwitch("zoom", !this.cameraSystem.scale)
            } else if (tag === "next") {
                this.isContinue = false;
                this.levelSystem.updateLevel(false);
                this.updateLevelUI();
                this.onresetworld && this.onresetworld();
            } else if (tag === "prev") {
                this.isContinue = false;
                this.levelSystem.updateLevel(true);
                this.updateLevelUI();
                this.onresetworld && this.onresetworld();
            } else if (tag === "audio") {
                this.ontoggleaudio && this.ontoggleaudio()
            } else if (tag === "information") {
                this.updateButton("help");
            }
        }

        this.inputSystem.onswipe = (dir) => {
            this.cameraSystem.rollCamera(dir, this.levelSystem.isMazeMode)
        }

    }

    updateSwitch(name: string, value: boolean) {
        if (value) {
            this.uiSystem.getSwitch(name).on();
        } else {
            this.uiSystem.getSwitch(name).off();
        }
    }
    hideMesh(data: string) {
        this.renderSystem.hideMesh(data, this.levelSystem);
    }
    updateMesh(message: { type: "update"; objects: [number, number, number, number, number, number, number, string][]; }) {
        this.renderSystem.updateMesh(message, this.levelSystem)
    }
    // Game loop
    loop = (timeStamp: number) => {
        const scene = this.renderSystem.levelRoot;
        const camera = this.cameraSystem.camera;
        this.cameraSystem.radius = this.levelSystem.radius;
        this.cameraSystem.ballPosition.copy(this.renderSystem.levelRoot.children[0].position);
        this.cameraSystem.center.copy(this.levelSystem.center);
        this.cameraSystem.update(timeStamp);
        this.renderer.render({ scene, camera: camera });
        this.uiSystem.render(this.cameraSystem.uiCamera);
        this.quat.fill(0)
        this.matrix.fromArray(camera.viewMatrix.multiply(scene.worldMatrix));
        this.matrix.getRotation(this.quat);

        this.gravity.copy(this.acc).applyQuaternion(this.quat.inverse()).normalize().scale(this.gravityScale);
    }
    private updateButton(name: string, visible?: boolean) {
        if (visible === undefined) {
            this.uiSystem.getButton(name).getMesh().visible = !this.uiSystem.getButton(name).getMesh().visible;
        } else {
            this.uiSystem.getButton(name).getMesh().visible = visible;
        }
    }
    private updateSprite(name: string, visible?: boolean) {
        if (visible === undefined) {
            this.uiSystem.getSprite(name).getMesh().visible = !this.uiSystem.getSprite(name).getMesh().visible;
        } else {
            this.uiSystem.getSprite(name).getMesh().visible = visible;
        }
    }
    private async waitContinueButton() {
        this.updateButton("continue", true);
        this.uiSystem.getButton("continue").updateText("恭喜过关\n点击进入下一关")
        await new Promise((resolve) => {
            this.continueButtonResolve = resolve;
        })
    }
    private release() {
        const stage = this;
        const pause = this.pause = !this.pause;
        stage.updateSwitch("pause", pause);
        if (pause) {
            this.onpause && this.onpause();
        } else {
            this.onrelease && this.onrelease();
        }
    }
    updateLevelUI() {
        const root = this.renderSystem.levelRoot.children[this.levelSystem.current + 1];
        if (root) {
            if (!root.name) {
                throw new Error("Level name is undefined");
            }
            this.uiSystem.updateLevel(root.name)
        }
    }
    async requestLevel() {
        this.pause = true;
        this.uiSystem.updateHelp(this.helpMsg);
        if (this.isContinue) {
            this.freezeUI = true;
            await this.waitContinueButton();
        }
        this.levelSystem.request(this.renderSystem.levelRoot);
        if (this.levelSystem.current === 0) {
            this.updateButton("help", true);
        }
        if (this.isContinue) {
            this.availableLevels.add(this.levelSystem.current);
        }
        this.updateLevelUI();
        this.updateSwitch("pause", true);
        this.checkCharset();
        this.isContinue = true;
        this.freezeUI = false;
        if (this.availableLevels.has(this.levelSystem.current + 1)) {
            this.updateSprite("next", true);
        } else {
            this.updateSprite("next", false);
        }
        if (this.availableLevels.has(this.levelSystem.current - 1)) {
            this.updateSprite("prev", true);
        } else {
            this.updateSprite("prev", false);
        }
        this.cameraSystem.resetRotation();
    }
    private checkCharset() {
        let levelMsg = "";
        this.renderSystem.levelRoot.traverse((node) => {
            levelMsg += node.name || ""
        });
        const allMsg = this.helpMsg + levelMsg + this.continueMsg;
        const uniqueCharset = Array.from(new Set(allMsg.split(''))).sort().join('');
        let errorCharset = ""
        for (const char of uniqueCharset.split("")) {
            if (this.charset.indexOf(char) === -1) {
                errorCharset += char;
            }
        }
        if (errorCharset) {
            throw new Error("undefined char: " + errorCharset);

        }
    }

}


