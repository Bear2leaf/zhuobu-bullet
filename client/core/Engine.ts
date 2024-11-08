import { Camera, Euler, Mat4, Mesh, Orbit, Program, Quat, Renderer, Sphere, Transform, Vec3 } from "ogl";
import UISystem from "../system/UISystem.js";
import LevelSystem from "../system/LevelSystem.js";
import { CameraSystem } from "../system/CameraSystem.js";
import { RenderSystem } from "../system/RenderSystem.js";
import { InputSystem } from "../system/InputSystem.js";
import { EventSystem } from "../system/EventSystem.js";
import PhysicsSystem from "../system/PhysicsSystem.js";
import AnimationSystem from "../system/AnimationSystem.js";
import Device from "../device/Device.js";
import { System } from "../system/System.js";
import AudioSystem from "../system/AudioSystem.js";
export default class Engine {
    private readonly systems: System[] = [];
    private readonly quat = new Quat()
    private readonly matrix = new Mat4();
    constructor(device: Device) {
        const cameraSystem = new CameraSystem();
        const levelSystem = new LevelSystem();
        const animationSystem = new AnimationSystem();
        const renderSystem = new RenderSystem();
        const uiSystem = new UISystem();
        const inputSystem = new InputSystem();
        const physicsSystem = new PhysicsSystem();
        const audioSystem = new AudioSystem();
        const eventSystem = new EventSystem(
            device,
            inputSystem,
            cameraSystem,
            levelSystem,
            renderSystem,
            uiSystem,
            audioSystem,
            animationSystem,
            physicsSystem
        );
        this.systems.push(eventSystem, audioSystem, renderSystem, cameraSystem, levelSystem, animationSystem,  uiSystem, inputSystem, physicsSystem);
    }
    async load() {
        for await (const system of this.systems) {
            await system.load();
        }
    }
    init() {
        for (const system of this.systems) {
            system.init();
        }
    }
    start() {
        for (const system of this.systems) {
            system.start();
        }
    }
    // Game loop
    loop(timeStamp: number) {
        for (const system of this.systems) {
            system.update(timeStamp);
        }
    }

}


