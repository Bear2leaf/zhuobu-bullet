import { Camera, Mesh, Raycast, Transform, Vec2 } from "ogl";
import { System } from "./System.js";
import UIElement from "../ui/UIElement.js";
import UISystem from "./UISystem.js";

export class InputSystem implements System {
    private readonly mouse = new Vec2();
    constructor(private readonly width: number, private readonly  height: number, private readonly camera: Camera, private readonly uiSystem: UISystem) {
    }
    onclick?: (tag?: string) => void;
    onswipe?: (direction: "left" | "right" | "up" | "down") => void;
    load(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    init(): void {
        const mouse = this.mouse;
        const width = this.width;
        const height = this.height;
        const camera = this.camera;
        const all = this.uiSystem.all;
        // Create a raycast object
        const raycast = new Raycast();
        const move = (e: { x: number, y: number }) => {
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

            const help = all.find(node => node.getMesh().name === "help");
            if (help) {
                help.getMesh().visible = false;
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
        const end = () => {
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

        document.addEventListener("touchstart", (e) => start({ x: e.touches[0].pageX, y: e.touches[0].pageY }))
        document.addEventListener("touchmove", (e) => move({ x: e.touches[0].pageX, y: e.touches[0].pageY }))
        document.addEventListener("touchend", () => end())
        document.addEventListener("touchcancel", () => end())
        document.addEventListener("mousedown", (e) => start({ x: e.pageX, y: e.pageY }))
        document.addEventListener("mousemove", (e) => move({ x: e.pageX, y: e.pageY }))
        document.addEventListener("mouseup", () => end())
    }
    initTouchEvents() {
        const ui = this;
        let xDown: number | null = null;
        let yDown: number | null = null;


        function handleTouchStart(x: number, y: number) {
            xDown = x;
            yDown = y;
        };

        function handleTouchMove(x: number, y: number) {
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
        document.addEventListener("touchstart", (ev) => handleTouchStart(ev.touches[0].clientX, ev.touches[0].clientY));
        document.addEventListener("touchmove", (ev) => handleTouchMove(ev.touches[0].clientX, ev.touches[0].clientY));
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
        throw new Error("Method not implemented.");
    }
    
}