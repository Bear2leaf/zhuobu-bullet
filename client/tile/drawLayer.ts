import { Vec2, Camera, Mesh, Geometry, Program, Texture, RenderTarget, OGLRenderingContext } from "ogl";
import { Tiled } from "../misc/TiledParser.js";

export function drawLayer(tiledData: Tiled, identifer: string, textures: Texture[], renderTargets: RenderTarget[], gl: OGLRenderingContext, spriteVertex: string, spriteFragment: string) {

    const levels = tiledData.layers;
    for (let index = 0; index < levels.length; index++) {
        const level = levels[index];
        const layer = level.layers?.find(inst => inst.name === identifer);
        const gid = layer?.chunks[0].data.find(gid => gid);
        if (!gid) {
            throw new Error("gid is undefined");
        }
        const tileset = tiledData.tilesets.find(tileset => tileset.firstgid <= gid && gid < (tileset.firstgid + tileset.tilecount))
        if (!tileset) {
            throw new Error("tileset is undefined");
        }
        if (!layer) {
            throw new Error("parsing error")
        }
        const texture = textures.find(texture => (texture.image as HTMLImageElement).src.endsWith(tileset.image));
        if (!texture) {
            throw new Error("texture is undefined")
        }
        const w = texture.width;
        const h = texture.height;
        const renderTarget = renderTargets[index];
        const position = new Array;
        const uv = new Array;
        const gridSize = tiledData.tilewidth;
        const min = new Vec2();
        const max = new Vec2();
        for (let i = 0; i < layer.chunks.length; i++) {
            const chunk = layer.chunks[i];
            min.x = Math.min(chunk.x, min.x);
            min.y = Math.min(chunk.y, min.y);
            max.x = Math.max(chunk.x + chunk.width, max.x);
            max.y = Math.max(chunk.y + chunk.height, max.y);
            for (let j = 0; j < chunk.data.length; j++) {
                const gid = chunk.data[j];
                if (gid === 0) {
                    continue;
                }
                const ux = ((gid - tileset.firstgid) % tileset.columns) * (tileset.tilewidth + tileset.spacing);
                const uy = Math.floor((gid - tileset.firstgid) / tileset.columns) * (tileset.tileheight + tileset.spacing);
                const x = ((j % chunk.width) + chunk.x) * gridSize;
                const y = (Math.floor(j / chunk.width) + chunk.y) * gridSize;

                position.push(x);
                position.push((y));
                position.push(0);
                position.push(x + gridSize);
                position.push((y));
                position.push(0);
                position.push(x + gridSize);
                position.push((y + gridSize));
                position.push(0);
                position.push(x + gridSize);
                position.push((y + gridSize));
                position.push(0);
                position.push(x);
                position.push((y + gridSize));
                position.push(0);
                position.push(x);
                position.push((y));
                position.push(0);
                uv.push((ux) / w);
                uv.push(1 - (uy) / h);
                uv.push((ux + gridSize) / w);
                uv.push(1 - (uy) / h);
                uv.push((ux + gridSize) / w);
                uv.push(1 - (uy + gridSize) / h);
                uv.push((ux + gridSize) / w);
                uv.push(1 - (uy + gridSize) / h);
                uv.push((ux) / w);
                uv.push(1 - (uy + gridSize) / h);
                uv.push((ux) / w);
                uv.push(1 - (uy) / h);
            }
        }
        //MAGIC!!! this 0.1 offset make REAL PIXEL PERFECT
        const camera = new Camera(gl, {
            left: 0.1 + min.x * tileset.tilewidth,
            right: max.x * tileset.tilewidth,
            top: max.y * tileset.tileheight,
            bottom: 0.1 + min.y * tileset.tileheight,
            near: 0,
            far: -1
        })
        const scene = new Mesh(gl, {
            geometry: new Geometry(gl, {
                position: {
                    size: 3,
                    data: new Float32Array(position)
                },
                uv: {
                    size: 2,
                    data: new Float32Array(uv)
                },
            }),
            program: new Program(gl, {
                vertex: spriteVertex,
                fragment: spriteFragment,
                uniforms: {
                    tMap: { value: texture }
                },
                transparent: true
            })
        });
        gl.renderer.render({
            scene,
            camera,
            target: renderTarget,
            clear: false
        })
    }
}