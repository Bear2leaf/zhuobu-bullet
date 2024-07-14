import { mat4, vec3 } from "gl-matrix";
import Ammo, { config, Module, handler, MainMessage } from "./ammo.worker.js"
import { WorkerMessage } from "./ammo.worker.js";
import { BodyId } from "../client/device/Device.js";

handler.onmessage = function (message) {
    this.messageQueue.push(message)
}

const halfWidth = 10;
const halfHeight = 20;
const halfDepth = 1;


Ammo.bind(Module)(config).then(function (Ammo) {
    let total = 0;
    class UserData extends Ammo.btVector3 {
        propertities?: Record<string, boolean>
    }
    handler.postMessage({ type: "ready", halfDepth, halfHeight, halfWidth });
    const DISABLE_DEACTIVATION = 4;
    const CF_KINEMATIC_OBJECT = 2;
    // Bullet-interfacing code

    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    const overlappingPairCache = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();
    const dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    dynamicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));


    const bodies: Ammo.btRigidBody[] = [];
    for (let index = 0; index < 6; index++) {
        const originX = BodyId.WallRight === index ? halfWidth : (BodyId.WallLeft === index ? -halfWidth : 0);
        const originY = BodyId.WallTop === index ? halfHeight : (BodyId.WallBottom === index ? -halfHeight : 0);
        const originZ = BodyId.WallBack === index ? halfDepth : (BodyId.WallFront === index ? -halfDepth : 0);
        const rotationY = BodyId.WallLeft === index ? Math.PI / 2 : (BodyId.WallRight === index ? -Math.PI / 2 : 0);
        const rotationX = BodyId.WallTop === index ? Math.PI / 2 : (BodyId.WallBottom === index ? -Math.PI / 2 : (BodyId.WallBack === index ? Math.PI : 0));
        const mass = 0;
        const groundTransform = new Ammo.btTransform();
        groundTransform.setIdentity();
        groundTransform.setOrigin(new Ammo.btVector3(originX, originY, originZ));
        const quat = new Ammo.btQuaternion(0, 0, 0, 0);
        quat.setEulerZYX(0, rotationY, rotationX)
        groundTransform.setRotation(quat)
        const groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 0, 1), 0);
        const localInertia = new Ammo.btVector3(0, 0, 0);
        const myMotionState = new Ammo.btDefaultMotionState(groundTransform);
        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia);
        const body = new Ammo.btRigidBody(rbInfo);

        dynamicsWorld.addRigidBody(body);
        bodies.push(body);
        handler.postMessage({
            type: "addBody",
            data: index
        })
    }
    (function () {

        const startTransform = new Ammo.btTransform();
        startTransform.setIdentity();
        const mass = 1;
        const localInertia = new Ammo.btVector3(0, 0, 0);
        const sphereShape = new Ammo.btSphereShape(1);
        sphereShape.calculateLocalInertia(mass, localInertia);

        const myMotionState = new Ammo.btDefaultMotionState(startTransform);
        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, sphereShape, localInertia);
        const body = new Ammo.btRigidBody(rbInfo);
        body.setActivationState(DISABLE_DEACTIVATION);
        dynamicsWorld.addRigidBody(body);
        bodies.push(body);
        handler.postMessage({
            type: "addBody",
            data: BodyId.Ball
        })
    })();
    handler.postMessage({
        type: "requestResetLevel",
    })
    const transform = new Ammo.btTransform(); // taking this out of readBulletObject reduces the leaking

    function readBulletObject(i: number, object: number[]) {
        const body = bodies[i];
        body.getMotionState().getWorldTransform(transform);
        const origin = transform.getOrigin();
        object[0] = origin.x();
        object[1] = origin.y();
        object[2] = origin.z();
        const rotation = transform.getRotation();
        object[3] = rotation.x();
        object[4] = rotation.y();
        object[5] = rotation.z();
        object[6] = rotation.w();
        object[7] = i;
    }
    const keepLength = Object.keys(BodyId).length / 2;
    function resetWorld() {
        const remains = bodies.splice(0, keepLength);
        for (const body of bodies) {
            dynamicsWorld.removeRigidBody(body);
        }
        bodies.splice(0, bodies.length, ...remains);
        bodies[BodyId.Ball].setMotionState(new Ammo.btDefaultMotionState());
    }
    function removeSpawnBody() {

        const index = bodies.findIndex(body => {
            const props = Ammo.castObject(body.getUserPointer(), UserData).propertities;
            return props && props.spawn
        });
        const removeBody = bodies.splice(index, 1)[0];
        handler.postMessage({
            type: "removeBody",
            data: index
        })
        dynamicsWorld.removeRigidBody(removeBody);

    }
    const gravity = new Ammo.btVector3(0, 0, 0);
    let interval: number | null = null;
    const vertex0 = new Ammo.btVector3;
    const vertex1 = new Ammo.btVector3;
    const vertex2 = new Ammo.btVector3;
    let paused = true;
    function messageHandler(message: MainMessage) {
        if (message.type === "updateGravity") {
            const g = message.data.split(",").map(x => parseFloat(x));
            gravity.setX(g[0])
            gravity.setY(g[1])
            gravity.setZ(g[2])
            dynamicsWorld.setGravity(gravity);
            return;
        } else if (message.type === "addMesh") {
            paused = false;
            const startTransform = new Ammo.btTransform();
            startTransform.setIdentity();
            const mass = 0;
            const localInertia = new Ammo.btVector3(0, 0, 0);
            const mesh = new Ammo.btTriangleMesh();
            const vertices = message.data.vertices;
            const indices = message.data.indices;
            const newVertices: number[] = [];
            for (let index = 0; index < indices.length; index++) {
                const i = indices[index];
                newVertices.push(vertices[i * 3 + 0], vertices[i * 3 + 1], vertices[i * 3 + 2])
            }
            for (let i = 0; i < newVertices.length / 9; i++) {
                vertex0.setValue(newVertices[i * 9 + 0], newVertices[i * 9 + 1], newVertices[i * 9 + 2]);
                vertex1.setValue(newVertices[i * 9 + 3], newVertices[i * 9 + 4], newVertices[i * 9 + 5]);
                vertex2.setValue(newVertices[i * 9 + 6], newVertices[i * 9 + 7], newVertices[i * 9 + 8]);
                mesh.addTriangle(
                    vertex0, vertex1, vertex2
                )
            }

            const shape = new Ammo.btBvhTriangleMeshShape(mesh, true);
            const myMotionState = new Ammo.btDefaultMotionState(startTransform);
            const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, shape, localInertia);
            const body = new Ammo.btRigidBody(rbInfo);

            const v = new UserData;
            v.propertities = message.data.propertities;
            body.setUserPointer(v)
            dynamicsWorld.addRigidBody(body);
            bodies.push(body);
            total = message.data.total;
            return;
        } else if (message.type === "resetWorld") {
            paused = true;
            resetWorld();
            handler.postMessage({
                type: "requestResetLevel",
            })
            handler.postMessage({
                type: "requestLevel",
            })
        } else if (message.type === "release") {
            const collisionNum = dispatcher.getNumManifolds();
            for (let index = 0; index < collisionNum; index++) {
                // UserData
                const mainfold = dispatcher.getManifoldByIndexInternal(index);
                const body0 = mainfold.getBody0();
                const body1 = mainfold.getBody1();
                const props0 = Ammo.castObject(body0.getUserPointer(), UserData).propertities;
                const props1 = Ammo.castObject(body1.getUserPointer(), UserData).propertities;
                if (props0) {
                    if (props0.spawn) {
                        removeSpawnBody();
                    } else if (props0.destination) {
                        resetWorld()
                        handler.postMessage({
                            type: "requestResetLevel",
                        })
                        handler.postMessage({
                            type: "requestLevel",
                        })
                    }
                }
                if (props1) {
                    if (props1.spawn) {
                        removeSpawnBody();
                    } else if (props1.destination) {
                        resetWorld()
                        handler.postMessage({
                            type: "requestResetLevel",
                        })
                        handler.postMessage({
                            type: "requestLevel",
                        })
                    }
                }
            }
        }
    }

    let meanDt = 0, meanDt2 = 0, frame = 1;
    function simulate(dt: number) {
        let message = handler.messageQueue.shift();
        while (message) {
            messageHandler(message);
            message = handler.messageQueue.shift();
        }
        if (paused) {
            return;
        }
        dt = dt || 1;
        dynamicsWorld.stepSimulation(dt);

        let alpha;
        if (meanDt > 0) {
            alpha = Math.min(0.1, dt / 1000);
        } else {
            alpha = 0.1; // first run
        }
        meanDt = alpha * dt + (1 - alpha) * meanDt;

        const alpha2 = 1 / frame++;
        meanDt2 = alpha2 * dt + (1 - alpha2) * meanDt2;

        const result: WorkerMessage | { type: "update" } = { type: "update", objects: [], currFPS: Math.round(1000 / meanDt), allFPS: Math.round(1000 / meanDt2) };

        // Read bullet data into JS objects
        for (let i = 0; i < bodies.length; i++) {
            result.objects[i] = result.objects[i] || []
            readBulletObject(i, result.objects[i]);
        }

        handler.postMessage(result);

    }
    frame = 1;
    meanDt = meanDt2 = 0;


    let last = Date.now();
    function mainLoop() {
        const now = Date.now();
        // dynamicsWorld.setGravity(new Ammo.btVector3(Math.sin(now) * 10, Math.cos(now) * 10 ,0))
        simulate(now - last);
        last = now;
    }

    if (interval) clearInterval(interval);
    interval = setInterval(mainLoop, 1000 / 60);
});
