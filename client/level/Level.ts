import { Transform, Vec3 } from "ogl";

export default interface Level {
    getRadius(): number
    isMazeMode(): boolean
    onaddmesh?: (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>) => void;
    onaddball?: (transform: number[]) => void;
    getIndex(): number;
    load(): Promise<void>
    setIndex(level: number): void
    request(scene: Transform, reverse: boolean): void
    getCenter(): Vec3;
}