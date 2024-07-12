import { Box, Camera, Mesh, Program, Renderer, Transform, Vec3, Plane, Sphere, GLTF, GLTFLoader, AttributeData, Orbit } from "ogl";
import Device, { BodyId } from "./device/Device.js";
import { WorkerMessage } from "../worker/ammo.worker.js";
import UI from "./UI.js";

export default class Stage {
    private readonly renderer: Renderer;
    private readonly scene: Transform;
    private readonly camera: Camera;
    private readonly ui: UI;
    private readonly control: Orbit;
    private gltf?: GLTF;
    private fragment: string = "";
    private vertex: string = "";
    private started = false;
    onclick?: (tag?: string) => void;
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
        camera.position.z = 0.75;
        renderer.setSize(width, height);
        this.scene = new Transform();
        this.ui = new UI(renderer);
        this.control = new Orbit(camera);
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

        this.gltf = await GLTFLoader.load(this.renderer.gl, `resources/gltf/Demo.glb`);
        console.log(this.gltf)
    }
    onAddMesh?: (vertices: number[], indices: number[]) => void;
    start() {
        const scene = this.scene;
        scene.scale.multiply(0.01);
        const gltf = this.gltf;
        if (gltf) {
            gltf.meshes.forEach(mesh => {
                mesh.primitives.forEach(primitive => {
                    primitive.setParent(gltf.scene[0])
                    const attributeData = primitive.geometry.getPosition().data;
                    const indices = primitive.geometry.attributes.index.data as AttributeData;
                    attributeData && this.onAddMesh && this.onAddMesh([...attributeData], [...indices]);
                })
            });
            gltf.scene[0].setParent(scene);
        }
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

        this.control.update();
        this.renderer.render({ scene: this.scene, camera: this.camera });
        this.ui.render();
        this.click = "";
    }
    onUpdate(message: WorkerMessage & { type: "update" }) {
        const gl = this.renderer.gl;
        const vertex = this.vertex;
        const fragment = this.fragment;
        const scene = this.scene;
        this.ui.updateText(`fps: ${message.currFPS}, avg: ${message.allFPS}`);
        for (let index = 0; index < message.objects.length; index++) {
            const child = scene.children[index];
            if (child) {
                const phyObject = message.objects[index];
                child.position.fromArray(phyObject.slice(0, 3))
                child.quaternion.fromArray(phyObject.slice(3, 7))
            } else {
                const id = message.objects[index][7];
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
                if (id === BodyId.WallTop) {
                    const geometry = new Plane(gl, { width: this.halfWidth * 2, height: this.halfDepth * 2 });
                    const mesh = new Mesh(gl, {
                        geometry,
                        program,
                    });
                    // mesh.rotation.x = Math.PI / 2
                    mesh.setParent(scene);
                } else if (id === BodyId.WallBottom) {
                    const geometry = new Plane(gl, { width: this.halfWidth * 2, height: this.halfDepth * 2 });
                    const mesh = new Mesh(gl, {
                        geometry,
                        program,
                    });
                    // mesh.rotation.x = -Math.PI / 2
                    mesh.setParent(scene);
                } else if (id === BodyId.WallLeft) {
                    const geometry = new Plane(gl, { width: this.halfDepth * 2, height: this.halfHeight * 2 });
                    const mesh = new Mesh(gl, {
                        geometry,
                        program,
                    });
                    // mesh.rotation.y = -Math.PI / 2
                    mesh.setParent(scene);
                } else if (id === BodyId.WallRight) {
                    const geometry = new Plane(gl, { width: this.halfDepth * 2, height: this.halfHeight * 2 });
                    const mesh = new Mesh(gl, {
                        geometry,
                        program,
                    });
                    // mesh.rotation.y = Math.PI / 2
                    mesh.setParent(scene);
                } else if (id === BodyId.WallBack) {
                    const geometry = new Plane(gl, { width: this.halfWidth * 2, height: this.halfHeight * 2 });
                    const mesh = new Mesh(gl, {
                        geometry,
                        program,
                    });
                    mesh.setParent(scene);
                } else if (id === BodyId.WallFront) {
                    const geometry = new Plane(gl, { width: this.halfWidth * 2, height: this.halfHeight * 2 });
                    const mesh = new Mesh(gl, {
                        geometry,
                        program,
                    });
                    // mesh.rotation.x = Math.PI
                    mesh.setParent(scene);
                } else if (id === BodyId.Ball) {
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
                }
            }
            //  else if (index === 10) {
            //     const program = new Program(this.renderer.gl, {
            //         vertex,
            //         fragment,
            //         uniforms: {
            //             uColor: {
            //                 value: new Vec3(0., 0., 1.0)
            //             }
            //         }
            //     });
            //     const geometry = new Box(gl, {
            //         width: 2,
            //         height: 2,
            //         depth: 2
            //     });
            //     const mesh = new Mesh(gl, {
            //         geometry,
            //         program,
            //     });
            //     mesh.setParent(scene);
            // } else if (index === 11) {
            //     const program = new Program(this.renderer.gl, {
            //         vertex,
            //         fragment,
            //         uniforms: {
            //             uColor: {
            //                 value: new Vec3(0.7, 0.8, 1.0)
            //             }
            //         }
            //     });
            //     const geometry = new Box(gl, {
            //         width: 10,
            //         height: 2,
            //         depth: 2
            //     });
            //     const mesh = new Mesh(gl, {
            //         geometry,
            //         program,
            //     });
            //     mesh.setParent(scene);
            // }

        }
    }

}