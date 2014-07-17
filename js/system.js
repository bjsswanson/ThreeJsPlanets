var waitLoadTextures = 0;
var waitLoadModels = 0;

var clock = new THREE.Clock();
var scene = new THREE.Scene();
var jsonLoader = new THREE.JSONLoader();
var camera = createCamera();
var renderer = createRenderer();

var light = createLight();
var skyBox = createSkyBox();
var earthMesh = createEarth();
//var cloudMesh = createEarthClouds(earthMesh);

var effect = createEffect();
var oculusControl = createOculusControls();
oculusControl.connect();

var ships = [];
waitLoadModels++;

jsonLoader.load( "model/MCCV.json", createShips);
moveToEarth();

moveToSideEarth();

var globalLookAt = scene.position;

function createEffect() {
	var effect = new THREE.OculusRiftEffect( renderer, { worldScale: 1 } );
	effect.setSize( window.innerWidth, window.innerHeight );
	return effect;
}

function createOculusControls() {
	return new THREE.OculusControls( camera );
}

var loaded = false;
function load(){
	if(!loaded && textureCounter == waitLoadTextures && modelCounter == waitLoadModels){
		loaded = true;
		animate();
	}
}

function animate() {
	//requestAnimationFrame( renderer );
	requestAnimationFrame( animate );

	earthMesh.rotation.y += THREE.Math.degToRad(0.01);
	//cloudMesh.rotation.y -= THREE.Math.degToRad(0.003);

	TWEEN.update(+new Date());

	oculusControl.update( clock.getDelta() );
	effect.render( scene, camera );

	//renderer.render(scene, camera);
	//renderer.on;
}

var textureCounter = 0;
function loadTextures(){
	textureCounter++;
	console.log(waitLoadTextures + " : " + textureCounter)
	load();
}

var modelCounter = 0;
function loadModels(){
	modelCounter++;
	console.log(waitLoadModels + " : " +  modelCounter)
	load();
}

function moveToEarth() {
	$('#earth').on('click', function(){
		var target = createVector(0, 0, 0)
		//moveCamera(target);
		moveCameraOculus(target);
		moveShips(target);
	});
}

function moveToSideEarth() {
	$('#sideEarth').on('click', function(){
		var target = createVector(1000, 0, 0)
		//moveCamera(target);
		moveCameraOculus(target);
		moveShips(target);
	});
}

function moveCameraOculus(target) {

	var currLookAt = cloneVector(globalLookAt);
	var updatedLookAt = addVector(target, subVector(target, camera.position));

	var move = new TWEEN.Tween(camera.position)
		.to(target, 6000)
		.delay(6000)
		.easing(customEasing)
		.onComplete(function(){
			globalLookAt = cloneVector(updatedLookAt);
		});

	move.start(+new Date());
}

function moveCamera(target) {

	var currLookAt = cloneVector(globalLookAt);
	var updatedLookAt = addVector(target, subVector(target, camera.position));

	var rotate = new TWEEN.Tween(currLookAt)
		.to(updatedLookAt, 6000)
		.easing(TWEEN.Easing.Quadratic.InOut)
		.onUpdate(function(){
			camera.lookAt(currLookAt);
		});

	var move = new TWEEN.Tween(camera.position)
		.to(target, 6000)
		.delay(6000)
		.easing(customEasing)
		.onComplete(function(){
			globalLookAt = cloneVector(currLookAt);
		});

	rotate.chain(move);
	rotate.start(+new Date());
}

function moveShips(target) {

	var currLookAt = cloneVector(globalLookAt);

	_.each(ships, function(ship){
		var data = ship.data;
		var mesh = ship.mesh;

		var rotate = new TWEEN.Tween(currLookAt)
		.to(target, 6000)
		.easing(TWEEN.Easing.Quadratic.InOut)
		.onUpdate(function(){
			mesh.lookAt(currLookAt);
		});

		var move = new TWEEN.Tween(mesh.position)
		.to(addVector(target, data.offset), 6000)
		.delay(data.delay)
		.easing(customEasing);

		rotate.chain(move);
		rotate.start(+new Date());
	});
}

function createCamera() {
	var camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.01, 100000);
	camera.position.set( 0, 0, 10000 );
	camera.lookAt( scene.position );
	return camera;
}

function createRenderer() {
	var renderer = new THREE.WebGLRenderer({ antialiasing: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	return renderer;
}

function createLight() {
	var ambientLight = new THREE.AmbientLight( 0x888888 );
	var directionalLight = new THREE.DirectionalLight( 0xcccccc, 1 );
	directionalLight.position.set(10, 3, 5);

	scene.add( directionalLight );
	scene.add( ambientLight );
	return {
		ambientLight: ambientLight,
		directionLight: directionalLight
	};
}

function createEarth() {
	var geometry = new THREE.SphereGeometry(80, 32, 32);
	var material = new THREE.MeshPhongMaterial();
	var earthMesh = new THREE.Mesh(geometry, material);

	earthMesh.position.set(-100, 0, -250);
	earthMesh.rotation.y = THREE.Math.degToRad(180);

	material.map = initLoadTexture('images/earthmap4k.jpg');
	material.bumpMap = initLoadTexture('images/earthbump1k.jpg');
	material.bumpScale = 0.05;

	material.specularMap = initLoadTexture('images/earthspec1k.jpg');
	material.specular = new THREE.Color('grey');

	scene.add(earthMesh);
	return earthMesh;

}

function createEarthClouds( earthMesh ) {
	var geometry = new THREE.SphereGeometry(81, 32, 32);
	var material = new THREE.MeshPhongMaterial();
	var cloudMesh = new THREE.Mesh(geometry, material);

	material.map = initLoadTexture('images/fair_clouds_4k.png');
	material.transparent = 0.4;
	earthMesh.add(cloudMesh);

	return cloudMesh;
}

function createSkyBox() {
	var geometry  = new THREE.SphereGeometry(50000  , 32, 32)
	var material  = new THREE.MeshBasicMaterial()
	var mesh  = new THREE.Mesh(geometry, material)

	material.map = initLoadTexture('images/starmap8k.png');
	material.side  = THREE.BackSide;
	scene.add(mesh)

	return mesh;
}

function initLoadTexture(image){
	waitLoadTextures++;
	return THREE.ImageUtils.loadTexture(image, null, loadTextures);
}

function createShips( geometry, materials ) {
	ships.push(createShip(geometry, materials, { rotation: THREE.Math.degToRad(180), scale: 0.01, offset: createVector(-1, 1, -3), delay: 1000}));
	ships.push(createShip(geometry, materials, { rotation: THREE.Math.degToRad(180), scale: 0.01, offset: createVector(1, 0, -2), delay: 2000}));
	ships.push(createShip(geometry, materials, { rotation: THREE.Math.degToRad(180), scale: 0.01, offset: createVector(-1, -1, -4), delay: 4000}));
	loadModels();
}

function createShip( geometry, materials, data ){
	var mesh = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
	mesh.scale.set(data.scale, data.scale,data.scale);
	mesh.position = addVector(camera.position, data.offset);
	mesh.lookAt(globalLookAt);
	scene.add(mesh);

	return {
		mesh: mesh,
		data: data
	};
}

function createVector(x, y, z) {
	return new THREE.Vector3(x, y, z);
}

function addVector(one, two){
	return new THREE.Vector3(
		one.x + two.x,
		one.y + two.y,
		one.z + two.z);
}

function subVector(one, two) {
	return new THREE.Vector3(
		one.x - two.x,
		one.y - two.y,
		one.z - two.z);
}

function cloneVector(vector){
	return new THREE.Vector3(vector.x, vector.y, vector.z);
}

function customEasing(t) {

//	PowInOut(20.5)
//	if ((t *= 2) < 1) return 0.5 * Math.pow(t, 20.5);
//	return 1 - 0.5 * Math.abs(Math.pow(2 - t, 20.5));

//	PowInOut(3);
	if ((t *= 2) < 1) return 0.5 * Math.pow(t, 3);
	return 1 - 0.5 * Math.abs(Math.pow(2 - t, 3));

//	PowOut(2.5)
//	return 1 - Math.pow(1 - t, 2.5);

//  PowIn(2.5)
//	return Math.pow(t, 2.5);

//	PowOut(5)
//	return 1 - Math.pow(1 - t, 5);
}

function xyzToVector(data){
	return new THREE.Vector3(data.x, data.y, data.z);
}

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}