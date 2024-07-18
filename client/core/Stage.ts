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

    private rx = 0;
    private ry = 0;
    private rz = 0;
    private readonly table: Record<string, (tag: "right" | "left" | "up" | "down") => void> = {
        "000": (tag) => {

            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "010": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "012": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-10": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                case "down":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-1-1": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                case "down":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "00-1": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-10-1": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "01-1": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "02-1": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-12-1": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-22-1": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "03-1": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                case "down":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "03-2": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                case "down":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "03-3": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                case "down":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "031": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                case "down":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "032": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                case "down":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "033": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                case "down":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "10-1": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "01-2": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "01-3": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-11": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                case "down":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-12": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                case "down":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "002": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                case "down":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "001": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-101": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "101": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-100": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-200": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-2-10": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-21-1": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-210": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-22": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-2-1": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-13": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                case "down":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-1-20": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-1-30": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-110": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx = 0;
                    this.ry = 1;
                    this.rz = 1;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-111": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "00-3": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-220": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "120": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "12-2": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "320": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "011": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "020": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-300": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-3-10": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-3-20": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-3-21": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "1-21": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-121": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-230": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-1-3": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "02-3": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "13-3": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "13-1": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-310": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-3-1": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-3-2": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-3-3": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-31": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-32": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-33": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "130": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "131": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-30": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "20-1": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "00-2": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "11-1": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "110": (tag) => {
            switch (tag) {
                case "right":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "left":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                case "up":
                    this.rx = 0;
                    this.ry = 0;
                    this.rz = -1;
                    break;
                case "down":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "1-10": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "1-30": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-1-10": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-1-11": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "02-2": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "030": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                case "down":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "220": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "230": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "100": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "200": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "300": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "013": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rz--;
                    this.rz = this.rz < -3 ? 0 : this.rz;
                    break;
                case "down":
                    this.rz++;
                    this.rz = this.rz % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-120": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-130": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-20": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "1-20": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "2-20": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "3-10": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "3-20": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "3-30": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "0-21": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "121": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "12-1": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                case "down":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },
        "-10-2": (tag) => {
            switch (tag) {
                case "right":
                    this.ry++;
                    this.ry = this.ry % 4;
                    break;
                case "left":
                    this.ry--;
                    this.ry = this.ry < -3 ? 0 : this.ry;
                    break;
                case "up":
                    this.rx--;
                    this.rx = this.rx < -3 ? 0 : this.rx;
                    break;
                case "down":
                    this.rx++;
                    this.rx = this.rx % 4;
                    break;
                default:
                    throw new Error("unsupported")
            }
        },

    };
    rollCamera(tag: "right" | "left" | "up" | "down") {
        const key = `${this.rx}${this.ry}${this.rz}`;
        console.log(key)
        this.table[key](tag);
        this.sceneRotation.set(this.rx * Math.PI / 2, this.ry * Math.PI / 2, this.rz * Math.PI / 2);
        this.t = 0;
    }
    start() {
        const scene = this.scene;
        scene.scale.multiply(0.01);
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
    private readonly tempRotation = new Vec3();
    private t = 0;
    // Game loop
    loop = (timeStamp: number) => {
        this.t += timeStamp;
        this.tempRotation.lerp(this.sceneRotation, Math.min(1, this.t));
        this.scene.rotation.x = this.tempRotation.x;
        this.scene.rotation.y = this.tempRotation.y;
        this.scene.rotation.z = this.tempRotation.z;
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


