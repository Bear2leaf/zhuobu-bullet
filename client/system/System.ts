export interface System {
    load(): Promise<void>;
    init(): void;
    start(): void;
    update(timeStamp: number): void;
}