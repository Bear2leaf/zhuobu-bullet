import { Transform, Vec3 } from "ogl";

export default interface Level {
    checkNeedExit(collision: string): boolean;
    checkGetPickaxe(collision: string): boolean;
    getRadius(): number
    isMazeMode(): boolean
    onaddmesh?: (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>) => void;
    onaddball?: (transform: number[]) => void;
    getIndex(): number;
    load(): Promise<void>
    updateLevel(reverse: boolean): void
    init(scene: Transform): void
    request(scene: Transform): void
    getCenter(): Vec3;
}