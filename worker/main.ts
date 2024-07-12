import { mat4, vec3 } from "gl-matrix";
import Ammo, { config, Module, handler } from "./ammo.worker.js"
import { WorkerMessage } from "./ammo.worker.js";
import { BodyId } from "../client/device/Device.js";



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
        groundTransform.setOrigin(new Ammo.btVector3(0, 20, 0));
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
        groundTransform.setOrigin(new Ammo.btVector3(0, -20, 0));
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
        groundTransform.setOrigin(new Ammo.btVector3(-10, 0, 0));
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
        groundTransform.setOrigin(new Ammo.btVector3(10, 0, 0));
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
        groundTransform.setOrigin(new Ammo.btVector3(0, 0, -1));
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
        groundTransform.setOrigin(new Ammo.btVector3(0, 0, 1));
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



    function resetPositions() {
        for (var x = 0; x <= bodies.length; x++) {
            var body = bodies[x];
            var origin = body.getWorldTransform().getOrigin();
            origin.setX(10 * (Math.random() * 2 - 1));
            origin.setY((4 + Math.random()));
            body.activate();
        }
    }
    function startUp(i: BodyId) {
        // if (i === 12) {
        //     (function () {
        //         var mass = 0;
        //         var paddleTransform = new Ammo.btTransform();
        //         paddleTransform.setIdentity();
        //         paddleTransform.setOrigin(new Ammo.btVector3(0, 0, 0));
        //         var paddleShape = new Ammo.btBoxShape(new Ammo.btVector3(5, 1, 1));
        //         var localInertia = new Ammo.btVector3(0, 0, 0);
        //         paddleShape.calculateLocalInertia(mass, localInertia);
        //         var myMotionState = new Ammo.btDefaultMotionState(paddleTransform);
        //         var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, paddleShape, localInertia);
        //         var body = new Ammo.btRigidBody(rbInfo);
        //         body.setCollisionFlags(body.getCollisionFlags() | CF_KINEMATIC_OBJECT)
        //         body.setActivationState(DISABLE_DEACTIVATION);
        //         dynamicsWorld.addRigidBody(body);
        //         bodies.push(body);
        //     })();
        // } else if (i === 11) {
        //     (function () {
        //         var mass = 0;
        //         var paddleTransform = new Ammo.btTransform();
        //         paddleTransform.setIdentity();
        //         paddleTransform.setOrigin(new Ammo.btVector3(6, 0, 0));
        //         var paddleShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1));
        //         var localInertia = new Ammo.btVector3(0, 0, 0);
        //         var myMotionState = new Ammo.btDefaultMotionState(paddleTransform);
        //         var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, paddleShape, localInertia);
        //         var body = new Ammo.btRigidBody(rbInfo);
        //         dynamicsWorld.addRigidBody(body);
        //         bodies.push(body);
        //     })();
        // } else {
        // }

        resetPositions();
    }

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

    const matrix = mat4.create();
    var meanDt = 0, meanDt2 = 0, frame = 1;
    function simulate(dt: number) {
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

        var message: WorkerMessage | { type: "update" } = { type: "update", objects: [], currFPS: Math.round(1000 / meanDt), allFPS: Math.round(1000 / meanDt2) };

        // Read bullet data into JS objects
        for (var i = 0; i < bodies.length; i++) {
            var object: (WorkerMessage & { type: "update" })["objects"]["0"] = [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
            ];
            readBulletObject(i, object);
            message.objects[i] = object;
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
        handler.postMessage(message);
    }
    var gravity = new Ammo.btVector3(0, 0, 0);
    var interval: number | null = null;
    handler.onmessage = function (message) {
        if (message.type === "updateGravity") {
            const g = message.data.split(",").map(x => parseFloat(x));
            gravity.setX(g[0])
            gravity.setY(g[1])
            gravity.setZ(g[2])
            dynamicsWorld.setGravity(gravity);
            return;
        } else if (message.type === "init") {

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
            handler.postMessage({ type: "ready" });
        }
    }
});
