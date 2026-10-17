import * as THREE from 'three';

var stage = document.getElementById('quadStage');
if (stage) {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ROBOT_PX = 100;        // on-screen footprint (diameter) the robot needs clear of content
  var MIN_GUTTER = ROBOT_PX + 60;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.0, 5.2);

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  stage.appendChild(renderer.domElement);

  var hemi = new THREE.HemisphereLight(0xffffff, 0x202020, 1.1);
  scene.add(hemi);
  var key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 4, 4);
  scene.add(key);
  var rim = new THREE.DirectionalLight(0xffffff, 0.5);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  var bodyMat = new THREE.MeshStandardMaterial({ color: cssVar('--ink', '#F5F4F0'), metalness: 0.4, roughness: 0.45 });
  var jointMat = new THREE.MeshStandardMaterial({ color: cssVar('--muted', '#9C9B95'), metalness: 0.3, roughness: 0.6 });
  var accentMat = new THREE.MeshStandardMaterial({ color: cssVar('--accent', '#FF8160'), emissive: cssVar('--accent', '#FF8160'), emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.3 });
  var lensMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.8, roughness: 0.15 });

  function syncTheme() {
    bodyMat.color.set(cssVar('--ink', '#F5F4F0'));
    jointMat.color.set(cssVar('--muted', '#9C9B95'));
    var accent = cssVar('--accent', '#FF8160');
    accentMat.color.set(accent);
    accentMat.emissive.set(accent);
  }

  var robot = new THREE.Group();
  robot.scale.setScalar(0.16);
  scene.add(robot);

  var body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.46, 0.78), bodyMat);
  body.position.y = 0.55;
  robot.add(body);

  var spine = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.5), jointMat);
  spine.position.set(0, 0.32, 0);
  robot.add(spine);

  function makeLeg(x, z) {
    var leg = new THREE.Group();
    leg.position.set(x, 0.42, z);

    var upper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.42, 10), jointMat);
    upper.position.y = -0.21;
    upper.rotation.z = x > 0 ? 0.12 : -0.12;
    leg.add(upper);

    var lower = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.4, 10), jointMat);
    lower.position.set(x > 0 ? 0.05 : -0.05, -0.58, 0);
    lower.rotation.z = x > 0 ? -0.22 : 0.22;
    leg.add(lower);

    var foot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), bodyMat);
    foot.position.set(x > 0 ? 0.09 : -0.09, -0.78, 0);
    leg.add(foot);

    robot.add(leg);
    return leg;
  }
  makeLeg(0.58, 0.28);
  makeLeg(-0.58, 0.28);
  makeLeg(0.58, -0.28);
  makeLeg(-0.58, -0.28);

  var headPivot = new THREE.Group();
  headPivot.position.set(0.82, 0.68, 0);
  robot.add(headPivot);

  var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.18, 10), jointMat);
  neck.rotation.z = Math.PI / 2;
  neck.position.set(-0.08, 0, 0);
  headPivot.add(neck);

  var head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.34), bodyMat);
  head.position.set(0.18, 0.02, 0);
  headPivot.add(head);

  var lens = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16), lensMat);
  lens.rotation.z = Math.PI / 2;
  lens.position.set(0.4, 0.02, 0);
  headPivot.add(lens);

  var sensorBand = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.36), accentMat);
  sensorBand.position.set(0.18, 0.15, 0);
  headPivot.add(sensorBand);

  var mouseX = 0, mouseY = 0, mousePxX = window.innerWidth / 2, mousePxY = window.innerHeight / 2;
  window.addEventListener('mousemove', function (e) {
    mousePxX = e.clientX; mousePxY = e.clientY;
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // --- find the empty side gutters (left/right of the centered .wrap content) ---
  var laneSide = 'right';   // 'right' | 'left' | null (null = no room anywhere)
  var laneCenterPx = 0;     // x in CSS px of the lane's horizontal center
  var laneTopPx = 80, laneBottomPx = window.innerHeight - 40;

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

  var targetWorld = new THREE.Vector3();
  var curWorldX = 0, curWorldY = 0;
  var wanderY = window.innerHeight * 0.4;
  var wanderDir = 1;

  var BODY_MAX_YAW = 0.22;
  var BODY_MAX_TILT = 0.08;
  var HEAD_MAX_YAW = 0.55;
  var HEAD_MAX_PITCH = 0.3;
  var curBodyYaw = 0, curBodyTilt = 0, curHeadYaw = 0, curHeadPitch = 0;

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

  var clock = new THREE.Clock();
  var lastLaneCheck = 0;

  function animate() {
    var t = clock.getElapsedTime();

    if (t - lastLaneCheck > 0.5) { recomputeLane(); lastLaneCheck = t; }

    if (laneSide === null) {
      if (stage.classList.contains('is-visible')) stage.classList.remove('is-visible');
    } else {
      if (!stage.classList.contains('is-visible')) stage.classList.add('is-visible');

      if (!reduceMotion) {
        wanderY += wanderDir * 14 * (1 / 60);
        if (wanderY > laneBottomPx) { wanderY = laneBottomPx; wanderDir = -1; }
        if (wanderY < laneTopPx) { wanderY = laneTopPx; wanderDir = 1; }
      }

      pxToWorld(laneCenterPx, wanderY, targetWorld);
      curWorldX = lerp(curWorldX, targetWorld.x, reduceMotion ? 1 : 0.04);
      curWorldY = lerp(curWorldY, targetWorld.y, reduceMotion ? 1 : 0.04);
      robot.position.x = curWorldX;
      robot.position.z = targetWorld.z;

      var baseY = curWorldY;
      robot.position.y = baseY + (reduceMotion ? 0 : Math.sin(t * 1.4) * 0.04);
      robot.rotation.y = laneSide === 'right' ? Math.PI * 0.08 : -Math.PI * 0.08;

      var localMouseX = clamp((mousePxX - laneCenterPx) / 260, -1, 1);
      var localMouseY = clamp((mousePxY - wanderY) / 260, -1, 1);

      var targetBodyYaw = robot.rotation.y + clamp(localMouseX * BODY_MAX_YAW, -BODY_MAX_YAW, BODY_MAX_YAW);
      var targetBodyTilt = clamp(-localMouseY * BODY_MAX_TILT, -BODY_MAX_TILT, BODY_MAX_TILT);
      var targetHeadYaw = clamp(localMouseX * HEAD_MAX_YAW, -HEAD_MAX_YAW, HEAD_MAX_YAW);
      var targetHeadPitch = clamp(-localMouseY * HEAD_MAX_PITCH, -HEAD_MAX_PITCH, HEAD_MAX_PITCH);

      var ease = reduceMotion ? 1 : 0.07;
      curBodyYaw = lerp(curBodyYaw, targetBodyYaw, ease);
      curBodyTilt = lerp(curBodyTilt, targetBodyTilt, ease);
      curHeadYaw = lerp(curHeadYaw, targetHeadYaw, ease);
      curHeadPitch = lerp(curHeadPitch, targetHeadPitch, ease);

      robot.rotation.y = curBodyYaw;
      robot.rotation.z = curBodyTilt;
      headPivot.rotation.y = curHeadYaw;
      headPivot.rotation.x = curHeadPitch;
    }

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
}
