import { Camera, Mesh, Raycast, Transform, Vec2 } from "ogl";
import { System } from "./System.js";
import UIElement from "../ui/UIElement.js";
import UISystem from "./UISystem.js";

export class InputSystem implements System {
    private readonly mouse = new Vec2();
    private width: number = 0;
    private height: number = 0;
    private _camera?: Camera;
    private get camera(): Camera {
        if (!this._camera) {
            throw new Error("camera not initialized");
        }
        return this._camera;
    }
    private readonly all: UIElement[] = [];
    onupdateIndicator?: (delta: number) => void;
    onclick?: (tag?: string) => void;
    onswipe?: (direction: "left" | "right" | "up" | "down") => void;
    ondown?: () => void;
    onup?: () => void;
    async load(): Promise<void> {
    }
    initInput(windowInfo: WechatMinigame.WindowInfo, camera: Camera, all: UIElement[]): void {
        this.width = windowInfo.windowWidth;
        this.height = windowInfo.windowHeight;
        this._camera = camera;
        this.all.splice(0, this.all.length, ...all);
        this.initTouchEvents();
    }
    init(): void {
    }
    start(): void {
        const mouse = this.mouse;
        const width = this.width;
        const height = this.height;
        const camera = this.camera;
        const all = this.all;
        // Create a raycast object
        const raycast = new Raycast();
        let indicatorDelta = 0;
        let mouseDown = false;
        let lastX = 0;
        const move = (e: { x: number, y: number }) => {
            if (mouseDown) {
                indicatorDelta = (lastX - e.x) * 0.1;
                this.onupdateIndicator && this.onupdateIndicator(indicatorDelta);
                lastX = e.x;
            }
            mouse.set(2.0 * (e.x / width) - 1.0, 2.0 * (1.0 - e.y / height) - 1.0);

            // Update the ray's origin and direction using the camera and mouse
            raycast.castMouse(camera, mouse);


            // raycast.intersectBounds will test against the bounds of each mesh, and
            // return an array of intersected meshes in order of closest to farthest
            const hits = raycast.intersectBounds(all.map(node => node.getMesh() as Mesh));

            // Update our feedback using this array
            all.forEach(item => {
                item.release();
                hits.forEach(hit => {
                    if (item.getMesh().name === hit.name || item.getMesh().name === hit.parent?.name) {
                        item.down();
                    }
                })
            })
        }
        const start = (e: { x: number, y: number }) => {
            indicatorDelta = 0;
            lastX = e.x;
            const help = all.find(node => node.getMesh().name === "help");
            if (help) {
                help.getMesh().visible = false;
            }
            mouse.set(2.0 * (e.x / width) - 1.0, 2.0 * (1.0 - e.y / height) - 1.0);
            if (mouse.y < -0.7) {
                mouseDown = true;
                return;
            }
            this.ondown && this.ondown();

            // Update the ray's origin and direction using the camera and mouse
            raycast.castMouse(camera, mouse);

            // raycast.intersectBounds will test against the bounds of each mesh, and
            // return an array of intersected meshes in order of closest to farthest
            const hits = raycast.intersectBounds(all.map(node => node.getMesh() as Mesh));

            // Update our feedback using this array
            all.forEach(item => {
                item.release();
                hits.forEach(hit => {
                    if (item.getMesh().name === hit.name || item.getMesh().name === hit.parent?.name) {
                        item.down();
                    }
                })
            })
        }
        const end = () => {
            this.onup && this.onup();
            mouseDown = false;
            indicatorDelta = 0;
            lastX = 0;
            // Update the ray's origin and direction using the camera and mouse
            raycast.castMouse(camera, mouse);

            // raycast.intersectBounds will test against the bounds of each mesh, and
            // return an array of intersected meshes in order of closest to farthest
            const hits = raycast.intersectBounds(all.map(node => node.getMesh() as Mesh));

            // Update our feedback using this array
            all.forEach(item => {
                hits.forEach(hit => {
                    if (item.getMesh().name === hit.name || item.getMesh().name === hit.parent?.name) {
                        if (item.isDown()) {
                            this.onclick && this.onclick(item.getMesh().name);
                        }
                    }
                })
                item.release();
            })
        }


        document.addEventListener("pointerdown", (e) => start({ x: e.pageX, y: e.pageY }))
        document.addEventListener("pointermove", (e) => move({ x: e.pageX, y: e.pageY }))
        document.addEventListener("pointerup", () => end())
        document.addEventListener("pointercancel", () => end())
    }
    initTouchEvents() {
        const ui = this;
        let xDown: number | null = null;
        let yDown: number | null = null;


        const handleTouchStart = (x: number, y: number) => {
            xDown = x;
            yDown = y;
        };

        const handleTouchMove = (x: number, y: number) => {
            if (!xDown || !yDown) {
                return;
            }

            const xUp = x;
            const yUp = y;

            const xDiff = xUp - xDown;
            const yDiff = yDown - yUp
            if (Math.abs(xDiff) > Math.abs(yDiff)) {/*most significant*/
                if (xDiff > 0) {
                    /* right swipe */
                    ui.onswipe && ui.onswipe("right");
                } else {
                    /* left swipe */
                    ui.onswipe && ui.onswipe("left");
                }
            } else {
                if (yDiff > 0) {
                    /* up swipe */
                    ui.onswipe && ui.onswipe("up");
                } else {
                    /* down swipe */
                    ui.onswipe && ui.onswipe("down");
                }
            }
            /* reset values */
            xDown = null;
            yDown = null;
        };

        document.addEventListener("pointerdown", (e) => handleTouchStart(e.pageX, e.pageY))
        document.addEventListener("pointermove", (e) => handleTouchMove(e.pageX, e.pageY))
        document.addEventListener("keydown", (ev) => {
            switch (ev.key) {
                case "ArrowUp":
                    ui.onswipe && ui.onswipe("up");
                    break;
                case "ArrowDown":
                    ui.onswipe && ui.onswipe("down");
                    break;
                case "ArrowLeft":
                    ui.onswipe && ui.onswipe("left");
                    break;
                case "ArrowRight":
                    ui.onswipe && ui.onswipe("right");
                    break;
                case " ":
                    ui.onclick && (ui.onclick("pause"), ui.onclick("continue"));
                    break;
                default:
                    break;
            }
        })
    }
    update(): void {
    }

}