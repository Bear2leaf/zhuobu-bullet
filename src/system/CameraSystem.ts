import { Camera, Euler, OGLRenderingContext, Quat, Vec3 } from "ogl";
import { table } from "../engine/rotation.js";
import { System } from "./System.js";

export class CameraSystem implements System {
    private _uiCamera?: Camera;
    private _camera?: Camera;
     get uiCamera(): Camera {
        if (!this._uiCamera) {
            throw new Error("ui camera not initialized");
        }
        return this._uiCamera;
    };
     get camera(): Camera {
        if (!this._camera) {
            throw new Error("camera not initialized");
        }
        return this._camera;
    };
    private readonly rotation: Vec3 = new Vec3;
    private readonly sceneRotation = new Vec3();
    private readonly sceneEuler = new Euler();
    private readonly sceneQuat = new Quat();
    private readonly tempPosition = new Vec3();
    readonly ballPosition = new Vec3();
    readonly center: Vec3 = new Vec3;
    private t = 0;
    private scaleT = 0;
    scale = 0;
    radius: number = 0;
    isGltf: boolean = false;
    async load(): Promise<void> {
    }
    initCameras(gl: OGLRenderingContext, windowInfo: WechatMinigame.WindowInfo): void {
        const width = windowInfo.windowWidth;
        const height = windowInfo.windowHeight;
        const dpr = windowInfo.pixelRatio;
        const ratio = width / height;
        this._uiCamera = new Camera(gl, {
            left: ratio * -5 * dpr,
            right: ratio * 5 * dpr,
            top: 5 * dpr,
            bottom: -5 * dpr,
            near: 0,
            far: 1000
        })
        this.uiCamera.position.z = 1;

        this._camera = new Camera(gl, {
            left: -width * 50 / height,
            right: width * 50 / height,
            top: 50,
            bottom: -50,
            aspect: ratio,
            near: 0.1,
            far: 1000
        })
    }
    init(): void {
    }
    start(): void {
    }
    update(timeStamp: number): void {
        this.t = Math.min(1, this.t + timeStamp);
        this.scaleT = Math.min(1, this.scaleT + timeStamp);
        this.sceneEuler.set(this.sceneRotation.x, this.sceneRotation.y, this.sceneRotation.z);
        this.sceneQuat.fromEuler(this.sceneEuler);
        this.camera.quaternion.slerp(this.sceneQuat, this.t);
        const cameraZ = this.radius / Math.tan(this.camera.fov / 2.0);
        if (this.scale) {
            this.center.copy(this.ballPosition);
            this.center.z = cameraZ;
        } else {
            this.center.z = cameraZ * 2;
        }
        this.camera.position = this.tempPosition.lerp(this.center, this.scaleT);
        this.camera.position.z = Math.max(this.camera.position.z, 0.0001);
        if(this.isGltf) {
            this.camera.perspective({
                fov: 45,
            });
        } else {
            this.camera.orthographic({ zoom: 50 / this.camera.position.z });
        }
    }
    rollCamera(tag: "right" | "left" | "up" | "down", isMazeMode: boolean) {
        const rotation = this.rotation;
        if (!isMazeMode) {
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
    updateZoom() {
        this.scale = (this.scale + 1) % 2;
        this.scaleT = 0;
    }
    resetRotation() {

        this.rotation.fill(0)
        this.sceneRotation.fill(0);
    }

}