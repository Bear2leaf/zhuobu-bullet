import { Transform } from "ogl";

export default interface UIElement {
    down(): void;
    release(): void;
    getMesh(): Transform;
    isDown(): boolean;
}