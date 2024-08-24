import { Camera, Euler, Mat4, Mesh, Orbit, Program, Quat, Renderer, Sphere, Transform, Vec3 } from "ogl";
import UISystem from "../system/UISystem.js";
import LevelSystem from "../system/LevelSystem.js";
import { CameraSystem } from "../system/CameraSystem.js";
import { RenderSystem } from "../system/RenderSystem.js";
import { InputSystem } from "../system/InputSystem.js";
import { EventSystem } from "../system/EventSystem.js";
import AudioSystem from "../system/AudioSystem.js";
export default class Engine {
    private readonly renderer: Renderer;
    private readonly uiSystem: UISystem;
    private readonly levelSystem: LevelSystem;
    private readonly inputSystem: InputSystem;
    private readonly cameraSystem: CameraSystem;
    private readonly renderSystem: RenderSystem;
    readonly eventSystem: EventSystem;
    private readonly quat = new Quat()
    private readonly matrix = new Mat4();
    constructor(width: number, height: number, dpr: number, canvas: HTMLCanvasElement, private readonly audio: AudioSystem) {
        const renderer = this.renderer = new Renderer({ dpr, canvas });
        const gl = renderer.gl;
        gl.clearColor(0.3, 0.3, 0.6, 1);
        renderer.setSize(width, height);
        this.cameraSystem = new CameraSystem(gl, [width, height, dpr]);
        this.levelSystem = new LevelSystem();
        this.renderSystem = new RenderSystem(gl, this.levelSystem);
        this.uiSystem = new UISystem(renderer, this.renderSystem.uiRoot);
        this.inputSystem = new InputSystem(width, height, this.cameraSystem.uiCamera, this.uiSystem);

        this.audio.initAudioContext();
        this.eventSystem = new EventSystem(
            this.inputSystem,
            this.cameraSystem,
            this.levelSystem,
            this.renderSystem,
            this.uiSystem,
            this.audio
        );
    }
    async load() {

        await this.audio.load();
        await this.eventSystem.load();
        await this.uiSystem.load();
        await this.levelSystem.load();
        this.renderSystem.tiledData = this.levelSystem.tiledData;
        await this.renderSystem.load();
    }
    start() {
        this.audio.init();
        this.levelSystem.init();
        this.uiSystem.init();
        this.inputSystem.init();
        this.inputSystem.initTouchEvents();
        this.renderSystem.init();
        this.eventSystem.init();

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

        this.eventSystem.updateQuat(this.quat);

        this.eventSystem.update(timeStamp);
    }

}


