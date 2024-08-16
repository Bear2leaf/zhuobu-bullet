import { SnapshotInterpolation } from "@geckos.io/snapshot-interpolation";
import { Entity, Snapshot, State } from "@geckos.io/snapshot-interpolation/lib/types.js";
import { Camera, Euler, Mat4, Mesh, Orbit, Program, Quat, Renderer, Sphere, Transform, Vec3 } from "ogl";
import { WorkerMessage } from "../../worker/ammo.worker.js";
import { table } from "../misc/rotation.js";
import UI from "./UI.js";
import LDtkLevel from "../level/LDtkLevel.js";
import Level from "../level/Level.js";
export default class Stage {
    private readonly helpMsg = "操作说明：\n1.重力朝向下方\n2.划动屏幕旋转关卡\n3.点击箭头切换关卡\n4.点击缩放聚焦小球\n5.引导小球抵达绿色终点\n6.点击底部按钮暂停、继续游戏\n（点击关闭说明）";
    private readonly continueMsg = "恭喜过关！\n点击进入下一关"
    private readonly si = new SnapshotInterpolation(60)
    private readonly renderer: Renderer;
    private readonly scene: Transform;
    private readonly camera: Camera;
    private readonly ui: UI;
    private readonly level: Level;
    private readonly quat = new Quat()
    private readonly matrix = new Mat4();
    private readonly rotation: Vec3 = new Vec3;
    private readonly sceneRotation = new Vec3();
    private readonly zeroVec3 = new Vec3(0, 0, 0);
    private readonly sceneScale = new Vec3(0.01, 0.01, 0.01);
    private readonly sceneEuler = new Euler();
    private readonly sceneQuat = new Quat();
    private readonly tempQuat = new Quat();
    // private readonly controls: Orbit;
    private readonly tempPosition = new Vec3();
    private readonly acc = new Vec3(0, -10, 0);
    readonly availableLevels: Set<number> = new Set();
    readonly gravity = new Vec3;
    private charset: string = "";
    private fragment: string = "";
    private vertex: string = "";
    private t = 0;
    private scaleT = 0;
    private scale = 0;
    private reverse = false;
    private pause = true;
    private freezeUI = false;
    private isContinue: boolean = false;
    private continueButtonResolve?: (value: unknown) => void;
    onclick?: (tag?: string) => void;
    ontoggleaudio?: VoidFunction;
    onpause?: VoidFunction;
    onrelease?: VoidFunction;
    onresetworld?: VoidFunction;
    onaddmesh?: (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>) => void;
    onaddball?: (transform: number[]) => void;

    constructor(width: number, height: number, dpr: number, canvas: HTMLCanvasElement) {
        const renderer = this.renderer = new Renderer({ dpr, canvas });
        const gl = renderer.gl;
        gl.clearColor(0.3, 0.3, 0.6, 1);
        // const camera = this.camera = new Camera(gl, {
        //     aspect: width / height,
        //     fov: 45
        // })
        const camera = this.camera = new Camera(gl, {
            left: -width / 2 / height,
            right: width / 2 / height,
            top: 1 / 2,
            bottom: -1 / 2,
            near: 10,
            far: -10
        })
        camera.position.z = 0.5;
        // Create controls and pass parameters
        // this.controls = new Orbit(camera);
        renderer.setSize(width, height);
        this.level = new LDtkLevel(renderer.gl);
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
    private rollCamera(tag: "right" | "left" | "up" | "down") {
        const rotation = this.rotation;
        if (!this.level.isMazeMode()) {
            const key = `${rotation.x}${rotation.y}${rotation.z}`;
            table[key](tag, rotation);
            this.sceneRotation.set(rotation.x * Math.PI / 2, rotation.y * Math.PI / 2, rotation.z * Math.PI / 2);
        } else {
            if (tag === "left" || tag === "up") {
                rotation.z -= 1;
            } else {
                rotation.z += 1;
            }
            this.sceneRotation.z = rotation.z * Math.PI / 2;
        }
        this.t = 0;
    }
    private updateZoom() {
        this.scale = (this.scale + 1) % 2;
        this.sceneScale.set(this.scale + 1, this.scale + 1, this.scale + 1);
        this.sceneScale.multiply(0.01);
        this.scene.children[0].worldMatrix.getTranslation(this.tempPosition);
        this.scaleT = 0;
        this.updateSwitch("zoom", !this.scale)
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
                this.onresetworld && this.onresetworld();
            } else if (tag === "prev") {
                this.isContinue = false;
                this.reverse = true;
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

    setInitLevel(level: number) {
        this.level.setIndex(level);
    }
    removeBody(name: string | undefined) {
        const scene = this.scene;
        let child: Transform | undefined;
        if (name === "Ball") {
            child = scene.children.find(child => child.visible && (child instanceof Mesh))
        } else {
            child = scene.children.find(child => child.visible && !(child instanceof Mesh))?.children[this.level.getIndex()].children.find(child => child.name === name);
        }
        if (!child) {
            throw new Error("child is undefined");
        }
        child.visible = false;
    }
    updateSI(snapshot: Snapshot) {
        this.si.snapshot.add(snapshot)
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
        const snapshot = this.si.calcInterpolation('x y z q(quat)') // [deep: string] as optional second parameter
        if (snapshot) {
            // access your state
            const { state } = snapshot;
            this.updateState(state)
        }
        this.t += timeStamp;
        this.scaleT += timeStamp;
        // Need to update controls every frame
        // this.controls.update();
        const scaleT = Math.min(1, this.scaleT);
        this.sceneEuler.set(this.sceneRotation.x, this.sceneRotation.y, this.sceneRotation.z);
        this.sceneQuat.fromEuler(this.sceneEuler);
        this.tempQuat.slerp(this.sceneQuat, Math.min(1, this.t));
        this.scene.quaternion.copy(this.tempQuat);
        this.scene.scale.lerp(this.sceneScale, scaleT);
        const camera = this.camera;
        if (this.scale) {
            const pos = this.scene.children[0].position;
            camera.position = (this.tempPosition.lerp(pos, scaleT).applyMatrix4(this.scene.matrix));
            camera.position.z = (this.level.getRadius() * 0.0225) / Math.tan(camera.fov / 2.0);
        } else {
            camera.position = this.tempPosition.lerp(this.zeroVec3, scaleT);
            camera.position.z = (this.level.getRadius() * 0.0225) / Math.tan(camera.fov / 2.0);
        }

        this.renderer.render({ scene: this.scene, camera: camera });
        this.ui.render();
        this.quat.fill(0)
        this.matrix.fromArray(camera.viewMatrix.multiply(this.scene.worldMatrix));
        this.matrix.getRotation(this.quat);

        this.gravity.copy(this.acc).applyQuaternion(this.quat.inverse()).normalize().scale(10);
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
                const geometry = new Sphere(gl, { radius: 1 });
                const mesh = new Mesh(gl, {
                    geometry,
                    program,
                });
                mesh.setParent(scene);
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
    private updateState(state: State) {

        const scene = this.scene;
        // this.ui.updateInfo(`fps: ${message.currFPS}, avg: ${message.allFPS}`);
        for (let index = 0; index < state.length; index++) {
            let child: Transform | undefined;

            const entity = state[index] as Entity & {
                x: number, y: number, z: number, q: {
                    x: number,
                    y: number,
                    z: number,
                    w: number
                }
            };
            const name = entity.id;
            if (index === 0) {
                child = scene.children.find(child => child.visible && child instanceof Mesh)
            } else {
                child = scene.children.find(child => child.visible && !(child instanceof Mesh))?.children[this.level.getIndex()].children.find(child => child.name === name);
            }
            if (!child) {
                return;
            }
            child.position.x = entity.x;
            child.position.y = entity.y;
            child.position.z = entity.z;
            child.quaternion.x = entity.q.x;
            child.quaternion.y = entity.q.y;
            child.quaternion.z = entity.q.z;
            child.quaternion.w = entity.q.w;
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

    async requestLevel() {
        this.pause = true;
        this.ui.updateHelp(this.helpMsg);
        if (this.isContinue) {
            this.freezeUI = true;
            await this.waitContinueButton();
        }
        this.level.request(this.scene, this.reverse);
        if (this.level.getIndex() === 0) {
            this.updateButton("help", true);
        }
        if (this.isContinue) {
            this.availableLevels.add(this.level.getIndex());
        }
        this.reverse = false;
        this.rotation.fill(0)
        this.sceneRotation.fill(0);
        const root = this.scene.children.find(node => !(node instanceof Mesh));
        if (root) {
            const child = root.children.find(child => child.visible)
            if (!child?.name) {
                throw new Error("level name is empty");
            }
            this.ui.updateLevel(child.name)
        }
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

}


