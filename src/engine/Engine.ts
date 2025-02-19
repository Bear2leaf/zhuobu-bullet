import { Mat4, Quat } from "ogl";
import Device from "../device/Device.js";
import AnimationSystem from "../system/AnimationSystem.js";
import AudioSystem from "../system/AudioSystem.js";
import { CameraSystem } from "../system/CameraSystem.js";
import { EventSystem } from "../system/EventSystem.js";
import { InputSystem } from "../system/InputSystem.js";
import LevelSystem from "../system/LevelSystem.js";
import PhysicsSystem from "../system/PhysicsSystem.js";
import { RenderSystem } from "../system/RenderSystem.js";
import { System } from "../system/System.js";
export default class Engine {
    private readonly systems: System[] = [];
    private readonly quat = new Quat()
    private readonly matrix = new Mat4();
    constructor(device: Device) {
        const cameraSystem = new CameraSystem();
        const levelSystem = new LevelSystem();
        const animationSystem = new AnimationSystem();
        const renderSystem = new RenderSystem();
        const inputSystem = new InputSystem();
        const physicsSystem = new PhysicsSystem();
        const audioSystem = new AudioSystem();
        const eventSystem = new EventSystem(
            device,
            inputSystem,
            cameraSystem,
            levelSystem,
            renderSystem,
            audioSystem,
            animationSystem,
            physicsSystem
        );
        this.systems.push(eventSystem, audioSystem, levelSystem, renderSystem, cameraSystem, inputSystem, animationSystem, physicsSystem);
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


