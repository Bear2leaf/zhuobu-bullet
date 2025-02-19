import { Mat4, Mesh, Quat, Transform, Vec3 } from "ogl";
import { MainMessage, PhysicsObject, WorkerMessage } from "../worker/ammo.worker";
import { System } from "./System";

type Direction = "Down" | "Up" | "Left" | "Right";
export default class PhysicsSystem implements System {
    private readonly objectNames: Set<string> = new Set();
    private readonly dirSet = new Set<Direction>();
    private readonly currentCollisions = new Set<string>();
    private readonly gravityScale = 100;
    private readonly gravity = new Vec3();
    private readonly acc = new Vec3(0, -this.gravityScale, 0);
    private _levelNode?: Transform;
    private get levelNode() {
        if (!this._levelNode) {
            throw new Error("levelNode not initialized");
        }
        return this._levelNode;
    }

    async load(): Promise<void> {
    }
    setLevelNode(levelNode: Transform) {
        this._levelNode = levelNode;
    }
    addMesh(name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>, convex?: boolean) {
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
        this.sendmessage && this.sendmessage({
            type: "addMesh",
            data: { vertices: [...vertices], indices: [...indices], propertities, name, transform: [...position, ...quaternion, ...scale], convex }
        })
    }
    enableMesh(name: string | undefined) {
        this.sendmessage && this.sendmessage({
            type: "enableMesh",
            data: name || ""
        })
    }
    teleport(from: string, to: string) {
        this.sendmessage && this.sendmessage({
            type: "teleport",
            data: [from, to]
        })
    }
    pause() {
        this.sendmessage && this.sendmessage({
            type: "pause"
        })
    }
    release() {
        this.sendmessage && this.sendmessage({
            type: "release"
        })
    }
    removeMesh(name: string) {
        this.objectNames.delete(name);
        this.sendmessage && this.sendmessage({
            type: "removeMesh",
            data: name
        })
    }
    updateVelocity(name: string, x: number, y: number, z: number) {
        this.sendmessage && this.sendmessage({
            type: "updateCharacterVelocity",
            data: { name, x, y, z }
        })
    }
    resetWorld() {
        this.sendmessage && this.sendmessage({
            type: "resetWorld"
        })
    }
    init(): void {
    }
    start(): void {
    }



    sendmessage?: (message: MainMessage) => void;
    onmessage(message: WorkerMessage): void {
        const sendmessage = this.sendmessage;
        if (!sendmessage) {
            throw new Error("sendmessage is undefined");
        }
        // console.log("message from worker", message);
        if (message.type === "requestLevel") {
            this.dirSet.clear();
            this.objectNames.clear();
            this.currentCollisions.clear();
            this.onplayaudio && this.onplayaudio();
            this.onrequestlevel && this.onrequestlevel();
        } else if (message.type === "ready") {
            sendmessage({
                type: "resetWorld",
            });
        } else if (message.type === "removeBody") {
            this.onhideMesh && this.onhideMesh(message.data);
        } else if (message.type === "update") {
            this.onupdateMesh && this.onupdateMesh(message.objects);
        } else if (message.type === "collisionEnter") {
            this.handleCollision(message.data);
            this.currentCollisions.add(message.data[1]);
        } else if (message.type === "collisionExit") {
            this.currentCollisions.delete(message.data[1]);
        } else if (message.type === "collisionUpdate") {
        } else if (message.type === "updateCharacter") {
            const ball = this.levelNode.parent?.children[0];
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
    addBall(transform: number[], isBall: boolean) {
        this.sendmessage && this.sendmessage({
            type: "addBall",
            data: {
                transform,
                isBall
            }
        })
    }
    handleCollision(data: [string, string]) {
        // console.log("collision: ", ...data)
        if (data[0] === "Ball") {
            if (this.oncheckneedexit && this.oncheckneedexit(data[1])) {
                this.updateVelocity(data[0], 0, 0, 0);
                this.pause && this.pause();
                this.onupdatelevel && this.onupdatelevel(false);
                this.resetWorld && this.resetWorld();
            } else if (this.oncheckgetpickaxe && this.oncheckgetpickaxe(data[1])) {
                this.ongetpickaxe && this.ongetpickaxe();
                this.removeMesh(data[1])
            } else if (this.oncheckrock && this.oncheckrock(data[1])) {
                this.onremoverock && this.onremoverock(data[1]);
                this.removeMesh(data[1])
            } else if (this.oncheckteleport && this.oncheckteleport(data[1])) {
                const to = this.ongetteleportdestinationname && this.ongetteleportdestinationname();
                if (!to) {
                    throw new Error("to is undefined");
                }
                this.teleport(data[0], to);
            } else if (this.oncheckbeltup && this.oncheckbeltup(data[1])) {
                const node = this.ongetcurrentlevelnode && this.ongetcurrentlevelnode(data[1]);
                if (!node) {
                    throw new Error("node is undefined");
                }
                const transform = node.matrix;
                this.addBall(transform, true);
                this.updateVelocity(data[0], 0, 200, 0);
            }
        }
    }
    ongetcurrentlevelnode?: (name: string) => Transform | undefined;
    ongetteleportdestinationname?: () => string;
    onremoverock?: (name: string) => void;
    ongetpickaxe?: () => void;
    onupdatelevel?: (reverse: boolean) => void;
    updateDirObjects() {
        let dir: Direction = "Down";
        {
            if (this.gravity.y === -this.gravityScale) {
                if (this.dirSet.has(dir)) {
                    return;
                }
                this.dirSet.add(dir);
                this.onhidedirentity && this.onhidedirentity(dir);
            } else if (this.ongetdirentities && this.ongetdirentities(dir).some((name) => this.currentCollisions.has(name))) {

            } else {
                this.dirSet.delete(dir);
                this.onshowdirentity && this.onshowdirentity(dir);
            }
        }
        dir = "Up";
        {
            if (this.gravity.y === this.gravityScale) {
                if (this.dirSet.has(dir)) {
                    return;
                }
                this.dirSet.add(dir);
                this.onhidedirentity && this.onhidedirentity(dir);
            } else if (this.ongetdirentities && this.ongetdirentities(dir).some((name) => this.currentCollisions.has(name))) {

            } else {
                this.dirSet.delete(dir);
                this.onshowdirentity && this.onshowdirentity(dir);
            }
        }
        dir = "Left";
        {
            if (this.gravity.x === -this.gravityScale) {
                if (this.dirSet.has(dir)) {
                    return;
                }
                this.dirSet.add(dir);
                this.onhidedirentity && this.onhidedirentity(dir);
            } else if (this.ongetdirentities && this.ongetdirentities(dir).some((name) => this.currentCollisions.has(name))) {

            } else {
                this.dirSet.delete(dir);
                this.onshowdirentity && this.onshowdirentity(dir);
            }
        }
        dir = "Right";
        {
            if (this.gravity.x === this.gravityScale) {
                if (this.dirSet.has(dir)) {
                    return;
                }
                this.dirSet.add(dir);
                this.onhidedirentity && this.onhidedirentity(dir);
            } else if (this.ongetdirentities && this.ongetdirentities(dir).some((name) => this.currentCollisions.has(name))) {

            } else {
                this.dirSet.delete(dir);
                this.onshowdirentity && this.onshowdirentity(dir);
            }
        }
    }
    onplayaudio?: () => void;
    onrequestlevel?: () => void;
    onhideMesh?: (name: string) => void;
    onupdateMesh?: (data: PhysicsObject[]) => void;
    oncheckneedexit?: (name: string) => boolean;
    oncheckgetpickaxe?: (name: string) => boolean;
    oncheckrock?: (name: string) => boolean;
    oncheckteleport?: (name: string) => boolean;
    oncheckbeltup?: (name: string) => boolean;
    ongetdirentities?: (dir: "Down" | "Up" | "Left" | "Right") => string[];
    onhidedirentity?: (dir: "Down" | "Up" | "Left" | "Right") => void
    onshowdirentity?: (dir: "Down" | "Up" | "Left" | "Right") => void
    update(timeStamp: number): void {
        if (this._levelNode === undefined) {
            return;
        }
        this.updateDirObjects();
        const objects: PhysicsObject[] = [];
        this.levelNode.traverse((node) => {
            if (node.name && this.objectNames.has(node.name) && !(node instanceof Mesh)) {
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