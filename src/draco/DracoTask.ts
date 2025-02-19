import createDecoderModule, { Attribute, Decoder, DecoderBuffer, DecoderModule, DracoArray, DracoDecoderModule, DracoDecoderModuleProps, GeometryAttributeType, Mesh, PointCloud } from "./draco.js";

type AttributeConstructor = (typeof Float32Array | typeof Int8Array | typeof Int16Array | typeof Int32Array | typeof Uint8Array | typeof Uint16Array | typeof Uint32Array);
type AttributeType = Float32Array | Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array;
type AttributeResult = {
    name?: string;
    array: AttributeType;
    itemSize: number;
};
type TaskConfig = { attributeIDs: Record<string, number>; attributeTypes: Record<string, string>; };
type MessageData = { type: "init", id: string, decoderConfig: Record<string, unknown> }
    | { type: "decode", id: string, buffer?: ArrayBuffer, taskConfig?: TaskConfig };
export default class DracoTask {
    postMessage: any;
    onmessage: (e: { data: MessageData }) => void;
    constructor() {
        let decoderConfig: Record<string, unknown>;
        let decoderPending: Promise<{ draco: DecoderModule }>;
        this.postMessage = null;
        this.onmessage = function (e) {
            const message = e.data;
            switch (message.type) {
                case 'init':
                    decoderConfig = message.decoderConfig;
                    decoderPending = new Promise(function (resolve /*, reject*/) {
                        decoderConfig.onModuleLoaded = function (draco: DecoderModule) {
                            // Module is Promise-like. Wrap before resolving to avoid loop.
                            resolve({ draco });
                        };
                        createDecoderModule(decoderConfig);
                    });
                    break;

                case 'decode':
                    const buffer = message.buffer;
                    if (!buffer) {
                        throw new Error('THREE.DRACOLoader: ArrayBuffer with Draco compressed data is not defined.');
                    }
                    const taskConfig = message.taskConfig;
                    if (!taskConfig) {
                        throw new Error('THREE.DRACOLoader: Task configuration is not defined.');
                    }
                    decoderPending.then((module) => {
                        const draco = module.draco;
                        const decoder = new draco.Decoder();
                        const decoderBuffer = new draco.DecoderBuffer();
                        decoderBuffer.Init(new Int8Array(buffer), buffer.byteLength);
                        try {
                            const geometry = decodeGeometry(draco, decoder, decoderBuffer, taskConfig);

                            this.postMessage({ type: 'decode', id: message.id, geometry });
                        } catch (error) {
                            console.error(error);

                            this.postMessage({ type: 'error', id: message.id, error: (error as any).message });
                        } finally {
                            draco.destroy(decoderBuffer);
                            draco.destroy(decoder);
                        }
                    });
                    break;
            }
        };

        function decodeGeometry(draco: DecoderModule, decoder: Decoder, decoderBuffer: DecoderBuffer, taskConfig: TaskConfig) {
            const attributeIDs = taskConfig.attributeIDs;
            const attributeTypes = taskConfig.attributeTypes;

            let dracoGeometry;
            let decodingStatus;

            const geometryType = decoder.GetEncodedGeometryType(decoderBuffer);

            if (geometryType === draco.TRIANGULAR_MESH) {
                dracoGeometry = new draco.Mesh();
                decodingStatus = decoder.DecodeBufferToMesh(decoderBuffer, dracoGeometry);
            } else if (geometryType === draco.POINT_CLOUD) {
                dracoGeometry = new draco.PointCloud();
                decodingStatus = decoder.DecodeBufferToPointCloud(decoderBuffer, dracoGeometry);
            } else {
                throw new Error('THREE.DRACOLoader: Unexpected geometry type.');
            }

            if (!decodingStatus.ok() || dracoGeometry.ptr === 0) {
                throw new Error('THREE.DRACOLoader: Decoding failed: ' + decodingStatus.error_msg());
            }
            const geometry: { index: AttributeResult, attributes: AttributeResult[] } = { index: null!, attributes: [] };

            // Gather all vertex attributes.
            for (const attributeName in attributeIDs) {
                const attributeType = self[attributeTypes[attributeName] as keyof typeof self];

                let attribute;
                let attributeID;

                // A Draco file may be created with default vertex attributes, whose attribute IDs
                // are mapped 1:1 from their semantic name (POSITION, NORMAL, ...). Alternatively,
                // a Draco file may contain a custom set of attributes, identified by known unique
                // IDs. glTF files always do the latter, and `.drc` files typically do the former.
                attributeID = attributeIDs[attributeName];
                attribute = decoder.GetAttributeByUniqueId(dracoGeometry, attributeID);

                geometry.attributes.push(decodeAttribute(draco, decoder, dracoGeometry, attributeName, attributeType, attribute));
            }

            // Add index.
            if (geometryType === draco.TRIANGULAR_MESH) {
                geometry.index = decodeIndex(draco, decoder, dracoGeometry as Mesh);
            }

            draco.destroy(dracoGeometry);

            return geometry;
        }

        function decodeIndex(draco: DecoderModule, decoder: Decoder, dracoGeometry: Mesh) {
            const numFaces = dracoGeometry.num_faces();
            const numIndices = numFaces * 3;
            const byteLength = numIndices * 4;

            const ptr = draco._malloc(byteLength);
            decoder.GetTrianglesUInt32Array(dracoGeometry, byteLength, ptr);
            const index = new Uint32Array(draco.HEAPF32.buffer, ptr, numIndices).slice();
            draco._free(ptr);

            return { array: index, itemSize: 1 };
        }

        function decodeAttribute(draco: DecoderModule, decoder: Decoder, dracoGeometry: Mesh | PointCloud, attributeName: string, attributeType: AttributeConstructor, attribute: Attribute) {
            const numComponents = attribute.num_components();
            const numPoints = dracoGeometry.num_points();
            const numValues = numPoints * numComponents;
            const byteLength = numValues * attributeType.BYTES_PER_ELEMENT;
            const dataType = getDracoDataType(draco, attributeType);
            const ptr = draco._malloc(byteLength);
            decoder.GetAttributeDataArrayForAllPoints(dracoGeometry, attribute, dataType, byteLength, ptr);
            //@ts-ignore
            const array = new attributeType(draco.HEAPF32.buffer, ptr, numValues).slice();
            draco._free(ptr);

            return {
                name: attributeName,
                array: array,
                itemSize: numComponents,
            };
        }
        function getDracoDataType(draco: DecoderModule, attributeType: AttributeConstructor) {
            switch (attributeType) {
                case Float32Array:
                    return draco.DT_FLOAT32;
                case Int8Array:
                    return draco.DT_INT8;
                case Int16Array:
                    return draco.DT_INT16;
                case Int32Array:
                    return draco.DT_INT32;
                case Uint8Array:
                    return draco.DT_UINT8;
                case Uint16Array:
                    return draco.DT_UINT16;
                case Uint32Array:
                    return draco.DT_UINT32;
                default:
                    throw new Error('THREE.DRACOLoader: Unsupported attribute type.');
            }
        }
    }
}
