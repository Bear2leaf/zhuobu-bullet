import { Mat4, Quat, Transform, Vec3 } from "ogl";
import { MainMessage, PhysicsObject, WorkerMessage } from "../../worker/ammo.worker";
import { System } from "./System";
import AudioSystem from "./AudioSystem";
import { EventSystem } from "./EventSystem";
import LevelSystem from "./LevelSystem";

type Direction = "Down" | "Up" | "Left" | "Right";
export default class PhysicsSystem implements System {
    private readonly objectNames: Set<string> = new Set();
    private readonly dirSet = new Set<Direction>();
    private levelNode?: Transform;
    private readonly currentCollisions = new Set<string>();
    private readonly gravityScale = 100;
    private readonly gravity = new Vec3();
    private readonly acc = new Vec3(0, -this.gravityScale, 0);
    constructor(
        private readonly levelSystem: LevelSystem
        , private readonly audio: AudioSystem
        , private readonly eventSystem: EventSystem
    ) {
    }
    async load(): Promise<void> {
    }
    init(): void {
        const sendmessage = this.sendmessage;
        if (!sendmessage) {
            throw new Error("sendmessage is undefined");
        }
        this.levelSystem.onaddmesh = (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>, convex?: boolean) => {
            if (!name) {
                throw new Error("name is undefined");
            }
            this.objectNames.add(name);
            const mat4 = new Mat4(...transform)
            const position = new Vec3();
            const quaternion = new Quat();
            const scale = new Vec3();
            mat4.getTranslation(position);
            mat4.getRotation(quaternion);
            mat4.getScaling(scale);
            sendmessage({
                type: "addMesh",
                data: { vertices: [...vertices], indices: [...indices], propertities, name, transform: [...position, ...quaternion, ...scale], convex }
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
        this.eventSystem.onteleport = (from: string, to: string) => {
            sendmessage({
                type: "teleport",
                data: [from, to]
            })
        }
        this.levelSystem.ondisablemesh = this.disableMesh.bind(this);
        this.eventSystem.onpause = () => sendmessage({
            type: "pause"
        })
        this.eventSystem.onrelease = () => sendmessage({
            type: "release"
        })
        this.eventSystem.onremovemesh = (name) => {
            this.objectNames.delete(name);
            sendmessage({
                type: "removeMesh",
                data: name
            })
        }
        this.eventSystem.onupdatevelocity = (name, x, y, z) => {
            sendmessage({
                type: "updateCharacterVelocity",
                data: {
                    name,
                    x,
                    y,
                    z,
                }
            })
        }
        this.eventSystem.onresetworld = () => sendmessage({
            type: "resetWorld",
        })
        this.eventSystem.onchangelevel = (levelNode) => {
            this.objectNames.clear();
            this.currentCollisions.clear();
            this.levelNode = levelNode;
        }
    }
    sendmessage?: (message: MainMessage) => void;
    onmessage(message: WorkerMessage): void {
        const audio = this.audio;
        const sendmessage = this.sendmessage;
        if (!sendmessage) {
            throw new Error("sendmessage is undefined");
        }
        // console.log("message from worker", message);
        if (message.type === "requestLevel") {
            this.dirSet.clear();
            audio.play();
            this.eventSystem.requestLevel();
        } else if (message.type === "ready") {
            sendmessage({
                type: "resetWorld",
            });
        } else if (message.type === "removeBody") {
            this.eventSystem.hideMesh(message.data);
        } else if (message.type === "update") {
            this.eventSystem.updateMesh(message);
        } else if (message.type === "collisionEnter") {
            this.handleCollision(message.data);
            this.currentCollisions.add(message.data[1]);
        } else if (message.type === "collisionExit") {
            this.currentCollisions.delete(message.data[1]);
        } else if (message.type === "collisionUpdate") {
        } else if (message.type === "updateCharacter") {
            const ball = this.levelNode?.parent?.children[0];
            if (ball) {
                ball.position.set(message.data[0], message.data[1], message.data[2]);
                ball.quaternion.set(message.data[3], message.data[4], message.data[5], message.data[6]);
            }
        }
    }
    updateQuat(quat: Quat) {
        this.gravity.copy(this.acc).applyQuaternion(quat.inverse()).normalize().scale(this.gravityScale)
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
    handleCollision(data: [string, string]) {
        // console.log("collision: ", ...data)
        if (data[0] === "Ball") {
            if (this.levelSystem.checkNeedExit(data[1])) {
                this.eventSystem.onupdatevelocity && this.eventSystem.onupdatevelocity(data[0], 0, 0, 0);
                this.eventSystem.onpause && this.eventSystem.onpause();
                this.levelSystem.updateLevel(false);
                this.eventSystem.onresetworld && this.eventSystem.onresetworld();
            } else if (this.levelSystem.checkGetPickaxe(data[1])) {
                this.levelSystem.getPickaxe();
                this.eventSystem.onremovemesh && this.eventSystem.onremovemesh(data[1])
            } else if (this.levelSystem.checkRock(data[1])) {
                this.levelSystem.removeRock(data[1]);
                this.eventSystem.onremovemesh && this.eventSystem.onremovemesh(data[1])
            } else if (this.levelSystem.checkTeleport(data[1])) {
                const to = this.levelSystem.getTeleportDestinationName();
                this.eventSystem.onteleport && this.eventSystem.onteleport(data[0], to);
            } else if (this.levelSystem.checkBeltUp(data[1])) {
                const node = this.levelSystem.getCurrentLevelNode(data[1]);
                const transform = node?.matrix || new Mat4().identity();
                this.addBall(transform)
                this.disableMesh(data[1]);
                this.eventSystem.onupdatevelocity && this.eventSystem.onupdatevelocity(data[0], 0, 200, 0);
            }
        }
    }
    updateDirObjects() {
        let dir: Direction = "Down";
        {
            if (this.gravity.y === -this.gravityScale) {
                if (this.dirSet.has(dir)) {
                    return;
                }
                this.dirSet.add(dir);
                this.levelSystem.hideDirEntity(dir);
            } else if (this.levelSystem.getDirEntities(dir).some((name) => this.currentCollisions.has(name))) {

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
            } else if (this.levelSystem.getDirEntities(dir).some((name) => this.currentCollisions.has(name))) {

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
            } else if (this.levelSystem.getDirEntities(dir).some((name) => this.currentCollisions.has(name))) {

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
            } else if (this.levelSystem.getDirEntities(dir).some((name) => this.currentCollisions.has(name))) {

            } else {
                this.dirSet.delete(dir);
                this.levelSystem.showDirEntity(dir);
            }
        }
    }
    update(timeStamp: number): void {
        this.updateDirObjects();
        const objects: PhysicsObject[] = [];
        this.levelNode?.traverse((node) => {
            if (node.name && this.objectNames.has(node.name)) {
                const physicsObject: PhysicsObject = [
                    node.position.x,
                    node.position.y,
                    node.position.z,
                    node.quaternion.x,
                    node.quaternion.y,
                    node.quaternion.z,
                    node.quaternion.w,
                    node.name
                ]
                objects.push(physicsObject);
            }
        });

        this.sendmessage && this.sendmessage({ type: "updateGravity", data: `${this.gravity[0]},${this.gravity[1]},${this.gravity[2]}` })

        this.sendmessage && this.sendmessage({
            type: "tick",
            data: { delta: timeStamp, objects }
        })
    }
}