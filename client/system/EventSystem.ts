import { System } from "./System.js";
import { MainMessage, WorkerMessage } from "../../worker/ammo.worker";
import { InputSystem } from "./InputSystem.js";
import AudioSystem from "./AudioSystem.js";
import { CameraSystem } from "./CameraSystem.js";
import LevelSystem from "./LevelSystem.js";
import { RenderSystem } from "./RenderSystem.js";
import UISystem from "./UISystem.js";
import { Mat4, Quat, Vec2, Vec3 } from "ogl";
type Direction = "Down" | "Up" | "Left" | "Right";
export class EventSystem implements System {
    private readonly helpMsg = "操作说明：\n1.划动屏幕旋转关卡\n2.引导小球抵达终点\n3.点击缩放聚焦小球\n4.点击箭头切换关卡\n（点击关闭说明）";
    private readonly continueMsg = "恭喜过关！\n点击进入下一关";
    private readonly availableLevels: Set<number> = new Set();
    private charset: string = "";
    private pause = true;
    private isContinue: boolean = false;
    private freezeUI = false;
    private readonly dirSet = new Set<Direction>();
    private readonly gravityScale = 100;
    private readonly gravity = new Vec3();
    private readonly acc = new Vec3(0, -this.gravityScale, 0);
    private continueButtonResolve?: (value: unknown) => void;
    constructor(
        private readonly inputSystem: InputSystem,
        private readonly cameraSystem: CameraSystem,
        private readonly levelSystem: LevelSystem,
        private readonly renderSystem: RenderSystem,
        private readonly uiSystem: UISystem,
        private readonly audio: AudioSystem

    ) { }
    onmessage(message: WorkerMessage): void {
        const audio = this.audio;
        const sendmessage = this.sendmessage;
        if (!sendmessage) {
            throw new Error("sendmessage is undefined");
        }
        // console.log("message from worker", message);
        if (message.type === "requestLevel") {
            audio.play();
            this.requestLevel();
        } else if (message.type === "ready") {
            sendmessage({
                type: "resetWorld",
            });
        } else if (message.type === "removeBody") {
            this.hideMesh(message.data);
        } else if (message.type === "update") {
            this.updateMesh(message);
        } else if (message.type === "collisionEnter") {
            this.handleCollision(message.data);
        }
    }
    init(): void {
        this.availableLevels.add(0);
        const audio = this.audio;
        const sendmessage = this.sendmessage;
        if (!sendmessage) {
            throw new Error("sendmessage is undefined");
        }
        this.levelSystem.onaddmesh = (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>) => {
            sendmessage({
                type: "addMesh",
                data: { vertices: [...vertices], indices: [...indices], propertities, name, transform }
            })
        }
        this.levelSystem.onaddball = (transform) => {
            this.addBall(transform)
        }
        this.levelSystem.onenablemesh = (name: string | undefined) => {
            sendmessage({
                type: "enableMesh",
                data: name || ""
            })
        }
        this.onteleport = (from: string, to: string) => {
            sendmessage({
                type: "teleport",
                data: [from, to]
            })
        }
        this.levelSystem.ondisablemesh = this.disableMesh.bind(this);
        this.onpause = () => sendmessage({
            type: "pause"
        })
        this.onrelease = () => sendmessage({
            type: "release"
        })
        this.onremovemesh = (name) => {
            sendmessage({
                type: "removeMesh",
                data: name
            })
        }
        this.onupdatevelocity = (name, x, y, z) => {
            sendmessage({
                type: "updateVelocity",
                data: {
                    name,
                    x,
                    y,
                    z,
                }
            })
        }
        this.ontoggleaudio = () => {
            audio.toggle();
            this.updateSwitch("audio", audio.isOn())
        }
        this.onresetworld = () => sendmessage({
            type: "resetWorld",
        })
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
    disableMesh(name: string | undefined) {
        this.sendmessage && this.sendmessage({
            type: "disableMesh",
            data: name || ""
        })
    }
    addBall(transform: number[]) {
        this.sendmessage && this.sendmessage({
            type: "addBall",
            data: {
                transform
            }
        })
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
        this.dirSet.clear();
        if (this.availableLevels.has(this.levelSystem.current + 1)) {
            this.updateSprite("next", true);
        } else {
            this.updateSprite("next", false);
        }
        // if (this.availableLevels.has(this.levelSystem.current - 1)) {
        //     this.updateSprite("prev", true);
        // } else {
        //     this.updateSprite("prev", false);
        // }
        this.cameraSystem.resetRotation();
    }
    handleCollision(data: [string, string]) {
        if (data[0] === "Ball") {
            // console.log("collision: ", ...data)
            if (this.levelSystem.checkNeedExit(data[1])) {
                this.onupdatevelocity && this.onupdatevelocity(data[0], 0, 0, 0);
                this.levelSystem.updateLevel(false);
                this.onresetworld && this.onresetworld();
            } else if (this.levelSystem.checkGetPickaxe(data[1])) {
                this.levelSystem.getPickaxe();
                this.onremovemesh && this.onremovemesh(data[1])
            } else if (this.levelSystem.checkRock(data[1])) {
                this.levelSystem.removeRock(data[1]);
                this.onremovemesh && this.onremovemesh(data[1])
            } else if (this.levelSystem.checkTeleport(data[1])) {
                const to = this.levelSystem.getTeleportDestinationName();
                this.onteleport && this.onteleport(data[0], to);
            } else if (this.levelSystem.checkBeltUp(data[1])) {
                    const node = this.levelSystem.getCurrentLevelNode(data[1]);
                    const transform = node?.matrix || new Mat4().identity();
                    this.addBall(transform)
                    this.disableMesh(data[1]);
                    this.onupdatevelocity && this.onupdatevelocity(data[0], 0, 100, 0);
            }
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
    sendmessage?: (message: MainMessage) => void;
    async load(): Promise<void> {
        this.charset = await (await fetch("resources/font/charset.txt")).text();
    }
    onpause?: () => void;
    onrelease?: () => void;
    onclick?: (tag?: string) => void;
    onteleport?: (from: string, to: string) => void;
    onupdatevelocity?: (name: string, x: number, y: number, z: number) => void;
    ontoggleaudio?: VoidFunction;
    onresetworld?: VoidFunction;
    onremovemesh?: (name: string) => void;
    ongetpickaxe?: () => void;
    updateQuat(quat: Quat) {
        this.gravity.copy(this.acc).applyQuaternion(quat.inverse()).normalize().scale(this.gravityScale)
    }
    updateDirObjects() {
        const sendmessage = this.sendmessage;
        if (!sendmessage) {
            throw new Error("sendmessage is undefined");
        }
        let dir: Direction = "Down";
        {
            if (this.gravity.y === -this.gravityScale) {
                if (this.dirSet.has(dir)) {
                    return;
                }
                this.dirSet.add(dir);
                this.levelSystem.hideDirEntity(dir);
            } else {
                this.dirSet.delete(dir);
                this.levelSystem.showDirEntity(dir);
            }
        }
        dir = "Up";
        {
            if (this.gravity.y === this.gravityScale) {
                if (this.dirSet.has(dir)) {
                    return;
                }
                this.dirSet.add(dir);
                this.levelSystem.hideDirEntity(dir);
            } else {
                this.dirSet.delete(dir);
                this.levelSystem.showDirEntity(dir);
            }
        }
        dir = "Left";
        {
            if (this.gravity.x === -this.gravityScale) {
                if (this.dirSet.has(dir)) {
                    return;
                }
                this.dirSet.add(dir);
                this.levelSystem.hideDirEntity(dir);
            } else {
                this.dirSet.delete(dir);
                this.levelSystem.showDirEntity(dir);
            }
        }
        dir = "Right";
        {
            if (this.gravity.x === this.gravityScale) {
                if (this.dirSet.has(dir)) {
                    return;
                }
                this.dirSet.add(dir);
                this.levelSystem.hideDirEntity(dir);
            } else {
                this.dirSet.delete(dir);
                this.levelSystem.showDirEntity(dir);
            }
        }
    }
    update(timeStamp: number): void {
        this.updateDirObjects();
        this.sendmessage && this.sendmessage({ type: "updateGravity", data: `${this.gravity[0]},${this.gravity[1]},${this.gravity[2]}` })
    }

}