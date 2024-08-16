import { Box, Geometry, Mat4, Mesh, OGLRenderingContext, Plane, Program, Transform, Vec3, Vec4 } from "ogl";
import Level from "./Level.js";
import { getContours } from "../misc/contour2d.js";
import ndarray from "../misc/ndarray/ndarray.js";
import { Convert, LDtk } from "../misc/LDtkParser.js";

export default class LDtkLevel implements Level {

    private fragment: string = "";
    private vertex: string = "";
    private ldtkData: string = "";
    private radius = 0;
    private counter = 0;
    private readonly center = new Vec3();
    private readonly levels: LDtk["levels"] = [];
    onaddmesh?: (name: string | undefined, transform: number[], vertices: number[], indices: number[], propertities?: Record<string, boolean>) => void;
    onaddball?: (transform: number[]) => void;
    constructor(private readonly gl: OGLRenderingContext) {
    }
    getIndex() {
        return 0;
    }
    getCenter(): Vec3 {
        return this.center;
    }
    async load() {

        this.vertex = await (await fetch("resources/glsl/level.vert.sk")).text();
        this.fragment = await (await fetch("resources/glsl/level.frag.sk")).text();
        this.ldtkData = await (await fetch("resources/ldtk/WorldMap_GridVania_layout.json")).text();
        this.levels.push(...Convert.toLDtk(this.ldtkData).levels);
    }
    setIndex(level: number) {
    }
    request(scene: Transform, reverse = false) {
        const gl = this.gl;
        const levels = this.levels.filter(level => !level.worldDepth);
        const min = new Vec3();
        const max = new Vec3();
        for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
            const level = levels[levelIndex];
            const layerInstances = level.layerInstances || [];
            const collisions = layerInstances.find(inst => inst.__identifier === "Collisions");
            if (!collisions) {
                throw new Error("parsing error")
            }
            const rows = collisions.__cHei;
            const cols = collisions.__cWid;

            const contours = (getContours(ndarray(collisions.intGridCsv.map(x => x === 1 ? 1 : 0), [rows, cols]), false));
            for (let index = 0; index < contours.length; index++) {
                const contour = contours[index];
                const position = contour.reduce((prev, point, index, arr) => {
                    const p = [...point];
                    p[0] = (p[0] + level.worldX / 16) * 4;
                    p[1] = -((p[1] + level.worldY / 16)) * 4;
                    const nextP = [...arr[(index + 1) % arr.length]];
                    nextP[0] = (nextP[0] + level.worldX / 16) * 4;
                    nextP[1] = -((nextP[1] + level.worldY / 16)) * 4;
                    prev.push(...p, -2, ...p, 2, ...nextP, 2, ...nextP, 2, ...nextP, -2, ...p, -2);
                    return prev;
                }, []);
                const mesh = new Mesh(gl, {
                    geometry: new Geometry(gl, {
                        position: { data: new Float32Array(position), size: 3 },
                    }),
                    program: new Program(gl, {
                        vertex: this.vertex,
                        fragment: this.fragment,
                        uniforms: {
                            uColor: {
                                value: new Vec3(0.7, 0.7, 0.7)
                            }
                        },
                        cullFace: false
                    })
                });
                mesh.name = "test" + this.counter++;
                mesh.setParent(scene);
                mesh.geometry.computeBoundingBox();
                mesh.geometry.computeBoundingSphere();
                const meshMin = mesh.geometry.bounds.min;
                const meshMax = mesh.geometry.bounds.max;
                min.x = Math.min(meshMin.x, min.x);
                min.y = Math.min(meshMin.y, min.y);
                min.z = Math.min(meshMin.z, min.z);
                max.x = Math.max(meshMax.x, max.x);
                max.y = Math.max(meshMax.y, max.y);
                max.z = Math.max(meshMax.z, max.z);
                const attributeData = mesh.geometry.getPosition().data;
                const indices = mesh.geometry.attributes.index?.data;
                this.onaddmesh && this.onaddmesh(mesh.name, mesh.matrix, [...attributeData || []], [...indices || []], {})
            }
        }

        {
            const mesh = new Mesh(gl, {
                geometry: new Plane(gl, {
                    width: max.x - min.x,
                    height: max.y - min.y,
                }),
                program: new Program(gl, {
                    vertex: this.vertex,
                    fragment: this.fragment,
                    uniforms: {
                        uColor: {
                            value: new Vec3(0.4, 0.4, 0.4)
                        }
                    },
                })
            });
            mesh.name = "test" + this.counter++;
            mesh.setParent(scene)
            mesh.position.x = (max.x + min.x) / 2;
            mesh.position.y = (max.y + min.y) / 2;
            mesh.position.z = max.z;
            mesh.updateMatrix();
            mesh.geometry.computeBoundingBox();
            mesh.geometry.computeBoundingSphere();
            mesh.visible = false;
            const attributeData = mesh.geometry.getPosition().data;
            const indices = mesh.geometry.attributes.index?.data;
            this.onaddmesh && this.onaddmesh(mesh.name, mesh.matrix, [...attributeData || []], [...indices || []], {})
            this.radius = mesh.geometry.bounds.radius;
        }
        {
            const mesh = new Mesh(gl, {
                geometry: new Plane(gl, {
                    width: max.x - min.x,
                    height: max.y - min.y,
                }),
                program: new Program(gl, {
                    vertex: this.vertex,
                    fragment: this.fragment,
                    uniforms: {
                        uColor: {
                            value: new Vec3(0.4, 0.4, 0.4)
                        }
                    }
                })
            });
            mesh.name = "test" + this.counter++;
            mesh.setParent(scene)
            mesh.position.x = (max.x + min.x) / 2;
            mesh.position.y = (max.y + min.y) / 2;
            mesh.position.z = min.z;
            mesh.updateMatrix();
            mesh.geometry.computeBoundingBox();
            mesh.geometry.computeBoundingSphere();
            const attributeData = mesh.geometry.getPosition().data;
            const indices = mesh.geometry.attributes.index?.data;
            this.onaddmesh && this.onaddmesh(mesh.name, mesh.matrix, [...attributeData || []], [...indices || []], {})
            this.radius = mesh.geometry.bounds.radius;
        }
        this.center.copy(new Vec3((max.x + min.x) / 2, (max.y + min.y) / 2, 0))
        this.onaddball && this.onaddball(new Mat4().translate(new Vec3(1, -30, 0)))
    }
    getRadius(): number {
        return this.radius;
    }
    isMazeMode(): boolean {
        return true;
    }
}