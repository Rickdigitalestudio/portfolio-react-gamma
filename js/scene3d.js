// ============================================================
// React Universe — cena 3D (Three.js UMD via CDN, sem build)
// O átomo React orbita com elétrons, campo de partículas,
// parallax do mouse e reação à rolagem. Tecla "R" = pulso.
// Script clássico: funciona até com duplo clique no index.html.
// ============================================================
(function () {
    'use strict';

    window.__initScene = function (canvas) {
        if (typeof THREE === 'undefined') throw new Error('Three.js não carregou');

        var DARK = { ring: 0x61dafb, ring2: 0xa78bfa, ring3: 0xf472b6, core: 0x61dafb, part: 0x8fd8f5 };
        var LIGHT = { ring: 0x0b8fc4, ring2: 0x7c5cf0, ring3: 0xdb4d97, core: 0x0b8fc4, part: 0x5f7fc4 };
        var PAL = document.documentElement.dataset.theme === 'light' ? LIGHT : DARK;

        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(innerWidth, innerHeight);

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
        camera.position.set(0, 0, 9);

        // ---------- iluminação (Three r149, luzes em modo legado) ----------
        scene.add(new THREE.AmbientLight(0xffffff, 0.75));
        var key = new THREE.PointLight(PAL.core, 2.4, 40, 2);
        key.position.set(4, 3, 6);
        scene.add(key);
        var rim = new THREE.PointLight(PAL.ring2, 1.4, 40, 2);
        rim.position.set(-6, -2, 4);
        scene.add(rim);

        // ---------- átomo React ----------
        var atom = new THREE.Group();
        scene.add(atom);

        var nucleus = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.42, 1),
            new THREE.MeshStandardMaterial({ color: PAL.core, emissive: PAL.core, emissiveIntensity: 0.65, roughness: 0.3, metalness: 0.15 })
        );
        atom.add(nucleus);

        var ringColors = [PAL.ring, PAL.ring2, PAL.ring3];
        var electrons = [];
        var i;
        for (i = 0; i < 3; i++) {
            var ringGroup = new THREE.Group();
            ringGroup.rotation.z = (Math.PI / 3) * i;   // 0°, 60°, 120°
            ringGroup.rotation.x = 0.42;                 // profundidade
            var ring = new THREE.Mesh(
                new THREE.TorusGeometry(1.7, 0.028, 12, 90),
                new THREE.MeshStandardMaterial({ color: ringColors[i], emissive: ringColors[i], emissiveIntensity: 0.4, roughness: 0.35 })
            );
            ringGroup.add(ring);
            var electron = new THREE.Mesh(
                new THREE.SphereGeometry(0.11, 18, 18),
                new THREE.MeshStandardMaterial({ color: ringColors[i], emissive: ringColors[i], emissiveIntensity: 0.9, roughness: 0.2 })
            );
            ringGroup.add(electron);
            atom.add(ringGroup);
            electrons.push({ mesh: electron, ringIdx: i, speed: 0.9 + i * 0.35, phase: (i * Math.PI * 2) / 3 });
        }

        // ---------- campo de partículas ----------
        var COUNT = 1600;
        var positions = new Float32Array(COUNT * 3);
        var colors = new Float32Array(COUNT * 3);
        var base = new THREE.Color(PAL.part);
        var alt = new THREE.Color(PAL.ring3);
        for (i = 0; i < COUNT; i++) {
            var r = 5 + Math.random() * 14;
            var theta = Math.random() * Math.PI * 2;
            var phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
            positions[i * 3 + 2] = r * Math.cos(phi) * 0.6 - 4;
            var c = base.clone().lerp(alt, Math.random());
            colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
        }
        var partGeo = new THREE.BufferGeometry();
        partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        partGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        var particles = new THREE.Points(partGeo, new THREE.PointsMaterial({
            size: 0.045, vertexColors: true, transparent: true, opacity: 0.75, depthWrite: false,
            blending: THREE.AdditiveBlending
        }));
        scene.add(particles);

        // ---------- interações ----------
        var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
        addEventListener('pointermove', function (e) {
            mouse.tx = (e.clientX / innerWidth) * 2 - 1;
            mouse.ty = (e.clientY / innerHeight) * 2 - 1;
        }, { passive: true });

        var boom = 0;
        addEventListener('react-boom', function () { boom = 1; });

        // troca de tema ao vivo
        new MutationObserver(function () {
            PAL = document.documentElement.dataset.theme === 'light' ? LIGHT : DARK;
            nucleus.material.color.set(PAL.core); nucleus.material.emissive.set(PAL.core);
            key.color.set(PAL.core); rim.color.set(PAL.ring2);
            var themeRing = [PAL.ring, PAL.ring2, PAL.ring3];
            electrons.forEach(function (e) {
                e.mesh.material.color.set(themeRing[e.ringIdx]);
                e.mesh.material.emissive.copy(e.mesh.material.color);
            });
            var cc = new THREE.Color(PAL.part), altC = new THREE.Color(PAL.ring3);
            for (var j = 0; j < COUNT; j++) {
                var m = cc.clone().lerp(altC, Math.random());
                colors[j * 3] = m.r; colors[j * 3 + 1] = m.g; colors[j * 3 + 2] = m.b;
            }
            partGeo.attributes.color.needsUpdate = true;
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        addEventListener('resize', function () {
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(innerWidth, innerHeight);
        });

        // ---------- loop ----------
        var start = performance.now();
        var visible = true;
        document.addEventListener('visibilitychange', function () { visible = !document.hidden; });

        (function tick() {
            requestAnimationFrame(tick);
            if (!visible) return;
            var t = (performance.now() - start) / 1000;
            var scroll = Math.min(scrollY / innerHeight, 4);

            // parallax suave do mouse
            mouse.x += (mouse.tx - mouse.x) * 0.05;
            mouse.y += (mouse.ty - mouse.y) * 0.05;
            camera.position.x = mouse.x * 0.9;
            camera.position.y = -mouse.y * 0.6;
            camera.lookAt(0, 0, 0);

            // posição do átomo: direita no hero, sobe e se afasta com a rolagem
            var mobile = innerWidth < 900;
            atom.position.x = mobile ? 0 : 3.1;
            atom.position.y = (mobile ? -0.2 : 0) + scroll * 1.6;
            atom.position.z = -scroll * 1.5;
            atom.rotation.y = t * 0.25 + mouse.x * 0.5;
            atom.rotation.x = Math.sin(t * 0.4) * 0.12 + mouse.y * 0.25;

            // núcleo com "respiração" + pulso do easter egg
            boom *= 0.94;
            nucleus.scale.setScalar(1 + Math.sin(t * 2) * 0.05 + boom * 0.6);
            nucleus.material.emissiveIntensity = 0.65 + boom * 1.6;

            // elétrons orbitando (e acelerando no pulso)
            electrons.forEach(function (e) {
                var a = t * e.speed + e.phase + boom * 6;
                e.mesh.position.set(Math.cos(a) * 1.7, Math.sin(a) * 1.7, 0);
            });

            // partículas girando devagar
            particles.rotation.y = t * 0.02 + scroll * 0.1;
            particles.rotation.z = t * 0.008;

            renderer.render(scene, camera);
        })();
    };
})();
