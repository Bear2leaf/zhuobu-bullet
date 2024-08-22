import { Camera, Euler, Mat4, Mesh, Orbit, Program, Quat, Renderer, Sphere, Transform, Vec3 } from "ogl";
import { WorkerMessage } from "../../worker/ammo.worker.js";
import { table } from "../misc/rotation.js";
import UI from "./UI.js";
import LDtkLevel from "../level/LDtkLevel.js";
import Level from "../level/Level.js";
import { radius } from "../misc/radius.js";
import TiledLevel from "../level/TiledLevel.js";
export default class Stage {
    private readonly helpMsg = "操作说明：\n1.划动屏幕旋转关卡\n2.引导小球抵达终点\n3.点击缩放聚焦小球\n4.点击箭头切换关卡\n（点击关闭说明）";
    private readonly continueMsg = "恭喜过关！\n点击进入下一关"
    private readonly renderer: Renderer;
    private readonly scene: Transform;
    private readonly camera: Camera;
    private readonly ui: UI;
    private readonly level: Level;
    private readonly quat = new Quat()
    private readonly matrix = new Mat4();
    private readonly rotation: Vec3 = new Vec3;
    private readonly sceneRotation = new Vec3();
    private readonly sceneEuler = new Euler();
    private readonly sceneQuat = new Quat();
    private readonly gravityScale = 100;
    private readonly tempPosition = new Vec3();
    private readonly acc = new Vec3(0, -this.gravityScale, 0);
    readonly availableLevels: Set<number> = new Set();
    readonly gravity = new Vec3;
    private readonly center = new Vec3();
    private charset: string = "";
    private fragment: string = "";
    private vertex: string = "";
    private t = 0;
    private scaleT = 0;
    private scale = 0;
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
        this.camera = new Camera(gl, {
            left: -width * 50 / height,
            right: width * 50 / height,
            top: 50,
            bottom: -50,
            near: 0,
            far: 10000
        })
        renderer.setSize(width, height);
        this.level = new TiledLevel(renderer.gl);
        this.level.onaddmesh = (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>) => {
            this.onaddmesh && this.onaddmesh(name, transform, vertices, indices, propertities);
        }
        this.level.onaddball = (transform) => {
            this.onaddball && this.onaddball(transform);
        }
        this.scene = new Transform();
        this.ui = new UI(renderer);
        this.availableLevels.add(0);
    }
    async load() {

        this.charset = await (await fetch("resources/font/charset.txt")).text();
        this.vertex = await (await fetch("resources/glsl/simple.vert.sk")).text();
        this.fragment = await (await fetch("resources/glsl/simple.frag.sk")).text();
        await this.ui.load();
        await this.level.load();
    }
    handleCollision(data: [string, string]) {
        if (data[0] === "Ball") {
            console.log("collision: ", ...data)
            if (this.level.checkNeedExit(data[1])) {
                this.onupdatevelocity && this.onupdatevelocity(data[0], 0, 0, 0);
                this.level.updateLevel(false);
                this.onresetworld && this.onresetworld();
            } else if (this.level.checkGetPickaxe(data[1])){
                this.ongetpickaxe && this.ongetpickaxe();
            }
        }
    }
    start() {
        this.ui.init();
        this.ui.onclick = (tag) => {
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
                this.updateZoom();
            } else if (tag === "next") {
                this.isContinue = false;
                this.level.updateLevel(false);
                this.updateLevelUI();
                this.onresetworld && this.onresetworld();
            } else if (tag === "prev") {
                this.isContinue = false;
                this.level.updateLevel(true);
                this.updateLevelUI();
                this.onresetworld && this.onresetworld();
            } else if (tag === "audio") {
                this.ontoggleaudio && this.ontoggleaudio()
            } else if (tag === "information") {
                this.updateButton("help");
            }
        }

        this.ui.onswipe = (dir) => {
            this.rollCamera(dir)
        }
        this.ui.initTouchEvents();

    }

    removeBody(name: string) {
        const scene = this.scene;
        let child: Transform | undefined;
        if (name === "Ball") {
            child = scene.children.find(child => child.visible && (child instanceof Mesh))
        } else {
            child = scene.children[this.level.getIndex() + 1].children.find(child => child.visible && child.name === name)
        }
        child && (child.visible = false);
    }

    updateBody(message: WorkerMessage & { type: "update" }) {
        const scene = this.scene;
        for (let index = 0; index < message.objects.length; index++) {
            let child: Transform | undefined;
            const name = message.objects[index][7];
            child = scene.children.find(child => child.name === name);
            if (child === undefined) {
                child = scene.children[this.level.getIndex() + 1].children.find(child => child.name === name);
            }
            if (child) {
                const phyObject = message.objects[index];
                child.position.fromArray(phyObject.slice(0, 3) as number[])
                child.quaternion.fromArray(phyObject.slice(3, 7) as number[])
            }
        }
    }
    updateSwitch(name: string, value: boolean) {
        if (value) {
            this.ui.getSwitch(name).on();
        } else {
            this.ui.getSwitch(name).off();
        }
    }
    // Game loop
    loop = (timeStamp: number) => {
        this.t = Math.min(1, this.t + timeStamp);
        this.scaleT = Math.min(1, this.scaleT + timeStamp);
        const camera = this.camera;
        this.sceneEuler.set(this.sceneRotation.x, this.sceneRotation.y, this.sceneRotation.z);
        this.sceneQuat.fromEuler(this.sceneEuler);
        camera.quaternion.slerp(this.sceneQuat, this.t);
        const cameraZ = this.level.getRadius() / Math.tan(camera.fov / 2.0);
        if (this.scale) {
            this.scene.children[0] && this.center.copy(this.scene.children[0].position);
            this.center.z = cameraZ;
        } else {
            this.center.copy(this.level.getCenter());
            this.center.z = cameraZ * 2;
        }
        camera.position = this.tempPosition.lerp(this.center.sub(this.scene.position), this.scaleT);
        this.camera.orthographic({ zoom: 50 / camera.position.z })
        this.renderer.render({ scene: this.scene, camera: camera });
        this.ui.render();
        this.quat.fill(0)
        this.matrix.fromArray(camera.viewMatrix.multiply(this.scene.worldMatrix));
        this.matrix.getRotation(this.quat);

        this.gravity.copy(this.acc).applyQuaternion(this.quat.inverse()).normalize().scale(this.gravityScale);
    }
    addBody(message: WorkerMessage & { type: "addBody" }) {
        const gl = this.renderer.gl;
        const vertex = this.vertex;
        const fragment = this.fragment;
        const id = message.data;
        const scene = this.scene;
        if (scene.children.length === 0) {

            if (id === 0) {
                const program = new Program(this.renderer.gl, {
                    vertex,
                    fragment,
                    uniforms: {
                        uColor: {
                            value: new Vec3(0.7, 0.2, 0.7)
                        }
                    }
                });
                const geometry = new Sphere(gl, { radius });
                const mesh = new Mesh(gl, {
                    geometry,
                    program,
                });
                mesh.setParent(scene);
                mesh.name = "Ball"
                this.level.init(this.scene);
            }
        } else {
            const child = this.scene.children.find(child => child instanceof Mesh);
            if (!child) {
                throw new Error("child is undefined");
            }
            child.visible = true;
        }
    }
    private updateButton(name: string, visible?: boolean) {
        if (visible === undefined) {
            this.ui.getButton(name).getMesh().visible = !this.ui.getButton(name).getMesh().visible;
        } else {
            this.ui.getButton(name).getMesh().visible = visible;
        }
    }
    private updateSprite(name: string, visible?: boolean) {
        if (visible === undefined) {
            this.ui.getSprite(name).getMesh().visible = !this.ui.getSprite(name).getMesh().visible;
        } else {
            this.ui.getSprite(name).getMesh().visible = visible;
        }
    }
    private async waitContinueButton() {
        this.updateButton("continue", true);
        this.ui.getButton("continue").updateText("恭喜过关\n点击进入下一关")
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
        const root = this.scene.children[this.level.getIndex() + 1];
        if (root) {
            if (!root.name) {
                throw new Error("Level name is undefined");
            }
            this.ui.updateLevel(root.name)
        }
    }
    async requestLevel() {
        this.pause = true;
        this.ui.updateHelp(this.helpMsg);
        if (this.isContinue) {
            this.freezeUI = true;
            await this.waitContinueButton();
        }
        this.level.request(this.scene);
        if (this.level.getIndex() === 0) {
            this.updateButton("help", true);
        }
        if (this.isContinue) {
            this.availableLevels.add(this.level.getIndex());
        }
        this.rotation.fill(0)
        this.sceneRotation.fill(0);
        this.updateLevelUI();
        this.updateSwitch("pause", true);
        this.checkCharset();
        this.isContinue = true;
        this.freezeUI = false;
        if (this.availableLevels.has(this.level.getIndex() + 1)) {
            this.updateSprite("next", true);
        } else {
            this.updateSprite("next", false);
        }
        if (this.availableLevels.has(this.level.getIndex() - 1)) {
            this.updateSprite("prev", true);
        } else {
            this.updateSprite("prev", false);
        }
        this.center.copy(this.level.getCenter());
    }
    private checkCharset() {
        let levelMsg = "";
        this.scene.traverse((node) => {
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
    private rollCamera(tag: "right" | "left" | "up" | "down") {
        const rotation = this.rotation;
        if (!this.level.isMazeMode()) {
            const key = `${rotation.x}${rotation.y}${rotation.z}`;
            table[key](tag, rotation);
            this.sceneRotation.set(rotation.x * Math.PI / 2, rotation.y * Math.PI / 2, rotation.z * Math.PI / 2);
        } else {
            if (tag === "left") {
                rotation.z += 1;
                this.sceneRotation.z = rotation.z * Math.PI / 2;
            } else if (tag === "right") {
                rotation.z -= 1;
                this.sceneRotation.z = rotation.z * Math.PI / 2;
            }
        }
        this.t = 0;
    }
    private updateZoom() {
        this.scale = (this.scale + 1) % 2;
        this.scaleT = 0;
        this.updateSwitch("zoom", !this.scale)
    }

}


