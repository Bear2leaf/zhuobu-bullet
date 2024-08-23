export interface System {
    load(): Promise<void>;
    init(): void;
    update(timeStamp: number): void;
}