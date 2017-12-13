var container, scene, camera, renderer, controls, stats;
// var keyboard = new KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var building = [];
var fireball = [];
var waterball = [];
var waterball_vec = {};
var loader;
var projector, mouse = { x: 0, y: 0 };

init();
animate();

//https://jsfiddle.net/briguy37/2MVFd/
function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

// FUNCTIONS
function init()
{
    // SCENE
    scene = new THREE.Scene();
    // CAMERA
    var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    var VIEW_ANGLE = 90, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 10000;
    camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
    //camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    scene.add(camera);
    camera.position.set(0,350,500);
    camera.lookAt(scene.position);
    // RENDERER
    renderer = new THREE.WebGLRenderer( {antialias:true} );
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    container = document.getElementById( 'ThreeJS' );
    container.appendChild( renderer.domElement );

    var light = new THREE.PointLight(0xffffff);
    light.position.set(100,400,500);
    scene.add(light);
    {
        loader = new THREE.TextureLoader();
        loader.crossOrigin = 'Anonymous';
        var floorTexture = loader.load('img/soil.PNG');
        floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(1, 1);
        var floorMaterial = new THREE.MeshBasicMaterial({map: floorTexture, side: THREE.DoubleSide});
        var floorGeometry = new THREE.PlaneGeometry(1800, 1000, 10, 10);
        var floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = -50;
        floor.rotation.x = Math.PI / 2;
        scene.add(floor);
        // background
        var skyTexture = loader.load('img/sky.PNG');
        skyTexture.wrapS = skyTexture.wrapT = THREE.RepeatWrapping;
        skyTexture.repeat.set(1, 1);
        var skyBoxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
        var skyBoxMaterial = new THREE.MeshBasicMaterial({map: skyTexture, side: THREE.BackSide});
        var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
        scene.add(skyBox);
    }
    ////////////
    // CUSTOM //
    ////////////

    var buildingGeometry = new THREE.BoxGeometry( 50, 250, 50 );
    var brickTexture = loader.load('img/brick.PNG');
    brickTexture.wrapS = brickTexture.wrapT = THREE.RepeatWrapping;
    brickTexture.repeat.set(1, 1);
    var material = new THREE.MeshLambertMaterial( { map: brickTexture, side: THREE.DoubleSide});
    var spacing = 900;
    var num_of_building = 5;
    var j = 0;
    for (var i = -num_of_building/2; i <= num_of_building/2; i++) {
        var x_pos = spacing * (i / num_of_building);
        var local_building = new THREE.Mesh( buildingGeometry, material );
        local_building.position.set(x_pos,0,250);
        var id = generateUUID();
        local_building.name = id;
        building.push({name:id, val: local_building, pos:x_pos, show: true, count: 20, visible: true});
        scene.add(local_building);
    }

    var sphereGeometry = new THREE.SphereGeometry( 25, 15, 15 );
    var fireTexture = loader.load('img/fire.PNG');
    fireTexture.wrapS = fireTexture.wrapT = THREE.RepeatWrapping;
    fireTexture.repeat.set(1, 1);
    var material = new THREE.MeshLambertMaterial( { map: fireTexture, side: THREE.DoubleSide});
    j = 0;
    for (i = -num_of_building/2; i <= num_of_building/2; i++) {
        x_pos = spacing * (i / num_of_building);
        var local_fireball = new THREE.Mesh( sphereGeometry, material);
        var variation = 100 * Math.random();
        local_fireball.position.set(x_pos, 350 + variation,250);
        //local_fireball.position.set(x_pos, 450 + x_pos/4,250);
        var id = generateUUID();
        local_fireball.name = id;
        fireball.push({name:id, val: local_fireball, pos:x_pos, show: true, count: 20, visible: true});
        scene.add(local_fireball);
    }
    //projector = new THREE.Projector();
    addAudio();
    document.addEventListener('mousedown', onMouseDown, false);
}

function addAudio() {
    //Create an AudioListener and add it to the camera
    var listener = new THREE.AudioListener();
    camera.add( listener );

// create a global audio source
    var sound = new THREE.Audio( listener );

    var audioLoader = new THREE.AudioLoader();

//Load a sound and set it as the Audio object's buffer
    audioLoader.load( 'audio/loop.mp3', function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( true );
        sound.setVolume( 0.5 );
        sound.play();
    });
}

function addAudioExplode(file) {
    //Create an AudioListener and add it to the camera
    var listener = new THREE.AudioListener();
    camera.add( listener );

// create a global audio source
    var sound = new THREE.Audio( listener );

    var audioLoader = new THREE.AudioLoader();

//Load a sound and set it as the Audio object's buffer
    audioLoader.load( file, function( buffer ) {//thunder
        sound.setBuffer( buffer );
        sound.setLoop( false );
        sound.setVolume( 0.9 );
        sound.play();
    });
}

function onMouseDown(event){
    //console.log("Whoa a mouse click?");
    // Get mouse click position
    generateWater(event, 10 * Math.random());
}

function generateWater(event, count) {

        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight ) * 2 + 1;

        //https://stackoverflow.com/a/36071100
        var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
        //projector.unprojectVector( vector, camera );
        vector.unproject( camera );
        var dir = vector.sub( camera.position ).normalize();
        var distance = - camera.position.z / dir.z;
        var pos = camera.position.clone().add( dir.multiplyScalar( distance ));

        var sphereGeometry = new THREE.SphereGeometry( 5, 15, 15 );
        var waterTexture = loader.load('img/water.PNG');
        waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;
        waterTexture.repeat.set(1, 1);
        var material = new THREE.MeshLambertMaterial( { map: waterTexture, side: THREE.DoubleSide});
        j = 0;var spacing = 900;
        if(pos.x > 0){
            x_pos = spacing/2;
            var local_water = new THREE.Mesh( sphereGeometry, material);
            local_water.position.set(x_pos,125,250);
            var some_vector = new THREE.Vector2( pos.x - 900, 2* (pos.y + 100));
            var another = some_vector.normalize();
            var id = generateUUID();
            local_water.name = id;
            waterball.push({name:id, val: local_water, show: true});
            waterball_vec[id] = { x: 6 * another.x, y:3 * another.y };
            scene.add(local_water);
        }
        else{
            x_pos = -spacing/2;
            var local_water = new THREE.Mesh( sphereGeometry, material);
            local_water.position.set(x_pos,125,250);
            var some_vector = new THREE.Vector2( pos.x + 900, 2* (pos.y + 100));
            var another = some_vector.normalize();
            //console.log("Position x & y",another.x, another.y);
            var id = generateUUID();
            local_water.name = id;
            waterball.push({name:id, val: local_water, show: true});
            waterball_vec[id] = { x: 6 * another.x, y:3 * another.y };
            scene.add(local_water);
        }
    if(count > 0){
        setTimeout(function() {
            generateWater(event, --count);
        }, 50);
    }
}

function animate()
{
    for(var i in waterball){
        var ball = waterball[i];
        if(ball.show){
            ball.val.rotation.y += 0.1;
            ball.val.position.x += waterball_vec[ball.name].x;
            ball.val.position.y += waterball_vec[ball.name].y;
        }
    }

    for(var i in fireball){
        var ball = fireball[i];
        if(ball.show){
            var rand_num = Math.random();
            ball.val.rotation.y += 0.5;
            if(rand_num < 0.5)ball.val.rotation.x += rand_num;
            if(rand_num > 0.5)ball.val.rotation.z += rand_num;
            ball.val.position.y += -0.5;
        }
    }

    var ball_count = fireball.length;
    var dismiss = [];

    for(var i in fireball){
        var ball = fireball[i];
        var pos = ball.pos;
        if(ball.show){
            for(var j in building){
                var buil = building[j];
                if(buil.show && buil.pos == pos){
                    if(ball.val.position.y - (buil.val.position.y) < 150) {
                        console.log("***************HIT**************");
                        addAudioExplode('audio/explosion.mp3');
                        var obj = scene.getObjectByName(ball.name);
                        if(buil.count < 1){
                            scene.remove(obj);
                            ball.show = false;
                        }
                        setTimeout(function() {
                            obj.visible = !obj.visible;
                        }, 50);
                        ball.count--;
                        var obj2 = scene.getObjectByName(buil.name);
                        if(buil.count < 1){
                            scene.remove(obj2);
                            buil.show = false;
                        }
                        setTimeout(function() {
                            obj2.visible = !obj2.visible;
                        }, 100);
                        buil.count--;
                    }
                }
            }
        }

        if(ball.show){
            for(var j in waterball){
                var water = waterball[j];
                if(water.show){
                    if((Math.abs(ball.val.position.x - water.val.position.x) < 25) && (Math.abs(ball.val.position.y - water.val.position.y) < 25)){
                        console.log("***************HIT**************");
                        addAudioExplode('audio/thunder.mp3');
                        addFog(ball.val);
                        dismiss.push(ball.name);
                        var obj = scene.getObjectByName(ball.name);
                        scene.remove(obj);
                        ball.show = false;
                        dismiss.push(water.name);
                        var obj2 = scene.getObjectByName(water.name);
                        scene.remove(obj2);
                        water.show = false;

                    }
                }
            }
        }
    }



    requestAnimationFrame( animate );
    render();
    update();
}

function addFog(ball) {
    var sphereGeometry = new THREE.SphereGeometry( 10, 10, 10 );
    var waterTexture = loader.load('img/smoke.PNG');
    waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;
    waterTexture.repeat.set(1, 1);
    var material = new THREE.MeshLambertMaterial( { map: waterTexture, side: THREE.DoubleSide});
    var local_smoke = new THREE.Mesh( sphereGeometry, material);
    local_smoke.position.set(ball.position.x, ball.position.y, ball.position.z);
    local_smoke.transparent = true;
    var id = generateUUID();
    local_smoke.name = id;
    scene.add(local_smoke);
}

function update()
{
}

function render()
{
    renderer.render( scene, camera );
}
