import { Camera, Euler, OGLRenderingContext, Quat, Vec3 } from "ogl";
import { System } from "./System.js";
import Device from "../device/Device.js";
import { table } from "../misc/rotation.js";

export class CameraSystem implements System {
    readonly uiCamera: Camera;
    readonly camera: Camera
    private readonly rotation: Vec3 = new Vec3;
    private readonly sceneRotation = new Vec3();
    private readonly sceneEuler = new Euler();
    private readonly sceneQuat = new Quat();
    private readonly tempPosition = new Vec3();
    readonly ballPosition = new Vec3();
    readonly levelPosition = new Vec3();
    readonly center: Vec3 = new Vec3;
    private t = 0;
    private scaleT = 0;
    scale = 0;
    radius: number = 0;
    constructor(gl: OGLRenderingContext, windowInfo: [number, number, number]) {
        const [width, height, dpr] = windowInfo;
        const ratio = width / height;
        this.uiCamera = new Camera(gl, {
            left: ratio * -5 * dpr,
            right: ratio * 5 * dpr,
            top: 5 * dpr,
            bottom: -5 * dpr
        })
        this.uiCamera.position.z = 1;

        this.camera = new Camera(gl, {
            left: -width * 50 / height,
            right: width * 50 / height,
            top: 50,
            bottom: -50,
            near: 0,
            far: 10000
        })
    }
    load(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    init(): void {
        throw new Error("Method not implemented.");
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
        this.camera.position = this.tempPosition.lerp(this.center.sub(this.levelPosition), this.scaleT);
        this.camera.position.z = Math.max(this.camera.position.z, 0.0001);
        this.camera.orthographic({ zoom: 50 / this.camera.position.z });
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