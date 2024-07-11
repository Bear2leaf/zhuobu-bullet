import Ammo, { config, Module, handler } from "./ammo.worker.js"



Ammo.bind(Module)(config).then(function (Ammo) {
    var NUM = 0, NUMRANGE: number[] = [];

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
        groundTransform.setOrigin(new Ammo.btVector3(0, -20, 0));
        var groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 1, 0), 0);
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
        groundTransform.setOrigin(new Ammo.btVector3(0, 20, 0));
        var groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, -1, 0), 0);
        var localInertia = new Ammo.btVector3(0, 0, 0);
        var myMotionState = new Ammo.btDefaultMotionState(groundTransform);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia);
        var body = new Ammo.btRigidBody(rbInfo);

        dynamicsWorld.addRigidBody(body);
    })();
    (function () {
        var mass = 0;
        var groundTransform = new Ammo.btTransform();
        groundTransform.setIdentity();
        groundTransform.setOrigin(new Ammo.btVector3(-10, 0, 0));
        var groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(1, 0, 0), 0);
        var localInertia = new Ammo.btVector3(0, 0, 0);
        var myMotionState = new Ammo.btDefaultMotionState(groundTransform);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia);
        var body = new Ammo.btRigidBody(rbInfo);

        dynamicsWorld.addRigidBody(body);
    })();
    (function () {
        var mass = 0;
        var groundTransform = new Ammo.btTransform();
        groundTransform.setIdentity();
        groundTransform.setOrigin(new Ammo.btVector3(10, 0, 0));
        var groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(-1, 0, 0), 0);
        var localInertia = new Ammo.btVector3(0, 0, 0);
        var myMotionState = new Ammo.btDefaultMotionState(groundTransform);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia);
        var body = new Ammo.btRigidBody(rbInfo);

        dynamicsWorld.addRigidBody(body);
    })();
    (function () {
        var mass = 0;
        var groundTransform = new Ammo.btTransform();
        groundTransform.setIdentity();
        groundTransform.setOrigin(new Ammo.btVector3(0, 0, 1));
        var groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 0, -1), 0);
        var localInertia = new Ammo.btVector3(0, 0, 0);
        var myMotionState = new Ammo.btDefaultMotionState(groundTransform);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia);
        var body = new Ammo.btRigidBody(rbInfo);

        dynamicsWorld.addRigidBody(body);
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
    })();


    var sphereShape = new Ammo.btSphereShape(1);

    function resetPositions() {
        console.log(NUM, NUMRANGE)
        for (var x = 1; x <= 10; x++) {
            var body = bodies[x];
            var origin = body.getWorldTransform().getOrigin();
            origin.setX(10 * (Math.random() * 2 - 1));
            origin.setY((4 + Math.random()));
            body.activate();
        }
    }

    var constraint: Ammo.btHingeConstraint;
    function startUp() {
        NUMRANGE.forEach(function (i) {
            if (i === 12) {
                (function () {
                    var mass = 10;
                    var paddleTransform = new Ammo.btTransform();
                    paddleTransform.setIdentity();
                    paddleTransform.setOrigin(new Ammo.btVector3(0, 0, 0));
                    var paddleShape = new Ammo.btBoxShape(new Ammo.btVector3(5, 1, 1));
                    var localInertia = new Ammo.btVector3(0, 0, 0);
                    paddleShape.calculateLocalInertia(mass, localInertia);
                    var myMotionState = new Ammo.btDefaultMotionState(paddleTransform);
                    var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, paddleShape, localInertia);
                    var body = new Ammo.btRigidBody(rbInfo);

                    const axisA = new Ammo.btVector3(0, 0, 1);
                    const axisB = new Ammo.btVector3(0, 0, 1);
                    const pivotA = new Ammo.btVector3(6, 0, 0);
                    const pivotB = new Ammo.btVector3(-2, 0, 0);
                    constraint = new Ammo.btHingeConstraint(body, bodies[11], pivotA, pivotB, axisA, axisB);
                    constraint.setLimit(Math.PI * 1.5, Math.PI * 2, 0.5, 0.5);
                    dynamicsWorld.addConstraint(constraint);
                    dynamicsWorld.addRigidBody(body);
                    bodies.push(body);
                })();
            } else if (i === 11) {
                (function () {
                    var mass = 0;
                    var paddleTransform = new Ammo.btTransform();
                    paddleTransform.setIdentity();
                    paddleTransform.setOrigin(new Ammo.btVector3(5, 0, 0));
                    var paddleShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1));
                    var localInertia = new Ammo.btVector3(0, 0, 0);
                    var myMotionState = new Ammo.btDefaultMotionState(paddleTransform);
                    var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, paddleShape, localInertia);
                    var body = new Ammo.btRigidBody(rbInfo);
                    dynamicsWorld.addRigidBody(body);
                    bodies.push(body);
                })();
            } else {
                var startTransform = new Ammo.btTransform();
                startTransform.setIdentity();
                var mass = 1;
                var localInertia = new Ammo.btVector3(0, 0, 0);
                sphereShape.calculateLocalInertia(mass, localInertia);

                var myMotionState = new Ammo.btDefaultMotionState(startTransform);
                var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, sphereShape, localInertia);
                var body = new Ammo.btRigidBody(rbInfo);

                dynamicsWorld.addRigidBody(body);
                bodies.push(body);
            }
        });

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
    }

    var nextTimeToRestart = 0;
    var nextTimeToJump = 0;
    function timeToRestart() { // restart if at least one is inactive - the scene is starting to get boring
        if (nextTimeToRestart) {
            if (Date.now() >= nextTimeToRestart) {
                nextTimeToRestart = 0;
                return true;
            }
            return false;
        }
        for (var i = 1; i <= NUM; i++) {
            var body = bodies[i];
            if (!body.isActive()) {
                nextTimeToRestart = Date.now() + 1000; // add another second after first is inactive
                break;
            }
        }
        return false;
    }
    function timeToJump() { // restart if at least one is inactive - the scene is starting to get boring
        if (nextTimeToJump) {
            if (Date.now() >= nextTimeToJump) {
                nextTimeToJump = 0;
                return true;
            }
            return false;
        }
        nextTimeToJump = Date.now() + 200; // add another second after first is inactive

        return false;
    }
    function jump() {
        const idx = Math.min(Math.max(1, Math.floor(Math.random() * NUM)), 10);
        bodies[idx].applyCentralImpulse(new Ammo.btVector3(0, 10, 0));
    }
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

        var data: {
            objects: number[][],
            currFPS: number,
            allFPS: number
        } = { objects: [], currFPS: Math.round(1000 / meanDt), allFPS: Math.round(1000 / meanDt2) };

        // Read bullet data into JS objects
        for (var i = 0; i < NUM; i++) {
            var object: number[] = [];
            readBulletObject(i + 1, object);
            data.objects[i] = object;
        }

        handler.postMessage(data);

        if (timeToRestart()) {
            // resetPositions();
            // constraint.enableAngularMotor(true, Math.PI * 0.5, Math.PI);
            bodies[12].applyImpulse(new Ammo.btVector3(100, 500, 0), new Ammo.btVector3(5, 0, 0))
            bodies[12].activate();
        }
        if (timeToJump()) jump();
    }

    var interval: number | null = null;
    handler.onmessage = function (data) {
        NUM = data;
        NUMRANGE.length = 0;
        while (NUMRANGE.length < NUM) NUMRANGE.push(NUMRANGE.length + 1);

        frame = 1;
        meanDt = meanDt2 = 0;

        startUp();

        var last = Date.now();
        function mainLoop() {
            var now = Date.now();
            // dynamicsWorld.setGravity(new Ammo.btVector3(Math.sin(now) * 10, Math.cos(now) * 10 ,0))
            simulate(now - last);
            last = now;
        }

        if (interval) clearInterval(interval);
        interval = setInterval(mainLoop, 1000 / 60);
    }
    handler.postMessage({ isReady: true });
});
