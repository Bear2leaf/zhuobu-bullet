import { Animation, GLTF, GLTFAnimationReference } from "ogl";
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


            if (animation.animation.elapsed <= 0) {
                animation.animation.elapsed = 0;
            } else if (animation.animation.elapsed >= animation.animation.duration) {
                animation.animation.elapsed = animation.animation.duration;
            } else {
                animation.animation.update();
            }
        }
    }
    initAnimations(gltf: GLTF) {
        for (const animation of gltf.animations) {
            this.animations.push(animation);
        }
    }

}