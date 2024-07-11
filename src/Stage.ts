import { Box, Camera, Mesh, Program, Renderer, Transform, Vec3 as OVec3 } from "ogl";
import Device from "./device/Device.js";
import UI from "./UI.js";

export default class Stage {
    private readonly renderer: Renderer;
    private readonly scene: Transform;
    private readonly camera: Camera;
    private readonly ui: UI
    private fragment: string = "";
    private vertex: string = "";
    private started = false;
    onclick?: (tag?: string) => void;

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
        this.scene = new Transform();
        this.ui = new UI(renderer);
    }
    async load() {

        this.vertex = await (await fetch("resources/glsl/simple.vert.sk")).text();
        this.fragment = await (await fetch("resources/glsl/simple.frag.sk")).text();
        await this.ui.load();
    }
    start() {
        const scene = this.scene;
        scene.scale.multiply(0.01)
        {
            this.ui.init();
            this.ui.onclick = (tag) => {
                this.onclick && this.onclick(tag);
                this.click = "player";
            }
            this.ui.updateText("hello")
        }
        this.started = true;
    }
    private click?: string;
    stop() {
        // Stop next frame
        this.started = false;
    }

    // Game loop
    loop = (timeStamp: number) => {
        if (!this.started) {
            return;
        }


        this.renderer.render({ scene: this.scene, camera: this.camera });
        this.ui.render();
        this.click = "";
    }
    onMessage(message: any) {
        const gl = this.renderer.gl;
        const vertex = this.vertex;
        const fragment = this.fragment;
        const scene = this.scene;
        this.ui.updateText(`fps: ${message.currFPS}, avg: ${message.allFPS}`);
        for (let index = 0; index < message.objects.length; index++) {
            if (scene.children[index]) {
                const phyObject = message.objects[index];
                const object = scene.children[index];
                object.position.fromArray(phyObject.slice(0, 3))
                object.quaternion.fromArray(phyObject.slice(3, 7))
            } else {
                const program = new Program(this.renderer.gl, {
                    vertex,
                    fragment,
                    // Don't cull faces so that plane is double sided - default is gl.BACK
                    cullFace: false,
                    uniforms: {
                        uColor: {
                            value: new OVec3(0.2, 0.8, 1.0)
                        }
                    }
                });
                const geometry = new Box(gl, { width: 2, height: 2, depth: 2 });
                const mesh = new Mesh(gl, {
                    geometry,
                    program,
                });
                mesh.setParent(scene);
            }

        }
    }

}