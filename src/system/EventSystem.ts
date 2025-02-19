import { Camera, GLTF, Mat4, OGLRenderingContext, Quat, RenderTarget, Shadow, Texture, Vec3 } from "ogl";
import { PhysicsObject } from "../worker/ammo.worker.js";
import Device from "../device/Device.js";
import { GltfLevel } from "../engine/GltfLevel.js";
import AnimationSystem from "./AnimationSystem.js";
import AudioSystem from "./AudioSystem.js";
import { CameraSystem } from "./CameraSystem.js";
import { InputSystem } from "./InputSystem.js";
import LevelSystem from "./LevelSystem.js";
import PhysicsSystem from "./PhysicsSystem.js";
import { RenderSystem } from "./RenderSystem.js";
import { System } from "./System.js";
export class EventSystem implements System {
    constructor(
        private readonly device: Device,
        private readonly inputSystem: InputSystem,
        private readonly cameraSystem: CameraSystem,
        private readonly levelSystem: LevelSystem,
        private readonly renderSystem: RenderSystem,
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
        this.inputSystem.ondown = () => {
            this.animationSystem.down = true;
        }
        this.inputSystem.onup = () => {
            this.animationSystem.down = false;
        }
        this.physicsSystem.onrequestlevel = this.requestLevel.bind(this);
        this.physicsSystem.onplayaudio = this.audioSystem.play.bind(this.audioSystem);
        this.physicsSystem.onupdateMesh = this.updateMesh.bind(this);
        this.physicsSystem.oncheckneedexit = this.levelSystem.checkNeedExit.bind(this.levelSystem);
        this.physicsSystem.oncheckteleport = this.levelSystem.checkTeleport.bind(this.levelSystem);
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
        this.physicsSystem.onupdatelevel = (reverse: boolean) => {
            this.levelSystem.updateLevel(reverse);
         }
        const quat = new Quat()
        const matrix = new Mat4();
        this.renderSystem.onrender = (renderer, shadow) => {
            const levelRoot = this.renderSystem.levelRoot;
            const camera = this.cameraSystem.camera;
            const scene = this.renderSystem.levelRoot;
            this.cameraSystem.radius = this.levelSystem.radius;
            this.cameraSystem.ballPosition.copy(this.renderSystem.levelRoot.children[0].position);
            this.cameraSystem.center.copy(this.levelSystem.center);
            quat.fill(0)
            matrix.fromArray(camera.viewMatrix.multiply(scene.worldMatrix));
            matrix.getRotation(quat);
            this.physicsSystem.updateQuat(quat);
            shadow.render({ scene: levelRoot });
            renderer.render({ scene: levelRoot, camera: camera });
        }
        this.renderSystem.oninitanimations = (gltf) => {
            this.animationSystem.initAnimations(gltf);
        }
        this.renderSystem.oninitcameras = (gl: OGLRenderingContext) => {
            this.cameraSystem.initCameras(gl, device.getWindowInfo());
            // Swap between the 'fov' and 'left/right/etc' lines to switch from an orthographic to perspective camera,
            // and hence, directional light to spotlight projection.
            const light = new Camera(gl, {
                left: -10,
                right: 10,
                bottom: -10,
                top: 10,
                // fov: 30,
                
                near: 1,
                far: 20,
            });
            light.position.set(3, 5, 8);
            light.lookAt([0, 0, 0]);

            // Create shadow instance attached to light camera
            const shadow = new Shadow(gl, { light });
            this.renderSystem._shadow = shadow
        }
        this.renderSystem.oninitlevel = (current: number, gltf: GLTF | undefined) => {
            const level = this.levelSystem.collections[current];
            this.physicsSystem.setLevelNode(level.node);
            level.initGltfLevel(gltf);
        }
        this.onpause = () => {
            this.physicsSystem.pause();
        };
        this.renderSystem.oninitlevels = (gltf) => {
            const specials = new Set<number>();
            for (const scene of gltf.scene) {
                for (const collection of scene.children) {
                    if (collection.name !== "others" && collection.name !== undefined) {
                        this.levelSystem.collections.push(new GltfLevel(collection.name));
                    }
                }
            }
            for (let index = 0; index < this.levelSystem.collections.length; index++) {
                const level = this.levelSystem.collections[index];
                if (level instanceof GltfLevel) {
                    specials.add(index);
                }
            }
            this.inputSystem.initInput(device.getWindowInfo());
            this.levelSystem.collections.forEach((level, index) => {
                level.node.setParent(this.renderSystem.levelRoot);
            });
        };
        this.renderSystem.initRenderer(device.getCanvasGL(), device.getWindowInfo());
        this.audioSystem.initAudioContext(device.createWebAudioContext());
    }
     requestLevel() {
        this.renderSystem.initCurrentLevel(this.levelSystem.current);
        this.levelSystem.request(this.renderSystem.levelRoot);
    }

    updateMesh(objects: PhysicsObject[]) {
        this.renderSystem.updateMesh(objects, this.levelSystem)
    }
    async load(): Promise<void> {
    };
    ontoggleaudio?: VoidFunction;
    ongetpickaxe?: () => void;
    onpause?: () => void;
    update(timeStamp: number): void {
    }

}