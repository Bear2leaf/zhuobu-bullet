type TypedArray = Float32Array | Uint32Array | Uint16Array | Uint8Array | Int32Array | Int16Array | Int8Array;

export default function DracoDecoderModule(object?: Record<string, unknown>): Promise<DecoderModule>;
export function createEncoderModule(object?: Record<string, unknown>): Promise<EncoderModule>;

export interface BaseModule {
    Mesh: new() => Mesh;

    DracoFloat32Array: new() => DracoFloat32Array;
    DracoInt8Array: new() => DracoInt8Array;
    DracoInt16Array: new() => DracoInt16Array;
    DracoInt32Array: new() => DracoInt32Array;
    DracoUInt8Array: new() => DracoUInt8Array;
    DracoUInt16Array: new() => DracoUInt16Array;
    DracoUInt32Array: new() => DracoUInt32Array;

    POSITION: GeometryAttributeType;
    NORMAL: GeometryAttributeType;
    TEX_COORD: GeometryAttributeType;
    COLOR: GeometryAttributeType;
    GENERIC: GeometryAttributeType;
    INVALID: GeometryAttributeType;

    _malloc(ptr: number): number;
    _free(ptr: number): void;
    destroy(object: unknown): void;

    // Heap.
    HEAPF32: Float32Array;
    HEAP32: Int32Array;
    HEAP16: Int16Array;
    HEAP8: Int8Array;
    HEAPU32: Uint32Array;
    HEAPU16: Uint16Array;
    HEAPU8: Uint8Array;
}

export interface EncoderModule extends BaseModule {
    Encoder: new() => Encoder;
    ExpertEncoder: new(pc: PointCloud) => ExpertEncoder;
    MeshBuilder: new() => MeshBuilder;
    Metadata: new() => Metadata;
    MetadataBuilder: new() => MetadataBuilder;

    MESH_SEQUENTIAL_ENCODING: number;
    MESH_EDGEBREAKER_ENCODING: number;
}

export interface DracoDecoderModuleProps {
    wasmBinary?: ArrayBuffer;
    onModuleLoaded?(draco: DecoderModule): void;
}

export type DracoDecoderModule = (props: DracoDecoderModuleProps) => Promise<DecoderModule>;

export interface DecoderModule extends BaseModule {
    Decoder: new() => Decoder;
    DecoderBuffer: new() => DecoderBuffer;
    PointCloud: new() => PointCloud;
    MetadataQuerier: new() => MetadataQuerier;

    // GeometryType.
    TRIANGULAR_MESH: GeometryType;
    POINT_CLOUD: GeometryType;

    // DataType.
    DT_FLOAT32: DataType;
    DT_INT8: DataType;
    DT_INT16: DataType;
    DT_INT32: DataType;
    DT_UINT8: DataType;
    DT_UINT16: DataType;
    DT_UINT32: DataType;
}

interface EncoderBase {
    SetSpeedOptions(encodeSpeed: number, decodeSpeed: number): void;
    SetEncodingMethod(method: number): void;
    SetTrackEncodedProperties(track: boolean): void;
    GetNumberOfEncodedPoints(): number;
    GetNumberOfEncodedFaces(): number;
}

export interface Encoder extends EncoderBase {
    SetAttributeQuantization(attributeType: GeometryAttributeType, bits: number): void;
    SetAttributeExplicitQuantization(
        attributeType: GeometryAttributeType,
        bits: number,
        itemSize: number,
        origin: [number, number, number],
        range: number,
    ): void;
    EncodeMeshToDracoBuffer(mesh: Mesh, array: DracoInt8Array): number;
}

export interface ExpertEncoder extends EncoderBase {
    SetAttributeQuantization(attributeId: number, bits: number): void;
    SetAttributeExplicitQuantization(
        attributeId: number,
        bits: number,
        itemSize: number,
        origin: [number, number, number],
        range: number,
    ): void;
    EncodeToDracoBuffer(deduplicateValues: boolean, array: DracoInt8Array): number;
}

export interface Decoder {
    DecodeBufferToMesh(buffer: DecoderBuffer, mesh: Mesh): Status;
    DecodeBufferToPointCloud(buffer: DecoderBuffer, pointCloud: PointCloud): Status;
    GetAttributeByUniqueId(pointCloud: PointCloud, id: number): Attribute;
    GetFaceFromMesh(mesh: Mesh, index: number, array: DracoArray): number;
    GetTrianglesUInt16Array(mesh: Mesh, byteLength: number, ptr: number): void;
    GetTrianglesUInt32Array(mesh: Mesh, byteLength: number, ptr: number): void;
    GetAttributeDataArrayForAllPoints: (
        pointCloud: PointCloud,
        attribute: Attribute,
        type: DataType,
        byteLength: number,
        ptr: number,
    ) => void;
    GetAttributeFloatForAllPoints(pointCloud: PointCloud, attribute: Attribute, array: DracoArray): void;
    GetAttributeInt8ForAllPoints(pointCloud: PointCloud, attribute: Attribute, array: DracoArray): void;
    GetAttributeInt16ForAllPoints(pointCloud: PointCloud, attribute: Attribute, array: DracoArray): void;
    GetAttributeInt32ForAllPoints(pointCloud: PointCloud, attribute: Attribute, array: DracoArray): void;
    GetAttributeUInt8ForAllPoints(pointCloud: PointCloud, attribute: Attribute, array: DracoArray): void;
    GetAttributeUInt16ForAllPoints(pointCloud: PointCloud, attribute: Attribute, array: DracoArray): void;
    GetAttributeUInt32ForAllPoints(pointCloud: PointCloud, attribute: Attribute, array: DracoArray): void;
    GetEncodedGeometryType(buffer: DecoderBuffer): GeometryType;
    GetAttributeId(pointCloud: PointCloud, attributeType: number): number;
    GetAttributeIdByName(pointCloud: PointCloud, name: string): number;
    GetAttribute(pointCloud: PointCloud, id: number): Attribute;
    GetMetadata(pointCloud: PointCloud): Metadata;
    GetAttributeMetadata(pointCloud: PointCloud, attributeId: number): Metadata;
}

export interface DecoderBuffer {
    Init(array: Int8Array, byteLength: number): void;
}

export interface DracoArray {
    GetValue(index: number): number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DracoFloat32Array extends DracoArray {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DracoInt8Array extends DracoArray {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DracoInt16Array extends DracoArray {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DracoInt32Array extends DracoArray {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DracoUInt8Array extends DracoArray {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DracoUInt16Array extends DracoArray {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DracoUInt32Array extends DracoArray {}

export interface Status {
    ok(): boolean;
    error_msg(): string;
}

export interface Attribute {
    num_components(): number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export enum GeometryType {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export enum GeometryAttributeType {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export enum DataType {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Metadata {}

export interface MetadataBuilder {
    AddStringEntry(metadata: Metadata, entryName: string, entryValue: string): boolean;
    AddIntEntry(metadata: Metadata, entryName: string, entryValue: number): boolean;
    AddIntEntryArray(metadata: Metadata, entryName: string, entryValues: TypedArray, numValues: number): boolean;
    AddDoubleEntry(metadata: Metadata, entryName: string, entryValue: number): boolean;
}

export interface MetadataQuerier {
    HasEntry(metadata: Metadata, entryName: string): boolean;
    GetIntEntry(metadata: Metadata, entryName: string): number;
    GetIntEntryArray(metadata: Metadata, entryName: string, outValues: DracoInt32Array): void;
    GetDoubleEntry(metadata: Metadata, entryName: string): number;
    GetStringEntry(metadata: Metadata, entryName: string): string;
    NumEntries(metadata: Metadata): number;
    GetEntryName(metadata: Metadata, entryId: number): string;
}

export interface PointCloud {
    ptr: number;
    num_attributes(): number;
    num_points(): number;
}

export interface Mesh extends PointCloud {
    num_faces(): number;
}

export interface PointCloudBuilder {
    AddFloatAttribute(
        pointCloud: PointCloud,
        attribute: number,
        count: number,
        itemSize: number,
        array: TypedArray,
    ): number;
    AddInt8Attribute(
        pointCloud: PointCloud,
        attribute: number,
        count: number,
        itemSize: number,
        array: TypedArray,
    ): number;
    AddUInt8Attribute(
        pointCloud: PointCloud,
        attribute: number,
        count: number,
        itemSize: number,
        array: TypedArray,
    ): number;
    AddInt16Attribute(
        pointCloud: PointCloud,
        attribute: number,
        count: number,
        itemSize: number,
        array: TypedArray,
    ): number;
    AddUInt16Attribute(
        pointCloud: PointCloud,
        attribute: number,
        count: number,
        itemSize: number,
        array: TypedArray,
    ): number;
    AddInt32Attribute(
        pointCloud: PointCloud,
        attribute: number,
        count: number,
        itemSize: number,
        array: TypedArray,
    ): number;
    AddUInt32Attribute(
        pointCloud: PointCloud,
        attribute: number,
        count: number,
        itemSize: number,
        array: TypedArray,
    ): number;
    SetMetadataForAttribute(pointCloud: PointCloud, attributeId: number, metadata: Metadata): boolean;
    AddMetadata(pointCloud: PointCloud, metadata: Metadata): boolean;
    SetNormalizedFlagForAttribute(pointCloud: PointCloud, attributeId: number, normalized: boolean): boolean;
}

export interface MeshBuilder extends PointCloudBuilder {
    AddFacesToMesh(mesh: Mesh, numFaces: number, faces: Uint16Array | Uint32Array): void;
}

export {};
