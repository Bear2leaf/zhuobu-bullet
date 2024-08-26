import { Camera, Geometry, Mesh, OGLRenderingContext, Plane, Program, RenderTarget, Sphere, Texture, Transform, Vec2, Vec3 } from "ogl";
import { System } from "./System.js";
import { Tiled } from "../misc/TiledParser.js";
import LevelSystem from "./LevelSystem.js";
import { WorkerMessage } from "../../worker/ammo.worker.js";
import { radius } from "../misc/radius.js";

export class RenderSystem implements System {
    readonly uiRoot = new Transform;
    readonly levelRoot = new Transform;
    private fragment: string = "";
    private ballVertex: string = "";
    private ballFragment: string = "";
    private vertex: string = "";
    private spriteFragment: string = "";
    private spriteVertex: string = "";
    private readonly textures: Texture[] = [];
    private readonly renderTargets: RenderTarget[] = [];
    private readonly internalIconName = "finalbossblues-icons_full_16";
    constructor(private readonly gl: OGLRenderingContext
        , private readonly levelSystem: LevelSystem
    ) {
    }
    tiledData?: Tiled;
    async load(): Promise<void> {
        if (!this.tiledData) {
            throw new Error("tiledData is undefined");
        }
        this.ballVertex = await (await fetch("resources/glsl/simple.vert.sk")).text();
        this.ballFragment = await (await fetch("resources/glsl/simple.frag.sk")).text();
        this.vertex = await (await fetch("resources/glsl/level.vert.sk")).text();
        this.fragment = await (await fetch("resources/glsl/level.frag.sk")).text();
        this.spriteVertex = this.spriteVertex = await (await fetch("resources/glsl/sprite.vert.sk")).text();
        this.spriteFragment = this.spriteFragment = await (await fetch("resources/glsl/sprite.frag.sk")).text();
        const gl = this.gl;
        for await (const tileset of this.tiledData.tilesets) {
            if (tileset.image) {
                await new Promise((resoive) => {
                    const image = new Image();
                    image.onload = () => {
                        this.textures.push(new Texture(gl, {
                            image,
                            width: image.width,
                            height: image.height,
                            magFilter: gl.NEAREST,
                            minFilter: gl.NEAREST
                        }));
                        resoive(void (0));
                    };
                    image.src = `resources/tiled/${tileset.image}`;
                })
            }
        }
    }
    init(): void {

        const program = new Program(this.gl, {
            vertex: this.ballVertex,
            fragment: this.ballFragment,
            uniforms: {
                uColor: {
                    value: new Vec3(0.7, 0.2, 0.7)
                }
            }
        });
        const geometry = new Sphere(this.gl, { radius });
        const mesh = new Mesh(this.gl, {
            geometry,
            program,
        });
        mesh.setParent(this.levelRoot);
        mesh.name = "Ball"
        const tilesets = this.tiledData?.tilesets || [];
        for (const level of this.levelSystem.collections) {
            const renderTarget = new RenderTarget(this.gl, {
                minFilter: this.gl.NEAREST,
                magFilter: this.gl.NEAREST,
                depth: false
            });
            this.renderTargets.push(renderTarget);
            level.init()
            level.initRenderTarget(tilesets, renderTarget)
            level.initGraphicsBuffer(this.gl, this.vertex, this.fragment, this.spriteVertex, this.spriteFragment, renderTarget, this.textures, this.internalIconName, tilesets)
            level.initGraphics(renderTarget, tilesets, this.gl, this.spriteVertex, this.spriteFragment, this.vertex, this.fragment);
            level.node.setParent(this.levelRoot);
        }
    }
    update(): void {
        throw new Error("Method not implemented.");
    }

    hideMesh(name: string, levelSystem: LevelSystem) {
        const scene = this.levelRoot;
        let child: Transform | undefined;
        if (name === "Ball") {
            child = scene.children.find(child => child.visible && (child instanceof Mesh))
        } else {
            child = scene.children[levelSystem.current + 1].children.find(child => child.visible && child.name === name)
        }
        child && (child.visible = false);
    }
    showMesh(name: string, levelSystem: LevelSystem) {
        const scene = this.levelRoot;
        let child: Transform | undefined;
        if (name === "Ball") {
            child = scene.children.find(child => child.visible && (child instanceof Mesh))
        } else {
            child = scene.children[levelSystem.current + 1].children.find(child => child.visible && child.name === name)
        }
        child && (child.visible = true);
    }

    updateMesh(message: WorkerMessage & { type: "update" }, levelSystem: LevelSystem) {
        const scene = this.levelRoot;
        for (let index = 0; index < message.objects.length; index++) {
            let child: Transform | undefined;
            const name = message.objects[index][7];
            child = scene.children.find(child => child.name === name);
            if (child === undefined) {
                child = scene.children[levelSystem.current + 1].children.find(child => child.name === name);
            }
            if (child) {
                const phyObject = message.objects[index];
                child.position.fromArray(phyObject.slice(0, 3) as number[])
                child.quaternion.fromArray(phyObject.slice(3, 7) as number[])
            }
        }
    }
}