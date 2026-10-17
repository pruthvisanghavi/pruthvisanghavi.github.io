import * as THREE from 'three';

var stage = document.getElementById('quadStage');
if (stage) {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ROBOT_PX = 120;
  var MIN_GUTTER = ROBOT_PX + 60;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.0, 6.0);

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  stage.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 1.2));
  var key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 5);
  scene.add(key);
  var rim = new THREE.DirectionalLight(0xffffff, 0.6);
  rim.position.set(-4, 2, -4);
  scene.add(rim);
  var fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(0, -2, 3);
  scene.add(fill);

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  var chassisMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, metalness: 0.55, roughness: 0.35 });
  var jointMat = new THREE.MeshStandardMaterial({ color: 0x2e2e31, metalness: 0.4, roughness: 0.5 });
  var footMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, metalness: 0.2, roughness: 0.7 });
  var accentMat = new THREE.MeshStandardMaterial({ color: cssVar('--accent', '#FF8160'), emissive: cssVar('--accent', '#FF8160'), emissiveIntensity: 0.55, metalness: 0.3, roughness: 0.3 });
  var lensMat = new THREE.MeshStandardMaterial({ color: 0x060606, metalness: 0.9, roughness: 0.08 });

  function syncTheme() {
    var accent = cssVar('--accent', '#FF8160');
    accentMat.color.set(accent);
    accentMat.emissive.set(accent);
  }

  var walker = new THREE.Group();
  walker.scale.setScalar(0.24);
  scene.add(walker);

  var body = new THREE.Group();
  walker.add(body);

  var torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.78, 4, 12), chassisMat);
  torso.rotation.z = Math.PI / 2;
  torso.position.y = 0.52;
  body.add(torso);

  var spineStripe = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.03, 0.08), accentMat);
  spineStripe.position.set(0, 0.68, 0);
  body.add(spineStripe);

  var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.14, 10), jointMat);
  neck.rotation.z = Math.PI / 2.6;
  neck.position.set(0.46, 0.46, 0);
  body.add(neck);

  var headPivot = new THREE.Group();
  headPivot.position.set(0.58, 0.5, 0);
  body.add(headPivot);

  var head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.22), chassisMat);
  head.position.set(0.08, 0, 0);
  headPivot.add(head);

  var lensL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), lensMat);
  lensL.position.set(0.2, 0.01, 0.07);
  headPivot.add(lensL);
  var lensR = lensL.clone();
  lensR.position.z = -0.07;
  headPivot.add(lensR);

  var visor = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.035, 0.2), accentMat);
  visor.position.set(0.08, 0.075, 0);
  headPivot.add(visor);

  // --- legs: hip (shoulder swing) -> thigh -> knee -> shin -> foot ---
  var LEG_SPECS = [
    { name: 'FL', x: 0.33, z: 0.15, side: 1 },
    { name: 'FR', x: 0.33, z: -0.15, side: -1 },
    { name: 'BL', x: -0.33, z: 0.15, side: 1 },
    { name: 'BR', x: -0.33, z: -0.15, side: -1 },
  ];
  var legs = LEG_SPECS.map(function (spec) {
    var hip = new THREE.Group();
    hip.position.set(spec.x, 0.42, spec.z);
    body.add(hip);

    var hipBlock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), jointMat);
    hip.add(hipBlock);

    var thighPivot = new THREE.Group();
    hip.add(thighPivot);
    var thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.32, 8), chassisMat);
    thigh.position.y = -0.16;
    thighPivot.add(thigh);

    var kneePivot = new THREE.Group();
    kneePivot.position.y = -0.32;
    thighPivot.add(kneePivot);
    var shin = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.022, 0.32, 8), jointMat);
    shin.position.y = -0.16;
    kneePivot.add(shin);

    var foot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), footMat);
    foot.position.y = -0.33;
    kneePivot.add(foot);

    thighPivot.rotation.z = spec.x > 0 ? 0.08 : -0.08;
    kneePivot.rotation.z = spec.x > 0 ? -0.22 : 0.22;

    return { hip: thighPivot, knee: kneePivot, spec: spec };
  });

  var mouseX = 0, mouseY = 0, mousePxX = window.innerWidth / 2, mousePxY = window.innerHeight / 2;
  window.addEventListener('mousemove', function (e) {
    mousePxX = e.clientX; mousePxY = e.clientY;
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // --- find the empty side gutter to patrol in ---
  var laneSide = null;
  var laneCenterPx = 0;
  var laneTopPx = 90, laneBottomPx = window.innerHeight - 50;

  function recomputeLane() {
    var wraps = document.querySelectorAll('.wrap');
    var contentLeft = Infinity, contentRight = -Infinity;
    wraps.forEach(function (w) {
      var r = w.getBoundingClientRect();
      if (r.width === 0) return;
      contentLeft = Math.min(contentLeft, r.left);
      contentRight = Math.max(contentRight, r.right);
    });
    if (!isFinite(contentLeft)) { laneSide = null; return; }

    var margin = 24;
    var rightGutter = window.innerWidth - contentRight;
    var leftGutter = contentLeft;

    if (rightGutter >= MIN_GUTTER) {
      laneSide = 'right';
      laneCenterPx = contentRight + margin + (rightGutter - margin - ROBOT_PX / 2) / 2;
    } else if (leftGutter >= MIN_GUTTER) {
      laneSide = 'left';
      laneCenterPx = (leftGutter - margin - ROBOT_PX / 2) / 2;
    } else {
      laneSide = null;
    }
    laneTopPx = 90;
    laneBottomPx = window.innerHeight - 50;
  }

  function pxToWorld(px, py, out) {
    var ndcX = (px / window.innerWidth) * 2 - 1;
    var ndcY = -(py / window.innerHeight) * 2 + 1;
    var vector = new THREE.Vector3(ndcX, ndcY, 0.5);
    vector.unproject(camera);
    var dir = vector.sub(camera.position).normalize();
    var dist = (0 - camera.position.z) / dir.z;
    out.copy(camera.position).add(dir.multiplyScalar(dist));
    return out;
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var themeObserver = new MutationObserver(syncTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    recomputeLane();
  }
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('scroll', recomputeLane, { passive: true });

  var ro = new ResizeObserver(recomputeLane);
  document.querySelectorAll('.wrap').forEach(function (w) { ro.observe(w); });

  recomputeLane();

  // --- patrol state: walk up/down the lane, trot gait, lean into travel direction ---
  var patrolY = (laneTopPx + laneBottomPx) / 2;
  var travelDir = 1;
  var WALK_SPEED_PX = 26; // px/sec
  var gaitPhase = 0;

  var targetWorld = new THREE.Vector3();
  var curWorldX = 0, curWorldY = 0;

  var BODY_MAX_YAW = 0.18;
  var HEAD_MAX_YAW = 0.5;
  var HEAD_MAX_PITCH = 0.28;
  var curBodyYaw = 0, curHeadYaw = 0, curHeadPitch = 0, curLean = 0;

  var clock = new THREE.Clock();
  var lastLaneCheck = 0;
  var prevT = 0;

  function animate() {
    var t = clock.getElapsedTime();
    var dt = Math.min(0.05, t - prevT || 0);
    prevT = t;

    if (t - lastLaneCheck > 0.5) { recomputeLane(); lastLaneCheck = t; }

    if (laneSide === null) {
      if (stage.classList.contains('is-visible')) stage.classList.remove('is-visible');
      renderer.render(scene, camera);
      return;
    }
    if (!stage.classList.contains('is-visible')) stage.classList.add('is-visible');

    if (!reduceMotion) {
      patrolY += travelDir * WALK_SPEED_PX * dt;
      if (patrolY > laneBottomPx) { patrolY = laneBottomPx; travelDir = -1; }
      if (patrolY < laneTopPx) { patrolY = laneTopPx; travelDir = 1; }
      gaitPhase += dt * 6.4;
    }

    pxToWorld(laneCenterPx, patrolY, targetWorld);
    curWorldX = lerp(curWorldX, targetWorld.x, reduceMotion ? 1 : 0.15);
    curWorldY = lerp(curWorldY, targetWorld.y, reduceMotion ? 1 : 0.15);
    walker.position.x = curWorldX;
    walker.position.z = targetWorld.z;
    walker.position.y = curWorldY + (reduceMotion ? 0 : Math.sin(gaitPhase * 2) * 0.012);

    var faceOut = laneSide === 'right' ? 1 : -1;

    if (!reduceMotion) {
      legs.forEach(function (leg, i) {
        var pairOffset = (i === 0 || i === 3) ? 0 : Math.PI;
        var swing = Math.sin(gaitPhase + pairOffset);
        leg.hip.rotation.z = (leg.spec.x > 0 ? 0.08 : -0.08) + swing * 0.3 * travelDir;
        var lift = Math.max(0, -swing * travelDir);
        leg.knee.rotation.z = (leg.spec.x > 0 ? -0.22 : 0.22) - lift * 0.35;
      });
    }

    curLean = lerp(curLean, travelDir * 0.07, reduceMotion ? 1 : 0.08);
    body.rotation.x = curLean;

    var localMouseX = clamp((mousePxX - laneCenterPx) / 260, -1, 1);
    var localMouseY = clamp((mousePxY - patrolY) / 260, -1, 1);

    var targetBodyYaw = faceOut * Math.PI * 0.09 + clamp(localMouseX * BODY_MAX_YAW, -BODY_MAX_YAW, BODY_MAX_YAW);
    var targetHeadYaw = clamp(localMouseX * HEAD_MAX_YAW, -HEAD_MAX_YAW, HEAD_MAX_YAW);
    var targetHeadPitch = clamp(-localMouseY * HEAD_MAX_PITCH, -HEAD_MAX_PITCH, HEAD_MAX_PITCH);

    var ease = reduceMotion ? 1 : 0.07;
    curBodyYaw = lerp(curBodyYaw, targetBodyYaw, ease);
    curHeadYaw = lerp(curHeadYaw, targetHeadYaw, ease);
    curHeadPitch = lerp(curHeadPitch, targetHeadPitch, ease);

    walker.rotation.y = curBodyYaw;
    headPivot.rotation.y = curHeadYaw;
    headPivot.rotation.x = curHeadPitch;

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
}
