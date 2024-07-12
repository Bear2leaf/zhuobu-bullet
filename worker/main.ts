import { mat4, vec3 } from "gl-matrix";
import Ammo, { config, Module, handler, MainMessage } from "./ammo.worker.js"
import { WorkerMessage } from "./ammo.worker.js";

handler.onmessage = function (message) {
    this.messageQueue.push(message)
}

const halfWidth = 10;
const halfHeight = 20;
const halfDepth = 1;

Ammo.bind(Module)(config).then(function (Ammo) {

    const DISABLE_DEACTIVATION = 4;
    const CF_KINEMATIC_OBJECT = 2;
    // Bullet-interfacing code

    var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    var overlappingPairCache = new Ammo.btDbvtBroadphase();
    var solver = new Ammo.btSequentialImpulseConstraintSolver();
    var dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    dynamicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));


    var bodies: Ammo.btRigidBody[] = [];

    (function () {
        var mass = 0;
        var groundTransform = new Ammo.btTransform();
        groundTransform.setIdentity();
        groundTransform.setOrigin(new Ammo.btVector3(0, halfHeight, 0));
        const quat = new Ammo.btQuaternion(0, 0, 0, 0);
        quat.setEulerZYX(0, 0, Math.PI / 2)
        groundTransform.setRotation(quat)
        var groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 0, 1), 0);
        var localInertia = new Ammo.btVector3(0, 0, 0);
        var myMotionState = new Ammo.btDefaultMotionState(groundTransform);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia);
        var body = new Ammo.btRigidBody(rbInfo);

        dynamicsWorld.addRigidBody(body);
        bodies.push(body);
    })();
    (function () {
        var mass = 0;
        var groundTransform = new Ammo.btTransform();
        groundTransform.setIdentity();
        groundTransform.setOrigin(new Ammo.btVector3(0, -halfHeight, 0));
        const quat = new Ammo.btQuaternion(0, 0, 0, 0);
        quat.setEulerZYX(0, 0, -Math.PI / 2)
        groundTransform.setRotation(quat)
        var groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 0, 1), 0);
        var localInertia = new Ammo.btVector3(0, 0, 0);
        var myMotionState = new Ammo.btDefaultMotionState(groundTransform);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia);
        var body = new Ammo.btRigidBody(rbInfo);

        dynamicsWorld.addRigidBody(body);
        bodies.push(body);
    })();
    (function () {
        var mass = 0;
        var groundTransform = new Ammo.btTransform();
        groundTransform.setIdentity();
        groundTransform.setOrigin(new Ammo.btVector3(-halfWidth, 0, 0));
        const quat = new Ammo.btQuaternion(0, 0, 0, 0);
        quat.setEulerZYX(0, Math.PI / 2, 0)
        groundTransform.setRotation(quat)
        var groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 0, 1), 0);
        var localInertia = new Ammo.btVector3(0, 0, 0);
        var myMotionState = new Ammo.btDefaultMotionState(groundTransform);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia);
        var body = new Ammo.btRigidBody(rbInfo);

        dynamicsWorld.addRigidBody(body);
        bodies.push(body);
    })();
    (function () {
        var mass = 0;
        var groundTransform = new Ammo.btTransform();
        groundTransform.setIdentity();
        groundTransform.setOrigin(new Ammo.btVector3(halfWidth, 0, 0));
        const quat = new Ammo.btQuaternion(0, 0, 0, 0);
        quat.setEulerZYX(0, -Math.PI / 2, 0)
        groundTransform.setRotation(quat)
        var groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 0, 1), 0);
        var localInertia = new Ammo.btVector3(0, 0, 0);
        var myMotionState = new Ammo.btDefaultMotionState(groundTransform);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia);
        var body = new Ammo.btRigidBody(rbInfo);

        dynamicsWorld.addRigidBody(body);
        bodies.push(body);
    })();
    (function () {
        var mass = 0;
        var groundTransform = new Ammo.btTransform();
        groundTransform.setIdentity();
        groundTransform.setOrigin(new Ammo.btVector3(0, 0, -halfDepth));
        var groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 0, 1), 0);
        var localInertia = new Ammo.btVector3(0, 0, 0);
        var myMotionState = new Ammo.btDefaultMotionState(groundTransform);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia);
        var body = new Ammo.btRigidBody(rbInfo);

        dynamicsWorld.addRigidBody(body);
        bodies.push(body);
    })();
    (function () {
        var mass = 0;
        var groundTransform = new Ammo.btTransform();
        groundTransform.setIdentity();
        groundTransform.setOrigin(new Ammo.btVector3(0, 0, halfDepth));
        const quat = new Ammo.btQuaternion(0, 0, 0, 0);
        quat.setEulerZYX(0, 0, Math.PI)
        groundTransform.setRotation(quat)
        var groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 0, 1), 0);
        var localInertia = new Ammo.btVector3(0, 0, 0);
        var myMotionState = new Ammo.btDefaultMotionState(groundTransform);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia);
        var body = new Ammo.btRigidBody(rbInfo);

        dynamicsWorld.addRigidBody(body);
        bodies.push(body);
    })();
    (function () {

        var startTransform = new Ammo.btTransform();
        startTransform.setIdentity();
        var mass = 1;
        var localInertia = new Ammo.btVector3(0, 0, 0);
        var sphereShape = new Ammo.btSphereShape(1);
        sphereShape.calculateLocalInertia(mass, localInertia);

        var myMotionState = new Ammo.btDefaultMotionState(startTransform);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, sphereShape, localInertia);
        var body = new Ammo.btRigidBody(rbInfo);
        body.setActivationState(DISABLE_DEACTIVATION);
        dynamicsWorld.addRigidBody(body);
        bodies.push(body);
    })();


    var transform = new Ammo.btTransform(); // taking this out of readBulletObject reduces the leaking

    function readBulletObject(i: number, object: number[]) {
        var body = bodies[i];
        body.getMotionState().getWorldTransform(transform);
        var origin = transform.getOrigin();
        object[0] = origin.x();
        object[1] = origin.y();
        object[2] = origin.z();
        var rotation = transform.getRotation();
        object[3] = rotation.x();
        object[4] = rotation.y();
        object[5] = rotation.z();
        object[6] = rotation.w();
        object[7] = i;
    }

    var gravity = new Ammo.btVector3(0, 0, 0);
    var interval: number | null = null;
    function messageHandler(message: MainMessage) {
        if (message.type === "updateGravity") {
            const g = message.data.split(",").map(x => parseFloat(x));
            gravity.setX(g[0])
            gravity.setY(g[1])
            gravity.setZ(g[2])
            dynamicsWorld.setGravity(gravity);
            return;
        }
    }
    const matrix = mat4.create();
    var meanDt = 0, meanDt2 = 0, frame = 1;
    function simulate(dt: number) {
        let message = handler.messageQueue.pop();
        while (message) {
            messageHandler(message);
            message = handler.messageQueue.pop();
        }
        dt = dt || 1;
        dynamicsWorld.stepSimulation(dt, 2);

        var alpha;
        if (meanDt > 0) {
            alpha = Math.min(0.1, dt / 1000);
        } else {
            alpha = 0.1; // first run
        }
        meanDt = alpha * dt + (1 - alpha) * meanDt;

        var alpha2 = 1 / frame++;
        meanDt2 = alpha2 * dt + (1 - alpha2) * meanDt2;

        var result: WorkerMessage | { type: "update" } = { type: "update", objects: [], currFPS: Math.round(1000 / meanDt), allFPS: Math.round(1000 / meanDt2) };

        // Read bullet data into JS objects
        for (var i = 0; i < bodies.length; i++) {
            var object: (WorkerMessage & { type: "update" })["objects"]["0"] = new Array(8);
            readBulletObject(i, object);
            result.objects[i] = object;
        }

        // const mState = bodies[12].getMotionState();
        // mat4.identity(matrix);
        // mat4.translate(matrix, matrix, vec3.fromValues(5, 0, 0));
        // const angle = Math.sin(((frame * 4) % 120) / 60 * Math.PI) * Math.PI * 0.25;

        // mat4.rotateZ(matrix, matrix, angle);
        // mat4.translate(matrix, matrix, vec3.fromValues(-5, 0, 0));
        // transform.setFromOpenGLMatrix([...matrix]);
        // mState.setWorldTransform(transform);
        // bodies[12].setMotionState(mState)
        handler.postMessage(result);
        
    }

    frame = 1;
    meanDt = meanDt2 = 0;


    var last = Date.now();
    function mainLoop() {
        var now = Date.now();
        // dynamicsWorld.setGravity(new Ammo.btVector3(Math.sin(now) * 10, Math.cos(now) * 10 ,0))
        simulate(now - last);
        last = now;
    }

    if (interval) clearInterval(interval);
    interval = setInterval(mainLoop, 1000 / 60);
    handler.postMessage({ type: "ready", halfDepth, halfHeight, halfWidth });
});
