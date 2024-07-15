import { Box, Camera, Mesh, Program, Renderer, Transform, Vec3, Plane, Sphere, GLTF, GLTFLoader, AttributeData, Orbit, GLTFProgram, Skin, Texture, Mat4, Quat, Euler } from "ogl";
import Device, { BodyId } from "../device/Device.js";
import { WorkerMessage } from "../../worker/ammo.worker.js";
import UI from "./UI.js";
import Level from "./Level.js";

export default class Stage {
    private readonly renderer: Renderer;
    private readonly scene: Transform;
    private readonly camera: Camera;
    private readonly ui: UI;
    private readonly level: Level;
    private readonly control: Orbit;
    private readonly quat = new Quat()
    private readonly matrix = new Mat4();
    private fragment: string = "";
    private vertex: string = "";
    private started = false;
    onclick?: (tag?: string) => void;
    onorientationchange?: (quat: Quat) => void;
    private halfWidth: number = 0;
    private halfHeight: number = 0;
    private halfDepth: number = 0;

    constructor(device: Device) {
        const [width, height, dpr] = device.getWindowInfo();
        const renderer = this.renderer = new Renderer({ dpr, canvas: device.getCanvasGL() });
        const gl = renderer.gl;
        gl.clearColor(0.3, 0.3, 0.3, 1);
        const camera = this.camera = new Camera(gl, {
            aspect: width / height,
            fov: 45
        })
        camera.position.z = 0.5;
        renderer.setSize(width, height);
        this.level = new Level(renderer.gl);
        this.level.onaddmesh = (total: number, vertices: number[], indices: number[], propertities?: Record<string, boolean>) => {
            this.onaddmesh && this.onaddmesh(total, vertices, indices, propertities);
        }
        this.scene = new Transform();
        this.ui = new UI(renderer);
        this.control = new Orbit(camera, {
            enableZoom: false,
            enablePan: false
        });
    }
    setBorder(halfWidth: number, halfHeight: number, halfDepth: number) {
        this.halfWidth = halfWidth;
        this.halfHeight = halfHeight;
        this.halfDepth = halfDepth
    }
    async load() {

        this.vertex = await (await fetch("resources/glsl/simple.vert.sk")).text();
        this.fragment = await (await fetch("resources/glsl/simple.frag.sk")).text();
        await this.ui.load();
        await this.level.load();
    }
    onaddmesh?: (total: number, vertices: number[], indices: number[], propertities?: Record<string, boolean>) => void;
    start() {
        const scene = this.scene;
        scene.scale.multiply(0.01);
        {
            this.ui.init();
            this.ui.onclick = (tag) => {
                this.onclick && this.onclick(tag);
            }
            this.ui.updateText("hello")
        }
        this.started = true;
    }
    stop() {
        // Stop next frame
        this.started = false;
    }

    removeBody(index: number) {
        const child = this.scene.children[index];
        child.setParent(null);
    }

    // Game loop
    loop = (timeStamp: number) => {
        if (!this.started) {
            return;
        }

        this.control.update();
        this.renderer.render({ scene: this.scene, camera: this.camera });
        this.ui.render();
        this.quat.fill(0)
        this.matrix.fromArray(this.camera.viewMatrix.multiply(this.scene.worldMatrix));
        this.matrix.getRotation(this.quat);
        this.onorientationchange && this.onorientationchange(this.quat)
    }
    updateBody(message: WorkerMessage & { type: "update" }) {
        const scene = this.scene;
        this.ui.updateText(`fps: ${message.currFPS}, avg: ${message.allFPS}`);
        for (let index = 0; index < message.objects.length; index++) {
            const child = scene.children[index];
            const phyObject = message.objects[index];
            child.position.fromArray(phyObject.slice(0, 3))
            child.quaternion.fromArray(phyObject.slice(3, 7))
        }
    }
    addBody(message: WorkerMessage & { type: "addBody" }) {
        const gl = this.renderer.gl;
        const vertex = this.vertex;
        const fragment = this.fragment;
        const id = message.data;
        const scene = this.scene;
        if (id === BodyId.Ball) {
            const program = new Program(this.renderer.gl, {
                vertex,
                fragment,
                uniforms: {
                    uColor: {
                        value: new Vec3(0.2, 0.8, 1.0)
                    }
                }
            });
            const geometry = new Sphere(gl, { radius: 1 });
            const mesh = new Mesh(gl, {
                geometry,
                program,
            });
            mesh.setParent(scene);
        } else {
            const program = new Program(this.renderer.gl, {
                vertex,
                fragment,
                // Don't cull faces so that plane is double sided - default is gl.BACK
                uniforms: {
                    uColor: {
                        value: new Vec3(1, 1, 1)
                    }
                }
            });
            const width = ((BodyId.WallRight === id || BodyId.WallLeft === id) ? this.halfDepth : this.halfWidth) * 2;
            const height = ((BodyId.WallTop === id || BodyId.WallBottom === id) ? this.halfDepth : this.halfHeight) * 2;
            const geometry = new Plane(gl, { width, height, });
            const mesh = new Mesh(gl, {
                geometry,
                program,
            });
            mesh.setParent(scene);
        }
    }
    requestLevel() {
        this.level.request(this.scene);
    }

}


