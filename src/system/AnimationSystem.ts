import { GLTF, GLTFAnimationReference } from "ogl";
import { System } from "./System";

export default class AnimationSystem implements System {
    private readonly animations: GLTFAnimationReference[] = [];
    down: boolean = false;
    async load(): Promise<void> {
    }
    init() {
    }
    start(): void {
    }
    update(timeStamp: number): void {
        for (let i = 0; i < this.animations.length; i++) {
            const animation = this.animations[i];
            if (this.down) {
                animation.animation.elapsed += timeStamp;
            } else {
                animation.animation.elapsed -= timeStamp;
            }


            animation.animation.elapsed = Math.min(animation.animation.elapsed, animation.animation.duration);
            animation.animation.elapsed = Math.max(animation.animation.elapsed, 0);
            animation.animation.update();
        }
    }
    initAnimations(gltf: GLTF) {
        for (const animation of gltf.animations) {
            animation.animation.loop = false;
            this.animations.push(animation);
        }
    }

}