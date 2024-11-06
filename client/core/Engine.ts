import { Camera, Euler, Mat4, Mesh, Orbit, Program, Quat, Renderer, Sphere, Transform, Vec3 } from "ogl";
import UISystem from "../system/UISystem.js";
import LevelSystem from "../system/LevelSystem.js";
import { CameraSystem } from "../system/CameraSystem.js";
import { RenderSystem } from "../system/RenderSystem.js";
import { InputSystem } from "../system/InputSystem.js";
import { EventSystem } from "../system/EventSystem.js";
import AudioSystem from "../system/AudioSystem.js";
import PhysicsSystem from "../system/PhysicsSystem.js";
import AnimationSystem from "../system/AnimationSystem.js";
export default class Engine {
    private readonly renderer: Renderer;
    private readonly uiSystem: UISystem;
    private readonly levelSystem: LevelSystem;
    private readonly inputSystem: InputSystem;
    private readonly cameraSystem: CameraSystem;
    private readonly renderSystem: RenderSystem;
    private readonly animationSystem: AnimationSystem;
    readonly physicsSystem: PhysicsSystem;
    private readonly eventSystem: EventSystem;
    private readonly quat = new Quat()
    private readonly matrix = new Mat4();
    constructor(width: number, height: number, dpr: number, canvas: HTMLCanvasElement, private readonly audioSystem: AudioSystem) {
        const renderer = this.renderer = new Renderer({ dpr, canvas, antialias: true });
        const gl = renderer.gl;
        gl.clearColor(0.3, 0.3, 0.6, 1);
        renderer.setSize(width, height);
        this.cameraSystem = new CameraSystem(gl, [width, height, dpr]);
        this.levelSystem = new LevelSystem();
        this.animationSystem = new AnimationSystem();
        this.renderSystem = new RenderSystem(renderer, this.cameraSystem.camera, this.cameraSystem.uiCamera, this.levelSystem, this.animationSystem);
        this.uiSystem = new UISystem(renderer, this.renderSystem.uiRoot, this.cameraSystem.uiCamera);
        this.inputSystem = new InputSystem(width, height, this.cameraSystem.uiCamera, this.uiSystem);
        this.audioSystem.initAudioContext();
        this.eventSystem = new EventSystem(
            this.inputSystem,
            this.cameraSystem,
            this.levelSystem,
            this.renderSystem,
            this.uiSystem,
            this.audioSystem,
            this.animationSystem
        );
        this.physicsSystem = new PhysicsSystem(this.levelSystem, this.audioSystem, this.eventSystem);
    }
    async load() {

        await this.eventSystem.load();
        await this.audioSystem.load();
        await this.uiSystem.load();
        await this.levelSystem.load();
        this.renderSystem.tiledData = this.levelSystem.tiledData;
        await this.renderSystem.load();
        await this.physicsSystem.load();
    }
    start() {
        this.audioSystem.init();
        this.levelSystem.init();
        this.uiSystem.init();
        this.inputSystem.init();
        this.inputSystem.initTouchEvents();
        this.renderSystem.init();
        this.physicsSystem.init();
        this.eventSystem.init();
    }
    // Game loop
    loop(timeStamp: number) {
        const scene = this.renderSystem.levelRoot;
        const camera = this.cameraSystem.camera;
        this.cameraSystem.radius = this.levelSystem.radius;
        this.cameraSystem.ballPosition.copy(this.renderSystem.levelRoot.children[0].position);
        this.cameraSystem.center.copy(this.levelSystem.center);
        this.cameraSystem.update(timeStamp);
        this.uiSystem.update(timeStamp);
        this.animationSystem.update(timeStamp);
        this.renderSystem.update(timeStamp);
        this.quat.fill(0)
        this.matrix.fromArray(camera.viewMatrix.multiply(scene.worldMatrix));
        this.matrix.getRotation(this.quat);
        this.physicsSystem.updateQuat(this.quat);
        this.physicsSystem.update(timeStamp);
        this.eventSystem.update(timeStamp);
    }

}


