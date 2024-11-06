import { System } from "./System.js";
import { InputSystem } from "./InputSystem.js";
import AudioSystem from "./AudioSystem.js";
import { CameraSystem } from "./CameraSystem.js";
import LevelSystem from "./LevelSystem.js";
import { RenderSystem } from "./RenderSystem.js";
import UISystem from "./UISystem.js";
import Button from "../ui/Button.js";
import Switch from "../ui/Switch.js";
import Sprite from "../ui/Sprite.js";
import AnimationSystem from "./AnimationSystem.js";
import LevelIndicator from "../ui/LevelIndicator.js";
import { GltfLevel } from "../level/GltfLevel.js";
export class EventSystem implements System {
    private readonly helpMsg = "操作说明：\n1.划动屏幕旋转关卡\n2.引导小球抵达终点\n3.点击缩放聚焦小球\n4.点击箭头切换关卡\n（点击关闭说明）";
    private readonly continueMsg = "恭喜过关！\n点击进入下一关";
    private readonly availableLevels: Set<number> = new Set();
    private charset: string = "";
    private pause = false;
    private isContinue: boolean = false;
    private continueButtonResolve?: (value: unknown) => void;
    private freezeRotation: boolean = false;
    constructor(
        private readonly inputSystem: InputSystem,
        private readonly cameraSystem: CameraSystem,
        private readonly levelSystem: LevelSystem,
        private readonly renderSystem: RenderSystem,
        private readonly uiSystem: UISystem,
        private readonly audio: AudioSystem,
        private readonly animationSystem: AnimationSystem

    ) { }
    init(): void {
        this.availableLevels.add(0);
        const audio = this.audio;
        this.ontoggleaudio = () => {
            audio.toggle();
            this.updateSwitch("audio", audio.isOn())
        }
        this.inputSystem.ondown = () => {
            this.animationSystem.down = true;
        }
        this.inputSystem.onup = () => {
            this.animationSystem.down = false;
            this.uiSystem.getUIElement<LevelIndicator>("indicator").confirm();
        }
        this.inputSystem.onclick = (tag) => {
            if (this.uiSystem.freeze) {
                if (tag === "continue") {
                    this.continueButtonResolve && this.continueButtonResolve(void (0));
                    this.updateButton("continue");
                    this.continueButtonResolve = undefined;
                    this.onrelease && this.onrelease();
                }
                return;
            }
            if (tag === "pause") {
                this.updatePause();
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
        this.inputSystem.onupdateIndicator = (delta: number) => {
            if (this.uiSystem.freeze) {
                return;
            }
            this.uiSystem.getUIElement<LevelIndicator>("indicator").updateCurrent(delta);
            this.updateLevelUI();
        }
        const specials = new Set<number>();
        for (let index = 0; index < this.levelSystem.collections.length; index++) {
            const level = this.levelSystem.collections[index];
            if (level instanceof GltfLevel) {
                specials.add(index);
            }

        }
        this.uiSystem.getUIElement<LevelIndicator>("indicator").updateTotal(this.renderSystem.levelRoot.children.length - 1, specials);
        this.inputSystem.onswipe = (dir) => {
            if (this.freezeRotation) {
                return;
            }
            this.cameraSystem.rollCamera(dir, this.levelSystem.isMazeMode)
        }
        this.uiSystem.getUIElement<LevelIndicator>("indicator").onselectlevel = (level) => {
            if (this.levelSystem.current !== level) {
                this.levelSystem.current = level;
                this.isContinue = false;
                this.pause = false;
                this.onresetworld && this.onresetworld();
            }
        };
    }
    updateLevelUI() {
        const current = this.uiSystem.getUIElement<LevelIndicator>("indicator").getCurrent();
        const root = this.levelSystem.collections[current];
        if (!root.node.name) {
            throw new Error("Level name is undefined");
        }
        this.uiSystem.getUIElement<Button>("level").generateText(root.node.name);
    }
    async requestLevel() {
        this.pause = false;
        this.uiSystem.getUIElement<Button>("help").generateText(this.helpMsg);
        if (this.isContinue) {
            this.uiSystem.freeze = true;
            await this.waitContinueButton();
        }
        this.renderSystem.initCurrentLevel(this.levelSystem.current);
        this.levelSystem.request(this.renderSystem.levelRoot);
        if (this.levelSystem.current === 0) {
            this.updateButton("help", true);
        }
        if (this.isContinue) {
            this.availableLevels.add(this.levelSystem.current);
        }
        // this.updateSwitch("pause", true);

        this.uiSystem.getUIElement<LevelIndicator>("indicator").updateCurrent(this.levelSystem.current, true);
        this.updateLevelUI();
        this.checkCharset();
        this.isContinue = true;
        this.uiSystem.freeze = false;
        this.cameraSystem.resetRotation();
        if (this.levelSystem.isCurrentGltfLevel()) {
            this.freezeRotation = true;
            this.cameraSystem.isGltf = true;
        } else {
            this.freezeRotation = false;
            this.cameraSystem.isGltf = false;
        }
        // if (this.availableLevels.has(this.levelSystem.current + 1)) {
        //     this.updateSprite("next", true);
        // } else {
        //     this.updateSprite("next", false);
        // }
        // if (this.availableLevels.has(this.levelSystem.current - 1)) {
        //     this.updateSprite("prev", true);
        // } else {
        //     this.updateSprite("prev", false);
        // }
    }

    updateSwitch(name: string, value: boolean) {
        if (value) {
            this.uiSystem.getUIElement<Switch>(name).on();
        } else {
            this.uiSystem.getUIElement<Switch>(name).off();
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
            this.uiSystem.getUIElement<Button>(name).getMesh().visible = !this.uiSystem.getUIElement<Button>(name).getMesh().visible;
        } else {
            this.uiSystem.getUIElement<Button>(name).getMesh().visible = visible;
        }
    }
    private updateSprite(name: string, visible?: boolean) {
        if (visible === undefined) {
            this.uiSystem.getUIElement<Sprite>(name).getMesh().visible = !this.uiSystem.getUIElement<Sprite>(name).getMesh().visible;
        } else {
            this.uiSystem.getUIElement<Sprite>(name).getMesh().visible = visible;
        }
    }
    private async waitContinueButton() {
        this.updateButton("continue", true);
        this.uiSystem.getUIElement<Button>("continue").generateText("恭喜过关\n点击进入下一关")
        await new Promise((resolve) => {
            this.continueButtonResolve = resolve;
        })
    }
    private updatePause() {
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
    async load(): Promise<void> {
        this.charset = await (await fetch("resources/font/charset.txt")).text();
    };
    onpause?: () => void;
    onrelease?: () => void;
    onclick?: (tag?: string) => void;
    onteleport?: (from: string, to: string) => void;
    onupdatevelocity?: (name: string, x: number, y: number, z: number) => void;
    ontoggleaudio?: VoidFunction;
    onresetworld?: VoidFunction;
    onremovemesh?: (name: string) => void;
    ongetpickaxe?: () => void;
    update(timeStamp: number): void {
    }

}