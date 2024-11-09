import { GLTF, Mat4, OGLRenderingContext, Quat, RenderTarget, Texture } from "ogl";
import { PhysicsObject } from "../../worker/ammo.worker.js";
import Device from "../device/Device.js";
import { GltfLevel } from "../level/GltfLevel.js";
import Button from "../ui/Button.js";
import LevelIndicator from "../ui/LevelIndicator.js";
import Sprite from "../ui/Sprite.js";
import Switch from "../ui/Switch.js";
import AnimationSystem from "./AnimationSystem.js";
import AudioSystem from "./AudioSystem.js";
import { CameraSystem } from "./CameraSystem.js";
import { InputSystem } from "./InputSystem.js";
import LevelSystem from "./LevelSystem.js";
import PhysicsSystem from "./PhysicsSystem.js";
import { RenderSystem } from "./RenderSystem.js";
import { System } from "./System.js";
import UISystem from "./UISystem.js";
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
        private readonly device: Device,
        private readonly inputSystem: InputSystem,
        private readonly cameraSystem: CameraSystem,
        private readonly levelSystem: LevelSystem,
        private readonly renderSystem: RenderSystem,
        private readonly uiSystem: UISystem,
        private readonly audioSystem: AudioSystem,
        private readonly animationSystem: AnimationSystem,
        private readonly physicsSystem: PhysicsSystem
    ) { }
    start(): void {
        const device = this.device;
        device.onmessage = this.physicsSystem.onmessage.bind(this.physicsSystem);
        device.createWorker("dist/worker/main.js");
        this.physicsSystem.sendmessage = device.sendmessage.bind(device);
    }
    init(): void {
        const device = this.device;
        this.availableLevels.add(0);
        const audio = this.audioSystem;
        this.ontoggleaudio = () => {
            audio.toggle();
            this.updateSwitch("audio", audio.isOn())
        }
        this.inputSystem.ondown = () => {
            this.animationSystem.down = true;
        }
        this.inputSystem.onup = () => {
            this.animationSystem.down = false;
            if (!this.uiSystem.freeze) {
                this.uiSystem.getUIElement<LevelIndicator>("indicator").confirm();
                this.onrelease && this.onrelease();
            }
        }
        this.physicsSystem.onrequestlevel = this.requestLevel.bind(this);
        this.physicsSystem.onplayaudio = this.audioSystem.play.bind(this.audioSystem);
        this.physicsSystem.onhideMesh = this.hideMesh.bind(this);
        this.physicsSystem.onupdateMesh = this.updateMesh.bind(this);
        this.physicsSystem.oncheckneedexit = this.levelSystem.checkNeedExit.bind(this.levelSystem);
        this.physicsSystem.oncheckgetpickaxe = this.levelSystem.checkGetPickaxe.bind(this.levelSystem);
        this.physicsSystem.oncheckrock = this.levelSystem.checkRock.bind(this.levelSystem);
        this.physicsSystem.oncheckteleport = this.levelSystem.checkTeleport.bind(this.levelSystem);
        this.physicsSystem.oncheckbeltup = this.levelSystem.checkBeltUp.bind(this.levelSystem);
        this.physicsSystem.ongetdirentities = this.levelSystem.getDirEntities.bind(this.levelSystem);
        this.physicsSystem.onhidedirentity = this.levelSystem.hideDirEntity.bind(this.levelSystem);
        this.physicsSystem.onshowdirentity = this.levelSystem.showDirEntity.bind(this.levelSystem);
        this.levelSystem.onloadtiled = (tiledData) => {
            const images = tiledData.tilesets.map(tileset => tileset.image);
            this.renderSystem.setImages(images);
        }
        this.levelSystem.onaddmesh = (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>, convex?: boolean) => {
            this.physicsSystem.addMesh(name, transform, vertices, indices, propertities, convex);
        }
        this.levelSystem.onaddball = (transform: number[], isBall: boolean) => {
            this.physicsSystem.addBall(transform, isBall);
        }
        this.levelSystem.ondisablemesh = (name: string | undefined) => {
            this.physicsSystem.disableMesh(name);
        }
        this.levelSystem.onenablemesh = (name: string | undefined) => {
            this.physicsSystem.enableMesh(name);
        }
        this.physicsSystem.ongetcurrentlevelnode = (name: string) => {
            return this.levelSystem.getCurrentLevelNode(name);
        }
        this.physicsSystem.ongetteleportdestinationname = () => {
            return this.levelSystem.getTeleportDestinationName();
         }
        this.physicsSystem.onremoverock = (name: string) => {
            this.levelSystem.removeRock(name);
         }
        this.physicsSystem.ongetpickaxe = () => {
            this.levelSystem.getPickaxe();
         }
        this.physicsSystem.onupdatelevel = (reverse: boolean) => {
            this.levelSystem.updateLevel(reverse);
         }
        const quat = new Quat()
        const matrix = new Mat4();
        this.renderSystem.onrender = (renderer) => {
            const levelRoot = this.renderSystem.levelRoot;
            const uiRoot = this.renderSystem.uiRoot;
            const camera = this.cameraSystem.camera;
            const uiCamera = this.cameraSystem.uiCamera;
            const scene = this.renderSystem.levelRoot;
            this.cameraSystem.radius = this.levelSystem.radius;
            this.cameraSystem.ballPosition.copy(this.renderSystem.levelRoot.children[0].position);
            this.cameraSystem.center.copy(this.levelSystem.center);
            quat.fill(0)
            matrix.fromArray(camera.viewMatrix.multiply(scene.worldMatrix));
            matrix.getRotation(quat);
            this.physicsSystem.updateQuat(quat);
            renderer.render({ scene: levelRoot, camera: camera });
            renderer.render({ scene: uiRoot, camera: uiCamera, clear: false });
        }
        this.renderSystem.oninitanimations = (gltf) => {
            this.animationSystem.initAnimations(gltf);
        }
        this.renderSystem.oninitcameras = (gl: OGLRenderingContext) => {
            this.cameraSystem.initCameras(gl, device.getWindowInfo());
        }
        this.renderSystem.oninitui = (gl: OGLRenderingContext) => {
            this.uiSystem.initUI(this.renderSystem.uiRoot, gl);
            this.uiSystem.getUIElement<LevelIndicator>("indicator").onselectlevel = (level) => {
                if (this.levelSystem.current !== level) {
                    this.levelSystem.current = level;
                    this.isContinue = false;
                    this.pause = false;
                    this.physicsSystem.resetWorld();
                }
            };
        }
        this.renderSystem.oninitlevel = (current: number, renderTarget: RenderTarget, textures: Texture[], gl: OGLRenderingContext, gltf: GLTF | undefined, vertex: string, fragment: string, spriteVertex: string, spriteFragment: string) => {
            const level = this.levelSystem.collections[current];
            this.physicsSystem.setLevelNode(level.node);
            if (level.requested) {
                return;
            }
            level.setTextures(textures);
            level.initRenderTarget(renderTarget)
            level.initGraphicsBuffer(gl, vertex, fragment, spriteVertex, spriteFragment, renderTarget)
            level.initGraphics(renderTarget, gl, spriteVertex, spriteFragment, vertex, fragment);
            level.initGltfLevel(gltf);
        }
        this.ongetpickaxe = () => {
            this.levelSystem.getPickaxe();
        };
        this.onpause = () => {
            this.physicsSystem.pause();
        };
        this.onrelease = () => {
            this.physicsSystem.release();
        };
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
                this.physicsSystem.resetWorld()
            } else if (tag === "prev") {
                this.isContinue = false;
                this.levelSystem.updateLevel(true);
                this.updateLevelUI();
                this.physicsSystem.resetWorld()
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
            this.pause = true;
            this.onpause && this.onpause();
            this.uiSystem.getUIElement<LevelIndicator>("indicator").updateCurrent(delta);
            this.updateLevelUI();
        }
        this.renderSystem.oninitlevels = () => {
            const specials = new Set<number>();
            for (let index = 0; index < this.levelSystem.collections.length; index++) {
                const level = this.levelSystem.collections[index];
                if (level instanceof GltfLevel) {
                    specials.add(index);
                }
            }
            this.uiSystem.getUIElement<LevelIndicator>("indicator").updateTotal(this.levelSystem.collections.length, specials);
            this.inputSystem.initInput(device.getWindowInfo(), this.cameraSystem.uiCamera, this.uiSystem.all);
            this.levelSystem.collections.forEach((level, index) => {
                level.init();
                level.node.setParent(this.renderSystem.levelRoot);
            });
        };
        this.inputSystem.onswipe = (dir) => {
            if (this.freezeRotation) {
                return;
            }
            this.cameraSystem.rollCamera(dir, this.levelSystem.isMazeMode)
        }
        this.renderSystem.initRenderer(device.getCanvasGL(), device.getWindowInfo());
        this.audioSystem.initAudioContext(device.createWebAudioContext());
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
    updateMesh(objects: PhysicsObject[]) {
        this.renderSystem.updateMesh(objects, this.levelSystem)
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
    ontoggleaudio?: VoidFunction;
    ongetpickaxe?: () => void;
    onpause?: () => void;
    onrelease?: () => void;
    update(timeStamp: number): void {
    }

}