import { Transform } from "ogl";

export default interface ButtonStatus {
    down(): void;
    release(): void;
    getMesh(): Transform;
    isDown(): boolean;
}