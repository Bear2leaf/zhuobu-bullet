import { Animation, GLTF, GLTFAnimationReference } from "ogl";
import { System } from "./System";

export default class AnimationSystem implements System {
    private readonly animations: GLTFAnimationReference[] = [];
    update(timeStamp: number): void {
        for (const animation of this.animations) {
            animation.animation.elapsed += timeStamp;
            animation.animation.elapsed %= animation.animation.duration;
            animation.animation.update();
        }
    }
    async load(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    init() {
        throw new Error("Method not implemented.");
    }
    initAnimations(gltf: GLTF) {
        for (const animation of gltf.animations) {
            this.animations.push(animation);
        }
    }
}