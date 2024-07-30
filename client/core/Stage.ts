import { Box, Camera, Mesh, Program, Renderer, Transform, Vec3, Plane, Sphere, GLTF, GLTFLoader, AttributeData, Orbit, GLTFProgram, Skin, Texture, Mat4, Quat, Euler, AxesHelper, Vec2, Triangle } from "ogl";
import Device from "../device/Device.js";
import { WorkerMessage } from "../../worker/ammo.worker.js";
import UI from "./UI.js";
import Level from "./Level.js";
import { table } from "../misc/rotation.js";
function lerp(x0: number, x1: number, t: number) {
    return x0 + (x1 - x0) * t;
}

export default class Stage {
    private readonly renderer: Renderer;
    private readonly scene: Transform;
    private readonly camera: Camera;
    private readonly ui: UI;
    private readonly level: Level;
    private readonly quat = new Quat()
    private readonly matrix = new Mat4();
    private readonly rotation: Vec3 = new Vec3;
    private readonly sceneRotation = new Vec3();
    private readonly sceneScale = new Vec3(0.01, 0.01, 0.01);
    private readonly sceneEuler = new Euler();
    private readonly sceneQuat = new Quat();
    private readonly tempQuat = new Quat();
    private readonly tempPosition = new Vec3();
    private fragment: string = "";
    private vertex: string = "";
    private t = 0;
    private scaleT = 0;
    private scale = 0;
    onclick?: (tag?: string) => void;
    onorientationchange?: (quat: Quat) => void;

    constructor(device: Device) {
        const [width, height, dpr] = device.getWindowInfo();
        const renderer = this.renderer = new Renderer({ dpr, canvas: device.getCanvasGL() });
        const gl = renderer.gl;
        gl.clearColor(0.3, 0.3, 0.6, 1);
        const camera = this.camera = new Camera(gl, {
            aspect: width / height,
            fov: 45
        })
        camera.position.z = 0.5;
        renderer.setSize(width, height);
        this.level = new Level(renderer.gl);
        this.level.onaddmesh = (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>) => {
            this.onaddmesh && this.onaddmesh(name, transform, vertices, indices, propertities);
        }
        this.level.onaddball = (transform) => {
            this.onaddball && this.onaddball(transform);
        }
        this.scene = new Transform();
        this.ui = new UI(renderer);
    }
    async load() {

        this.vertex = await (await fetch("resources/glsl/simple.vert.sk")).text();
        this.fragment = await (await fetch("resources/glsl/simple.frag.sk")).text();
        await this.ui.load();
        await this.level.load();
    }
    onaddmesh?: (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>) => void;
    onaddball?: (transform: number[]) => void;

    rollCamera(tag: "right" | "left" | "up" | "down") {
        const rotation = this.rotation;
        const key = `${rotation.x}${rotation.y}${rotation.z}`;
        table[key](tag, rotation);
        this.sceneRotation.set(rotation.x * Math.PI / 2, rotation.y * Math.PI / 2, rotation.z * Math.PI / 2);
        this.t = 0;
    }
    updateZoom() {
        this.scale = (this.scale + 1) % 2;
        this.sceneScale.set(this.scale + 1, this.scale + 1, this.scale + 1);
        this.sceneScale.multiply(0.01);
        this.scene.children[0].worldMatrix.getTranslation(this.tempPosition)
        this.scaleT = 0;
        this.updateSwitch("zoom", !this.scale)
    }
    start() {
        {
            this.ui.init();
            this.ui.onclick = (tag) => {
                this.onclick && this.onclick(tag);
            }
        }
    }

    setInitLevel(level: number) {
        this.level.setIndex(level);
    }
    removeBody(name: string | undefined) {
        const scene = this.scene;
        let child: Transform | undefined;
        if (name === "Ball") {
            child = scene.children.find(child => child.visible && (child instanceof Mesh))
        } else {
            child = scene.children.find(child => child.visible && !(child instanceof Mesh))?.children[this.level.getIndex()].children.find(child => child.name === name);
        }
        if (!child) {
            throw new Error("child is undefined");
        }
        child.visible = false;
    }
    updateButton(name: string, visible?: boolean) {
        if (visible === undefined) {
            this.ui.getButton(name).getMesh().visible = !this.ui.getButton(name).getMesh().visible;
        } else {
            this.ui.getButton(name).getMesh().visible = visible;
        }
    }
    updateSwitch(name: string, value: boolean) {
        if (value) {
            this.ui.getSwitch(name).on();
        } else {
            this.ui.getSwitch(name).off();
        }
    }
    down(name: string) {
        this.ui.down(name)
    }
    release(name: string) {
        this.ui.release(name)
    }
    // Game loop
    loop = (timeStamp: number, now: number) => {
        this.t += timeStamp;
        this.scaleT += timeStamp;
        const scaleT = Math.min(1, this.scaleT);
        this.sceneEuler.set(this.sceneRotation.x, this.sceneRotation.y, this.sceneRotation.z);
        this.sceneQuat.fromEuler(this.sceneEuler);
        this.tempQuat.slerp(this.sceneQuat, Math.min(1, this.t));
        this.scene.quaternion.copy(this.tempQuat);
        this.scene.scale.lerp(this.sceneScale, scaleT);
        if (this.scale) {
            this.camera.position = (this.tempPosition.lerp(this.scene.children[0].position, scaleT).clone().applyMatrix4(this.scene.matrix));
            this.camera.position.z = 0.5;
        } else {
            this.camera.position = (this.tempPosition.lerp(new Vec3(), scaleT));
            this.camera.position.z = 0.5;

        }
        this.renderer.render({ scene: this.scene, camera: this.camera });
        this.ui.render();
        this.quat.fill(0)
        this.matrix.fromArray(this.camera.viewMatrix.multiply(this.scene.worldMatrix));
        this.matrix.getRotation(this.quat);
        this.onorientationchange && this.onorientationchange(this.quat)
    }
    updateBody(message: WorkerMessage & { type: "update" }) {
        const scene = this.scene;
        // this.ui.updateInfo(`fps: ${message.currFPS}, avg: ${message.allFPS}`);
        for (let index = 0; index < message.objects.length; index++) {
            let child: Transform | undefined;
            const name = message.objects[index][7];
            if (index === 0) {
                child = scene.children.find(child => child.visible && child instanceof Mesh)
            } else {
                child = scene.children.find(child => child.visible && !(child instanceof Mesh))?.children[this.level.getIndex()].children.find(child => child.name === name);
            }
            if (!child) {
                throw new Error("child is undefined");
            }
            const phyObject = message.objects[index];
            child.position.fromArray(phyObject.slice(0, 3) as number[])
            child.quaternion.fromArray(phyObject.slice(3, 7) as number[])
        }
    }
    addBody(message: WorkerMessage & { type: "addBody" }) {
        const gl = this.renderer.gl;
        const vertex = this.vertex;
        const fragment = this.fragment;
        const id = message.data;
        const scene = this.scene;
        if (scene.children.length === 0) {

            if (id === 0) {
                const program = new Program(this.renderer.gl, {
                    vertex,
                    fragment,
                    uniforms: {
                        uColor: {
                            value: new Vec3(0.7, 0.2, 0.7)
                        }
                    }
                });
                const geometry = new Sphere(gl, { radius: 1 });
                const mesh = new Mesh(gl, {
                    geometry,
                    program,
                });
                mesh.setParent(scene);
            }
        } else {
            const child = this.scene.children.find(child => child instanceof Mesh);
            if (!child) {
                throw new Error("child is undefined");
            }
            child.visible = true;
        }
    }
    reverse = false;
    requestLevel() {
        this.level.request(this.scene, this.reverse);
        this.reverse = false;
        this.ui.updateLevel(`关卡: ${this.level.getIndex()}`);
        this.rotation.fill(0)
        this.sceneRotation.fill(0);
        let showBtn = false;
        const root = this.scene.children.find(node => !(node instanceof Mesh));
        if (root) {
            const child = root.children.find(child => child.visible)
            showBtn = !!child?.children.find(c => c.extras && (c.extras as any).spawn);
        }


        if (showBtn) {
            this.updateButton("release", true);
        } else {
            this.updateButton("release", false);
        }
    }

}


