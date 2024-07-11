import { Box, Camera, Mesh, Program, Renderer, Transform, Vec3, Plane, Sphere } from "ogl";
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
        camera.position.z = 0.75;
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
        for (let index = 0; index < 6; index++) {
            const gl = this.renderer.gl
            const vertex = this.vertex;
            const fragment = this.fragment;
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
            if (index === 0) {
                const geometry = new Plane(gl, {width: 20, height: 2});
                const mesh = new Mesh(gl, {
                    geometry,
                    program,
                });
                mesh.rotation.x = Math.PI / 2
                mesh.position.y = 20;
                mesh.setParent(scene);
            } else if (index === 1) {
                const geometry = new Plane(gl, {width: 20, height: 2});
                const mesh = new Mesh(gl, {
                    geometry,
                    program,
                });
                mesh.rotation.x = -Math.PI / 2
                mesh.position.y = -20;
                mesh.setParent(scene);
            } else if (index === 2) {
                const geometry = new Plane(gl, {width: 2, height: 40});
                const mesh = new Mesh(gl, {
                    geometry,
                    program,
                });
                mesh.rotation.y = -Math.PI / 2
                mesh.position.x = 10;
                mesh.setParent(scene);
            } else if (index === 3) {
                const geometry = new Plane(gl, {width: 2, height: 40});
                const mesh = new Mesh(gl, {
                    geometry,
                    program,
                });
                mesh.rotation.y = Math.PI / 2
                mesh.position.x = -10;
                mesh.setParent(scene);
            } else if (index === 4) {
                const geometry = new Plane(gl, {width: 20, height: 40});
                const mesh = new Mesh(gl, {
                    geometry,
                    program,
                });
                mesh.position.z = -1;
                mesh.setParent(scene);
            } else if (index === 5) {
                const geometry = new Plane(gl, {width: 20, height: 40});
                const mesh = new Mesh(gl, {
                    geometry,
                    program,
                });
                mesh.rotation.x = Math.PI
                mesh.position.z = 1;
                mesh.setParent(scene);
            }
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
            if (scene.children[index + 6]) {
                const phyObject = message.objects[index];
                const object = scene.children[index + 6];
                object.position.fromArray(phyObject.slice(0, 3))
                object.quaternion.fromArray(phyObject.slice(3, 7))
            } else {
                const program = new Program(this.renderer.gl, {
                    vertex,
                    fragment,
                    uniforms: {
                        uColor: {
                            value: new Vec3(0.2, 0.8, 1.0)
                        }
                    }
                });
                const geometry = new Sphere(gl, {radius: 1});
                const mesh = new Mesh(gl, {
                    geometry,
                    program,
                });
                mesh.setParent(scene);
            }

        }
    }

}