import { Vec3 } from "ogl";

export const table: Record<string, (tag: "right" | "left" | "up" | "down", rotation: Vec3) => void> = {
    "000": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;
            case "down":
                rotation.x = (rotation.x + 1) % 4;
                break;

            default:
                break;
        }
    },
    "001": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;
            case "down":
                rotation.x = (rotation.x + 1) % 4;
                break;

            default:
                break;
        }
    },
    "002": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;
            case "down":
                rotation.x = (rotation.x + 1) % 4;
                break;

            default:
                break;
        }
    },
    "003": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;
            case "down":
                rotation.x = (rotation.x + 1) % 4;
                break;

            default:
                break;
        }
    },
    "010": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.z = rotation.z === 0 ? 3 : (rotation.z - 1);
                break;
            case "down":
                rotation.z = (rotation.z + 1) % 4;
                break;

            default:
                break;
        }
    },
    "011": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;

            case "up":
                rotation.z = rotation.z === 0 ? 3 : (rotation.z - 1);
                break;
            case "down":
                rotation.z = (rotation.z + 1) % 4;
                break;

            default:
                break;
        }
    },
    "012": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;

            case "up":
                rotation.z = rotation.z === 0 ? 3 : (rotation.z - 1);
                break;
            case "down":
                rotation.z = (rotation.z + 1) % 4;
                break;

            default:
                break;
        }
    },
    "013": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;

            case "up":
                rotation.z = rotation.z === 0 ? 3 : (rotation.z - 1);
                break;
            case "down":
                rotation.z = (rotation.z + 1) % 4;
                break;

            default:
                break;
        }
    },
    "020": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = (rotation.x + 1) % 4;
                break;
            case "down":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;

            default:
                break;
        }
    },
    "021": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = (rotation.x + 1) % 4;
                break;
            case "down":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;

            default:
                break;
        }
    },
    "022": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = (rotation.x + 1) % 4;
                break;
            case "down":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;

            default:
                break;
        }
    },
    "023": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = (rotation.x + 1) % 4;
                break;
            case "down":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;

            default:
                break;
        }
    },
    "030": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.z = (rotation.z + 1) % 4;
                break;
            case "down":
                rotation.z = rotation.z === 0 ? 3 : (rotation.z - 1);
                break;

            default:
                break;
        }
    },
    "031": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;

            case "up":
                rotation.z = (rotation.z + 1) % 4;
                break;
            case "down":
                rotation.z = rotation.z === 0 ? 3 : (rotation.z - 1);
                break;

            default:
                break;
        }
    },
    "032": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;

            case "up":
                rotation.z = (rotation.z + 1) % 4;
                break;
            case "down":
                rotation.z = rotation.z === 0 ? 3 : (rotation.z - 1);
                break;

            default:
                break;
        }
    },
    "033": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.z = (rotation.z + 1) % 4;
                break;
            case "down":
                rotation.z = rotation.z === 0 ? 3 : (rotation.z - 1);
                break;
            default:
                break;
        }
    },
    "100": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;
            case "down":
                rotation.x = (rotation.x + 1) % 4;
                break;

            default:
                break;
        }
    },
    "101": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;
            case "down":
                rotation.x = (rotation.x + 1) % 4;
                break;

            default:
                break;
        }
    },
    "102": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;
            case "down":
                rotation.x = (rotation.x + 1) % 4;
                break;

            default:
                break;
        }
    },
    "103": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;
            case "down":
                rotation.x = (rotation.x + 1) % 4;
                break;

            default:
                break;
        }
    },
    "110": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 3;
                break;
            case "down":
                rotation.x = 0;
                rotation.y = 2;
                rotation.z = 1;
                break;

            default:
                break;
        }
    },
    "111": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 0;
                break;
            case "down":
                rotation.x = 2;
                rotation.y = 0;
                rotation.z = 0;
                break;

            default:
                break;
        }
    },
    "112": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 1;
                break;
            case "down":
                rotation.x = 0;
                rotation.y = 2;
                rotation.z = 3;
                break;

            default:
                break;
        }
    },
    "113": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 2;
                break;
            case "down":
                rotation.x = 0;
                rotation.y = 2;
                rotation.z = 0;
                break;

            default:
                break;
        }
    },
    "120": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = (rotation.x + 1) % 4;
                break;
            case "down":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;

            default:
                break;
        }
    },
    "121": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = (rotation.x + 1) % 4;
                break;
            case "down":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;

            default:
                break;
        }
    },
    "122": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = (rotation.x + 1) % 4;
                break;
            case "down":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;

            default:
                break;
        }
    },
    "123": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = (rotation.x + 1) % 4;
                break;
            case "down":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;

            default:
                break;
        }
    },
    "130": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 1;
                break;
            case "down":
                rotation.x = 0;
                rotation.y = 2;
                rotation.z = 3;
                break;

            default:
                break;
        }
    },
    "131": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 2;
                break;
            case "down":
                rotation.x = 0;
                rotation.y = 2;
                rotation.z = 0;
                break;

            default:
                break;
        }
    },
    "132": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 3;
                break;
            case "down":
                rotation.x = 0;
                rotation.y = 2;
                rotation.z = 1;
                break;

            default:
                break;
        }
    },
    "133": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 0;
                break;
            case "down":
                rotation.x = 2;
                rotation.y = 0;
                rotation.z = 0;
                break;
            default:
                break;
        }
    },
    "200": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;
            case "down":
                rotation.x = (rotation.x + 1) % 4;
                break;

            default:
                break;
        }
    },
    "201": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;
            case "down":
                rotation.x = (rotation.x + 1) % 4;
                break;

            default:
                break;
        }
    },
    "202": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;
            case "down":
                rotation.x = (rotation.x + 1) % 4;
                break;

            default:
                break;
        }
    },
    "203": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;
            case "down":
                rotation.x = (rotation.x + 1) % 4;
                break;

            default:
                break;
        }
    },
    "210": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.z = (rotation.z + 1) % 4;
                break;
            case "down":
                rotation.z = rotation.z === 0 ? 3 : (rotation.z - 1);
                break;

            default:
                break;
        }
    },
    "211": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.z = (rotation.z + 1) % 4;
                break;
            case "down":
                rotation.z = rotation.z === 0 ? 3 : (rotation.z - 1);
                break;

            default:
                break;
        }
    },
    "212": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.z = (rotation.z + 1) % 4;
                break;
            case "down":
                rotation.z = rotation.z === 0 ? 3 : (rotation.z - 1);
                break;

            default:
                break;
        }
    },
    "213": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.z = (rotation.z + 1) % 4;
                break;
            case "down":
                rotation.z = rotation.z === 0 ? 3 : (rotation.z - 1);
                break;

            default:
                break;
        }
    },
    "220": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = (rotation.x + 1) % 4;
                break;
            case "down":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;

            default:
                break;
        }
    },
    "221": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = (rotation.x + 1) % 4;
                break;
            case "down":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;

            default:
                break;
        }
    },
    "222": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = (rotation.x + 1) % 4;
                break;
            case "down":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;

            default:
                break;
        }
    },
    "223": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = (rotation.x + 1) % 4;
                break;
            case "down":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;

            default:
                break;
        }
    },
    "230": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.z = rotation.z === 0 ? 3 : (rotation.z - 1);
                break;
            case "down":
                rotation.z = (rotation.z + 1) % 4;
                break;

            default:
                break;
        }
    },
    "231": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.z = rotation.z === 0 ? 3 : (rotation.z - 1);
                break;
            case "down":
                rotation.z = (rotation.z + 1) % 4;
                break;

            default:
                break;
        }
    },
    "232": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.z = rotation.z === 0 ? 3 : (rotation.z - 1);
                break;
            case "down":
                rotation.z = (rotation.z + 1) % 4;
                break;

            default:
                break;
        }
    },
    "233": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.z = rotation.z === 0 ? 3 : (rotation.z - 1);
                break;
            case "down":
                rotation.z = (rotation.z + 1) % 4;
                break;

            default:
                break;
        }
    },
    "300": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;
            case "down":
                rotation.x = (rotation.x + 1) % 4;
                break;

            default:
                break;
        }
    },
    "301": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;
            case "down":
                rotation.x = (rotation.x + 1) % 4;
                break;

            default:
                break;
        }
    },
    "302": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;
            case "down":
                rotation.x = (rotation.x + 1) % 4;
                break;

            default:
                break;
        }
    },
    "303": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;
            case "down":
                rotation.x = (rotation.x + 1) % 4;
                break;

            default:
                break;
        }
    },
    "310": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = 0;
                rotation.y = 2;
                rotation.z = 3;
                break;
            case "down":
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 1;
                break;

            default:
                break;
        }
    },
    "311": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = 2;
                rotation.y = 0;
                rotation.z = 2;
                break;
            case "down":
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 2;
                break;

            default:
                break;
        }
    },
    "312": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = 0;
                rotation.y = 2;
                rotation.z = 1;
                break;
            case "down":
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 3;
                break;

            default:
                break;
        }
    },
    "313": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = 0;
                rotation.y = 2;
                rotation.z = 2;
                break;
            case "down":
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 0;
                break;

            default:
                break;
        }
    },
    "320": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = (rotation.x + 1) % 4;
                break;
            case "down":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;

            default:
                break;
        }
    },
    "321": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = (rotation.x + 1) % 4;
                break;
            case "down":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;

            default:
                break;
        }
    },
    "322": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = (rotation.x + 1) % 4;
                break;
            case "down":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;

            default:
                break;
        }
    },
    "323": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = (rotation.x + 1) % 4;
                break;
            case "down":
                rotation.x = rotation.x === 0 ? 3 : (rotation.x - 1);
                break;

            default:
                break;
        }
    },
    "330": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = 0;
                rotation.y = 2;
                rotation.z = 1;
                break;
            case "down":
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 3;
                break;

            default:
                break;
        }
    },
    "331": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = 2;
                rotation.y = 0;
                rotation.z = 0;
                break;
            case "down":
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 0;
                break;

            default:
                break;
        }
    },
    "332": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = 0;
                rotation.y = 2;
                rotation.z = 3;
                break;
            case "down":
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 1;
                break;

            default:
                break;
        }
    },
    "333": (tag: "right" | "left" | "up" | "down", rotation: Vec3) => {
        switch (tag) {
            case "right":
                rotation.y = (rotation.y + 1) % 4;
                break;
            case "left":
                rotation.y = rotation.y === 0 ? 3 : (rotation.y - 1);
                break;
            case "up":
                rotation.x = 0;
                rotation.y = 2;
                rotation.z = 0;
                break;
            case "down":
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 2;
                break;

            default:
                break;
        }
    },
}