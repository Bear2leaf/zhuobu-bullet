import { Box, Camera, Mesh, Program, Renderer, Transform, Vec3, Plane, Sphere, GLTF, GLTFLoader, AttributeData, Orbit, GLTFProgram, Skin, Texture, Mat4, Quat, Euler, AxesHelper, Vec2, Triangle } from "ogl";
import Device from "../device/Device.js";
import { WorkerMessage } from "../../worker/ammo.worker.js";
import UI from "./UI.js";
import Level from "./Level.js";

export default class Stage {
    private readonly renderer: Renderer;
    private readonly scene: Transform;
    private readonly camera: Camera;
    private readonly ui: UI;
    private readonly level: Level;
    private readonly quat = new Quat()
    private readonly matrix = new Mat4();
    private fragment: string = "";
    private vertex: string = "";
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
        this.level.onaddmesh = (total: number, vertices: number[], indices: number[], propertities?: Record<string, boolean>) => {
            this.onaddmesh && this.onaddmesh(total, vertices, indices, propertities);
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
    onaddmesh?: (total: number, vertices: number[], indices: number[], propertities?: Record<string, boolean>) => void;

    private rx = 2;
    private ry = 3;
    private rz = 1;
    private readonly table: Record<string, (tag: "right" | "left" | "up" | "down") => void> = {
        "000": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;
                case "down":
                    this.rx = (this.rx + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "001": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;
                case "down":
                    this.rx = (this.rx + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "002": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;
                case "down":
                    this.rx = (this.rx + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "003": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;
                case "down":
                    this.rx = (this.rx + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "010": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rz = this.rz === 0 ? 3 : (this.rz - 1);
                    break;
                case "down":
                    this.rz = (this.rz + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "011": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;

                case "up":
                    this.rz = this.rz === 0 ? 3 : (this.rz - 1);
                    break;
                case "down":
                    this.rz = (this.rz + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "012": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;

                case "up":
                    this.rz = this.rz === 0 ? 3 : (this.rz - 1);
                    break;
                case "down":
                    this.rz = (this.rz + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "013": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;

                case "up":
                    this.rz = this.rz === 0 ? 3 : (this.rz - 1);
                    break;
                case "down":
                    this.rz = (this.rz + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "020": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = (this.rx + 1) % 4;
                    break;
                case "down":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;

                default:
                    break;
            }
        },
        "021": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = (this.rx + 1) % 4;
                    break;
                case "down":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;

                default:
                    break;
            }
        },
        "022": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = (this.rx + 1) % 4;
                    break;
                case "down":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;

                default:
                    break;
            }
        },
        "023": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = (this.rx + 1) % 4;
                    break;
                case "down":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;

                default:
                    break;
            }
        },
        "030": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rz = (this.rz + 1) % 4;
                    break;
                case "down":
                    this.rz = this.rz === 0 ? 3 : (this.rz - 1);
                    break;

                default:
                    break;
            }
        },
        "031": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;

                case "up":
                    this.rz = (this.rz + 1) % 4;
                    break;
                case "down":
                    this.rz = this.rz === 0 ? 3 : (this.rz - 1);
                    break;

                default:
                    break;
            }
        },
        "032": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;

                case "up":
                    this.rz = (this.rz + 1) % 4;
                    break;
                case "down":
                    this.rz = this.rz === 0 ? 3 : (this.rz - 1);
                    break;

                default:
                    break;
            }
        },
        "033": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rz = (this.rz + 1) % 4;
                    break;
                case "down":
                    this.rz = this.rz === 0 ? 3 : (this.rz - 1);
                    break;
                default:
                    break;
            }
        },
        "100": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;
                case "down":
                    this.rx = (this.rx + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "101": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;
                case "down":
                    this.rx = (this.rx + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "102": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;
                case "down":
                    this.rx = (this.rx + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "103": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;
                case "down":
                    this.rx = (this.rx + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "110": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = 3;
                    break;
                case "down":
                    this.rx = 0;
                    this.ry = 2;
                    this.rz = 1;
                    break;

                default:
                    break;
            }
        },
        "111": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = 0;
                    break;
                case "down":
                    this.rx = 2;
                    this.ry = 0;
                    this.rz = 0;
                    break;

                default:
                    break;
            }
        },
        "112": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = 1;
                    break;
                case "down":
                    this.rx = 0;
                    this.ry = 2;
                    this.rz = 3;
                    break;

                default:
                    break;
            }
        },
        "113": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = 2;
                    break;
                case "down":
                    this.rx = 0;
                    this.ry = 2;
                    this.rz = 0;
                    break;

                default:
                    break;
            }
        },
        "120": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = (this.rx + 1) % 4;
                    break;
                case "down":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;

                default:
                    break;
            }
        },
        "121": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = (this.rx + 1) % 4;
                    break;
                case "down":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;

                default:
                    break;
            }
        },
        "122": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = (this.rx + 1) % 4;
                    break;
                case "down":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;

                default:
                    break;
            }
        },
        "123": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = (this.rx + 1) % 4;
                    break;
                case "down":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;

                default:
                    break;
            }
        },
        "130": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = 1;
                    break;
                case "down":
                    this.rx = 0;
                    this.ry = 2;
                    this.rz = 3;
                    break;

                default:
                    break;
            }
        },
        "131": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = 2;
                    break;
                case "down":
                    this.rx = 0;
                    this.ry = 2;
                    this.rz = 0;
                    break;

                default:
                    break;
            }
        },
        "132": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = 3;
                    break;
                case "down":
                    this.rx = 0;
                    this.ry = 2;
                    this.rz = 1;
                    break;

                default:
                    break;
            }
        },
        "133": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = 0;
                    break;
                case "down":
                    this.rx = 2;
                    this.ry = 0;
                    this.rz = 0;
                    break;
                default:
                    break;
            }
        },
        "200": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;
                case "down":
                    this.rx = (this.rx + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "201": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;
                case "down":
                    this.rx = (this.rx + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "202": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;
                case "down":
                    this.rx = (this.rx + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "203": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;
                case "down":
                    this.rx = (this.rx + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "210": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rz = (this.rz + 1) % 4;
                    break;
                case "down":
                    this.rz = this.rz === 0 ? 3 : (this.rz - 1);
                    break;

                default:
                    break;
            }
        },
        "211": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rz = (this.rz + 1) % 4;
                    break;
                case "down":
                    this.rz = this.rz === 0 ? 3 : (this.rz - 1);
                    break;

                default:
                    break;
            }
        },
        "212": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rz = (this.rz + 1) % 4;
                    break;
                case "down":
                    this.rz = this.rz === 0 ? 3 : (this.rz - 1);
                    break;

                default:
                    break;
            }
        },
        "213": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rz = (this.rz + 1) % 4;
                    break;
                case "down":
                    this.rz = this.rz === 0 ? 3 : (this.rz - 1);
                    break;

                default:
                    break;
            }
        },
        "220": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = (this.rx + 1) % 4;
                    break;
                case "down":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;

                default:
                    break;
            }
        },
        "221": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = (this.rx + 1) % 4;
                    break;
                case "down":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;

                default:
                    break;
            }
        },
        "222": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = (this.rx + 1) % 4;
                    break;
                case "down":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;

                default:
                    break;
            }
        },
        "223": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = (this.rx + 1) % 4;
                    break;
                case "down":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;

                default:
                    break;
            }
        },
        "230": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rz = this.rz === 0 ? 3 : (this.rz - 1);
                    break;
                case "down":
                    this.rz = (this.rz + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "231": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rz = this.rz === 0 ? 3 : (this.rz - 1);
                    break;
                case "down":
                    this.rz = (this.rz + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "232": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rz = this.rz === 0 ? 3 : (this.rz - 1);
                    break;
                case "down":
                    this.rz = (this.rz + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "233": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rz = this.rz === 0 ? 3 : (this.rz - 1);
                    break;
                case "down":
                    this.rz = (this.rz + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "300": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;
                case "down":
                    this.rx = (this.rx + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "301": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;
                case "down":
                    this.rx = (this.rx + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "302": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;
                case "down":
                    this.rx = (this.rx + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "303": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;
                case "down":
                    this.rx = (this.rx + 1) % 4;
                    break;

                default:
                    break;
            }
        },
        "310": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = 0;
                    this.ry = 2;
                    this.rz = 3;
                    break;
                case "down":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = 1;
                    break;

                default:
                    break;
            }
        },
        "311": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = 2;
                    this.ry = 0;
                    this.rz = 2;
                    break;
                case "down":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = 2;
                    break;

                default:
                    break;
            }
        },
        "312": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = 0;
                    this.ry = 2;
                    this.rz = 1;
                    break;
                case "down":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = 3;
                    break;

                default:
                    break;
            }
        },
        "313": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = 0;
                    this.ry = 2;
                    this.rz = 2;
                    break;
                case "down":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = 0;
                    break;

                default:
                    break;
            }
        },
        "320": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = (this.rx + 1) % 4;
                    break;
                case "down":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;

                default:
                    break;
            }
        },
        "321": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = (this.rx + 1) % 4;
                    break;
                case "down":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;

                default:
                    break;
            }
        },
        "322": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = (this.rx + 1) % 4;
                    break;
                case "down":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;

                default:
                    break;
            }
        },
        "323": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = (this.rx + 1) % 4;
                    break;
                case "down":
                    this.rx = this.rx === 0 ? 3 : (this.rx - 1);
                    break;

                default:
                    break;
            }
        },
        "330": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = 0;
                    this.ry = 2;
                    this.rz = 1;
                    break;
                case "down":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = 3;
                    break;

                default:
                    break;
            }
        },
        "331": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = 2;
                    this.ry = 0;
                    this.rz = 0;
                    break;
                case "down":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = 0;
                    break;

                default:
                    break;
            }
        },
        "332": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = 0;
                    this.ry = 2;
                    this.rz = 3;
                    break;
                case "down":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = 1;
                    break;

                default:
                    break;
            }
        },
        "333": (tag: "right" | "left" | "up" | "down") => {
            switch (tag) {
                case "right":
                    this.ry = (this.ry + 1) % 4;
                    break;
                case "left":
                    this.ry = this.ry === 0 ? 3 : (this.ry - 1);
                    break;
                case "up":
                    this.rx = 0;
                    this.ry = 2;
                    this.rz = 0;
                    break;
                case "down":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = 2;
                    break;

                default:
                    break;
            }
        },
    }

    rollCamera(tag: "right" | "left" | "up" | "down") {
        const key = `${this.rx}${this.ry}${this.rz}`;
        this.table[key](tag);
        console.log(key, tag, this.rx, this.ry, this.rz)
        this.sceneRotation.set(this.rx * Math.PI / 2, this.ry * Math.PI / 2, this.rz * Math.PI / 2);
        this.t = 0;
    }
    start() {
        const scene = this.scene;
        scene.scale.multiply(0.01);
        this.sceneRotation.set(this.rx * Math.PI / 2, this.ry * Math.PI / 2, this.rz * Math.PI / 2);
        {
            this.ui.init();
            this.ui.onclick = (tag) => {
                this.onclick && this.onclick(tag);
            }
            this.level.onclick = (tag) => {
                this.onclick && this.onclick(tag)
            }
        }
    }

    setInitLevel(level: number) {
        this.level.setIndex(level);
    }
    removeBody(index: number) {
        const child = this.scene.children[index];
        child.setParent(null);
    }
    hideReleaseBtn() {
        this.ui.getMesh("release").visible = false;
    }
    showReleaseBtn() {
        this.ui.getMesh("release").visible = true;
    }
    private readonly sceneRotation = new Vec3();
    private readonly sceneEuler = new Euler();
    private readonly sceneQuat = new Quat();
    private readonly tempQuat = new Quat();
    private t = 0;
    // Game loop
    loop = (timeStamp: number) => {
        this.t += timeStamp;
        this.sceneEuler.set(this.sceneRotation.x, this.sceneRotation.y, this.sceneRotation.z);
        this.sceneQuat.fromEuler(this.sceneEuler);
        this.tempQuat.slerp(this.sceneQuat, Math.min(1, this.t));
        this.scene.quaternion.copy(this.tempQuat);
        this.renderer.render({ scene: this.scene, camera: this.camera });
        this.ui.render();
        this.quat.fill(0)
        this.matrix.fromArray(this.camera.viewMatrix.multiply(this.scene.worldMatrix));
        this.matrix.getRotation(this.quat);
        this.onorientationchange && this.onorientationchange(this.quat)
    }
    updateBody(message: WorkerMessage & { type: "update" }) {
        const scene = this.scene;
        this.ui.updateText(`fps: ${message.currFPS}, avg: ${message.allFPS}\nlevel: ${this.level.getIndex()}`);
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
    }
    requestLevel() {
        this.level.request(this.scene);
    }

}


