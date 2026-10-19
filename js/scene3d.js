// ============================================================
// React Universe — cena 3D (Three.js UMD via CDN, sem build)
// Campo de estrelas realista + estação espacial orbital
// girando no centro. Parallax do mouse, reação à rolagem e
// easter egg (tecla R = ignição dos propulsores).
// Script clássico: funciona com duplo clique no index.html.
// ============================================================
(function () {
    'use strict';

    window.__initScene = function (canvas) {
        if (typeof THREE === 'undefined') throw new Error('Three.js não carregou');

        var isLight = function () { return document.documentElement.dataset.theme === 'light'; };

        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(innerWidth, innerHeight);
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;   // tom cinematográfico
        renderer.toneMappingExposure = 1.05;

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 500);
        camera.position.set(0, 0, 10);

        // -------------------------------------------------
        // Texturas procedurais (high-res, geradas na hora)
        // -------------------------------------------------
        function makeCanvas(w, h) {
            var c = document.createElement('canvas');
            c.width = w; c.height = h;
            return { c: c, x: c.getContext('2d') };
        }

        // Casco metálico com linhas de painéis, rebites e desgaste
        function hullTexture() {
            var t = makeCanvas(2048, 2048), x = t.x, i;
            x.fillStyle = '#aeb4c0';
            x.fillRect(0, 0, 2048, 2048);
            // variação tonal de placas
            for (i = 0; i < 140; i++) {
                x.fillStyle = 'rgba(' + (150 + Math.random() * 70 | 0) + ',' + (155 + Math.random() * 70 | 0) + ',' + (165 + Math.random() * 70 | 0) + ',.5)';
                x.fillRect(Math.random() * 2048, Math.random() * 2048, 90 + Math.random() * 260, 60 + Math.random() * 190);
            }
            // linhas de painéis
            x.strokeStyle = 'rgba(48,54,68,.65)';
            x.lineWidth = 5;
            for (i = 0; i <= 2048; i += 170) {
                x.beginPath(); x.moveTo(i + (Math.random() * 14 - 7), 0); x.lineTo(i + (Math.random() * 14 - 7), 2048); x.stroke();
            }
            for (i = 0; i <= 2048; i += 132) {
                x.beginPath(); x.moveTo(0, i + (Math.random() * 12 - 6)); x.lineTo(2048, i + (Math.random() * 12 - 6)); x.stroke();
            }
            x.strokeStyle = 'rgba(255,255,255,.16)';
            x.lineWidth = 2;
            for (i = 0; i <= 2048; i += 43) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 2048); x.stroke(); }
            // rebites
            x.fillStyle = 'rgba(40,45,58,.55)';
            for (i = 0; i < 2600; i++) {
                x.beginPath();
                x.arc(Math.random() * 2048, Math.random() * 2048, 2.4, 0, 6.3);
                x.fill();
            }
            // sujeira e riscos
            for (i = 0; i < 90; i++) {
                x.strokeStyle = 'rgba(30,34,44,' + (Math.random() * .14) + ')';
                x.lineWidth = 2 + Math.random() * 9;
                var sx = Math.random() * 2048, sy = Math.random() * 2048;
                x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.random() * 300 - 150, sy + Math.random() * 300 - 150); x.stroke();
            }
            // faixa de sinalização laranja
            x.fillStyle = '#d97a2b';
            x.fillRect(0, 690, 2048, 46);
            x.fillStyle = 'rgba(20,24,34,.8)';
            for (i = 0; i < 2048; i += 90) x.fillRect(i, 690, 44, 46);
            var tex = new THREE.CanvasTexture(t.c);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.encoding = THREE.sRGBEncoding;
            return tex;
        }

        // Painéis solares com células
        function solarTexture() {
            var t = makeCanvas(1024, 512), x = t.x, i, j;
            var g = x.createLinearGradient(0, 0, 1024, 512);
            g.addColorStop(0, '#0c1f45'); g.addColorStop(.5, '#14346b'); g.addColorStop(1, '#0a1834');
            x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
            x.strokeStyle = 'rgba(96,150,240,.75)';
            x.lineWidth = 2;
            for (i = 0; i <= 1024; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.stroke(); }
            for (j = 0; j <= 512; j += 42) { x.beginPath(); x.moveTo(0, j); x.lineTo(1024, j); x.stroke(); }
            x.strokeStyle = 'rgba(180,215,255,.9)'; x.lineWidth = 5;
            for (i = 32; i < 1024; i += 128) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.stroke(); }
            var tex = new THREE.CanvasTexture(t.c);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.encoding = THREE.sRGBEncoding;
            return tex;
        }

        // Sprite de estrela (redonda com brilho; a "forte" ganha cruz de difração)
        function starSprite(spiked) {
            var t = makeCanvas(128, 128), x = t.x;
            var g = x.createRadialGradient(64, 64, 0, 64, 64, 62);
            g.addColorStop(0, 'rgba(255,255,255,1)');
            g.addColorStop(.18, 'rgba(255,255,255,.85)');
            g.addColorStop(.45, 'rgba(190,215,255,.28)');
            g.addColorStop(1, 'rgba(160,190,255,0)');
            x.fillStyle = g;
            x.fillRect(0, 0, 128, 128);
            if (spiked) {
                x.strokeStyle = 'rgba(255,255,255,.6)';
                x.lineWidth = 1.6;
                var lg = x.createLinearGradient(0, 64, 128, 64);
                lg.addColorStop(0, 'rgba(255,255,255,0)');
                lg.addColorStop(.5, 'rgba(255,255,255,.75)');
                lg.addColorStop(1, 'rgba(255,255,255,0)');
                x.strokeStyle = lg;
                x.beginPath(); x.moveTo(0, 64); x.lineTo(128, 64); x.stroke();
                x.beginPath(); x.moveTo(64, 0); x.lineTo(64, 128); x.stroke();
            }
            return new THREE.CanvasTexture(t.c);
        }

        // Ambiente equirectangular para reflexos no casco (sol + nebulosa)
        function envTexture() {
            var t = makeCanvas(1024, 512), x = t.x;
            var g = x.createLinearGradient(0, 0, 0, 512);
            g.addColorStop(0, '#05070d'); g.addColorStop(.55, '#0a1020'); g.addColorStop(1, '#04060a');
            x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
            // nebulosa fria à esquerda
            var neb = x.createRadialGradient(210, 300, 10, 210, 300, 320);
            neb.addColorStop(0, 'rgba(70,120,220,.5)'); neb.addColorStop(1, 'rgba(70,120,220,0)');
            x.fillStyle = neb; x.fillRect(0, 0, 1024, 512);
            // sol quente à direita (bate com a DirectionalLight)
            var sun = x.createRadialGradient(640, 150, 4, 640, 150, 190);
            sun.addColorStop(0, 'rgba(255,246,225,1)');
            sun.addColorStop(.25, 'rgba(255,215,160,.85)');
            sun.addColorStop(1, 'rgba(255,190,120,0)');
            x.fillStyle = sun; x.fillRect(0, 0, 1024, 512);
            // reflexo de planeta azul embaixo
            var pl = x.createRadialGradient(430, 470, 8, 430, 470, 240);
            pl.addColorStop(0, 'rgba(90,160,255,.55)'); pl.addColorStop(1, 'rgba(90,160,255,0)');
            x.fillStyle = pl; x.fillRect(0, 0, 1024, 512);
            var tex = new THREE.CanvasTexture(t.c);
            tex.mapping = THREE.EquirectangularReflectionMapping;
            return tex;
        }

        // -------------------------------------------------
        // Iluminação: sol + fill + ambiente baixo + reflexos
        // -------------------------------------------------
        scene.add(new THREE.AmbientLight(0xbcc8e6, 0.14));
        var sun = new THREE.DirectionalLight(0xfff2dc, 1.7);
        sun.position.set(8, 6, 6);
        scene.add(sun);
        var fill = new THREE.DirectionalLight(0x5f8fe8, 0.3);
        fill.position.set(-7, -3, -5);
        scene.add(fill);

        try {
            var pmrem = new THREE.PMREMGenerator(renderer);
            var envRT = pmrem.fromEquirectangular(envTexture());
            scene.environment = envRT.texture;
            pmrem.dispose();
        } catch (e) { /* reflexos são bônus */ }

        // -------------------------------------------------
        // Campo de estrelas (camadas + faixa da via láctea)
        // -------------------------------------------------
        var texRound = starSprite(false);
        var texSpike = starSprite(true);

        function starField(count, rMin, rMax, size, tex, opts) {
            opts = opts || {};
            var pos = new Float32Array(count * 3);
            var col = new Float32Array(count * 3);
            var c = new THREE.Color();
            for (var i = 0; i < count; i++) {
                var r = rMin + Math.random() * (rMax - rMin);
                var theta = Math.random() * Math.PI * 2;
                var phi = Math.acos(2 * Math.random() - 1);
                var px = r * Math.sin(phi) * Math.cos(theta);
                var py, pz = r * Math.cos(phi);
                if (opts.band) {
                    // faixa galáctica: concentra perto de um plano inclinado
                    py = (Math.random() + Math.random() + Math.random() - 1.5) * (rMax * 0.075);
                } else {
                    py = r * Math.sin(phi) * Math.sin(theta);
                }
                pos[i * 3] = px; pos[i * 3 + 1] = py; pos[i * 3 + 2] = pz;
                // variação cromática real de estrelas
                var warm = Math.random();
                if (warm < 0.62) c.setHSL(0.58 + Math.random() * 0.06, 0.55, 0.85);
                else if (warm < 0.85) c.setHSL(0.13, 0.55, 0.82);
                else c.setHSL(0.03, 0.7, 0.78);
                var dim = 0.55 + Math.random() * 0.45;
                col[i * 3] = c.r * dim; col[i * 3 + 1] = c.g * dim; col[i * 3 + 2] = c.b * dim;
            }
            var geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
            var mat = new THREE.PointsMaterial({
                size: size, map: tex, vertexColors: true, transparent: true,
                opacity: opts.opacity || 1, depthWrite: false, blending: THREE.AdditiveBlending,
                sizeAttenuation: true, alphaTest: 0.01
            });
            var pts = new THREE.Points(geo, mat);
            pts.userData.baseOpacity = opts.opacity || 1;
            return pts;
        }

        var starsFar = starField(2800, 40, 120, 1.5, texRound, { opacity: 0.85 });
        var starsNear = starField(420, 25, 60, 3.4, texSpike, { opacity: 1 });
        var milkyWay = starField(4200, 55, 130, 1.1, texRound, { opacity: 0.4, band: true });
        milkyWay.rotation.z = 0.5;
        milkyWay.rotation.x = 0.22;
        scene.add(starsFar, starsNear, milkyWay);
        var allStars = [starsFar, starsNear, milkyWay];

        // -------------------------------------------------
        // ESTAÇÃO ESPACIAL orbital (procedural, detalhada)
        // -------------------------------------------------
        var hullTex = hullTexture();
        var solarTex = solarTexture();
        hullTex.repeat.set(6, 2);

        var matHull = new THREE.MeshStandardMaterial({ map: hullTex, color: 0xffffff, metalness: 0.62, roughness: 0.46 });
        var matHullDark = new THREE.MeshStandardMaterial({ color: 0x39404f, metalness: 0.7, roughness: 0.4 });
        var matGold = new THREE.MeshStandardMaterial({ color: 0xd8a03c, metalness: 0.9, roughness: 0.32 });   // isolante MLI dourado
        var matSolar = new THREE.MeshStandardMaterial({ map: solarTex, color: 0xffffff, metalness: 0.35, roughness: 0.28, side: THREE.DoubleSide });
        var matRadiator = new THREE.MeshStandardMaterial({ color: 0xeef1f5, metalness: 0.2, roughness: 0.75, side: THREE.DoubleSide });
        var matWindow = new THREE.MeshStandardMaterial({ color: 0x0d1017, emissive: 0xffcf96, emissiveIntensity: 1.7, metalness: 0.4, roughness: 0.3 });
        var matBeacon = new THREE.MeshStandardMaterial({ color: 0x33060a, emissive: 0xff2b3d, emissiveIntensity: 2 });

        var station = new THREE.Group();          // estação inteira (oscila)
        var ringSpin = new THREE.Group();         // anel habitat (gira)
        station.add(ringSpin);
        scene.add(station);

        // --- anel habitat ---
        var RING_R = 2.3, RING_T = 0.42;
        var ring = new THREE.Mesh(new THREE.TorusGeometry(RING_R, RING_T, 22, 140), matHull);
        ring.rotation.x = -Math.PI / 2;
        ringSpin.add(ring);
        // corredor interno escuro (sugere profundidade)
        var ringInner = new THREE.Mesh(new THREE.TorusGeometry(RING_R, RING_T * 0.72, 16, 110), matHullDark);
        ringInner.rotation.x = -Math.PI / 2;
        ringSpin.add(ringInner);

        // janelas ao redor do anel (instanced)
        var winGeo = new THREE.BoxGeometry(0.13, 0.07, 0.055);
        var WINDOWS = 48;
        var windows = new THREE.InstancedMesh(winGeo, matWindow, WINDOWS);
        var dummy = new THREE.Object3D();
        for (var w = 0; w < WINDOWS; w++) {
            var a = (w / WINDOWS) * Math.PI * 2;
            dummy.position.set(Math.cos(a) * (RING_R + RING_T * 0.97), 0, Math.sin(a) * (RING_R + RING_T * 0.97));
            dummy.rotation.set(0, -a, 0);
            dummy.updateMatrix();
            windows.setMatrixAt(w, dummy.matrix);
        }
        ringSpin.add(windows);

        // rebites/painéis salientes no anel (greebles instanced)
        var GREEB = 110;
        var greebles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.09, 0.05), matHullDark, GREEB);
        for (var gI = 0; gI < GREEB; gI++) {
            var u = Math.random() * Math.PI * 2;          // ao redor do anel
            var v = Math.random() * Math.PI * 2;          // ao redor do tubo
            var ro = RING_T + 0.02;
            var rr = RING_R + ro * Math.cos(v);
            dummy.position.set(rr * Math.cos(u), ro * Math.sin(v), rr * Math.sin(u));
            dummy.rotation.set(Math.random() * 0.5, -u, v * 0.5);
            dummy.scale.set(0.7 + Math.random() * 1.6, 0.7 + Math.random(), 1);
            dummy.updateMatrix();
            greebles.setMatrixAt(gI, dummy.matrix);
        }
        dummy.scale.set(1, 1, 1);
        ringSpin.add(greebles);

        // --- hub central (eixo vertical) ---
        var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 3.4, 24), matHull);
        station.add(hub);
        var hubTop = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.34, 0.5, 24), matHullDark);
        hubTop.position.y = 1.9;
        station.add(hubTop);
        var hubBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.52, 0.6, 24), matHullDark);
        hubBottom.position.y = -2;
        station.add(hubBottom);

        // módulos de carga/combustível dourados cruzados no centro
        function goldModule(axis) {
            var m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.1, 20), matGold);
            if (axis === 'x') m.rotation.z = Math.PI / 2;
            else m.rotation.x = Math.PI / 2;
            m.position.y = 0.55;
            var cap1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 12), matGold);
            cap1.position.set(axis === 'x' ? 1.05 : 0, axis === 'x' ? 0.55 : 0.55, axis === 'x' ? 0 : 1.05);
            cap1.position.y = 0.55;
            var cap2 = cap1.clone();
            if (axis === 'x') { cap2.position.x = -1.05; cap1.position.x = 1.05; cap1.position.z = 0; cap2.position.z = 0; }
            else { cap2.position.z = -1.05; cap1.position.z = 1.05; cap1.position.x = 0; cap2.position.x = 0; }
            station.add(m, cap1, cap2);
        }
        goldModule('x');
        goldModule('z');

        // --- raios (spokes) do hub ao anel (estáticos) ---
        for (var s = 0; s < 4; s++) {
            var ang = (s / 4) * Math.PI * 2 + Math.PI / 4;
            var spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, RING_R - 0.45, 12), matHullDark);
            spoke.position.set(Math.cos(ang) * (0.45 + (RING_R - 0.45) / 2), 0, Math.sin(ang) * (0.45 + (RING_R - 0.45) / 2));
            spoke.rotation.z = Math.PI / 2;
            spoke.rotation.y = -ang;
            station.add(spoke);
            // nós de engenharia no meio de cada raio
            var node = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.2), matGold);
            node.position.set(Math.cos(ang) * 1.35, 0, Math.sin(ang) * 1.35);
            station.add(node);
        }

        // --- arrays solares em mastros laterais ---
        function solarWing(sign) {
            var wing = new THREE.Group();
            var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.5, 10), matHullDark);
            mast.rotation.z = Math.PI / 2;
            mast.position.x = sign * 1.0;
            wing.add(mast);
            for (var k = 0; k < 2; k++) {
                var panel = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.045, 2.5), matSolar);
                panel.position.x = sign * (2.05 + k * 1.28);
                panel.position.y = 0.02;
                panel.rotation.x = 0.06 * sign;
                wing.add(panel);
                // bordas do painel
                var frame = new THREE.Mesh(new THREE.BoxGeometry(1.19, 0.03, 2.54), matHullDark);
                frame.position.copy(panel.position);
                frame.position.y -= 0.035;
                wing.add(frame);
            }
            wing.position.y = -0.55;
            return wing;
        }
        station.add(solarWing(1));
        station.add(solarWing(-1));

        // --- radiadores brancos (perpendiculares) ---
        function radiatorWing(sign) {
            var g = new THREE.Group();
            var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), matHullDark);
            mast.rotation.x = Math.PI / 2;
            mast.position.z = sign * 0.85;
            g.add(mast);
            var plate = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.03, 1.4), matRadiator);
            plate.position.z = sign * 2.1;
            plate.rotation.y = 0.28 * sign;
            g.add(plate);
            g.position.y = 1.35;
            return g;
        }
        station.add(radiatorWing(1));
        station.add(radiatorWing(-1));

        // --- antena parabólica no topo ---
        var dishArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), matHullDark);
        dishArm.position.set(0.5, 2.4, 0);
        station.add(dishArm);
        var dish = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.55, 0.36, 26, 1, true), matHull);
        dish.position.set(0.5, 2.95, 0);
        dish.rotation.x = 0.5;
        station.add(dish);
        var dishTip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), matGold);
        dishTip.position.set(0.5, 3.12, 0.12);
        station.add(dishTip);

        // --- antenas rádio finas + balizas piscantes ---
        var beacons = [];
        for (var b = 0; b < 2; b++) {
            var ant = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.6, 6), matHullDark);
            ant.position.set(-0.45, b === 0 ? 2.7 : -2.85, 0);
            station.add(ant);
            var beacon = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), matBeacon.clone());
            beacon.position.set(-0.45, b === 0 ? 3.55 : -3.7, 0);
            station.add(beacon);
            beacons.push(beacon);
        }
        // antena de varredura no hub
        var sweep = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.5), matHull);
        sweep.position.set(0, -1.4, 0.4);
        station.add(sweep);

        // --- escotilhas de acoplagem na frente do hub ---
        var port = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.3, 18), matHullDark);
        port.rotation.x = Math.PI / 2;
        port.position.set(0, -0.6, 0.45);
        station.add(port);
        var portRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 10, 24), matGold);
        portRing.position.set(0, -0.6, 0.62);
        station.add(portRing);

        var STATION_X = 2.7;
        station.position.set(STATION_X, 0, 0);

        // -------------------------------------------------
        // Interações: mouse, rolagem, tecla R, tema
        // -------------------------------------------------
        var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
        addEventListener('pointermove', function (e) {
            mouse.tx = (e.clientX / innerWidth) * 2 - 1;
            mouse.ty = (e.clientY / innerHeight) * 2 - 1;
        }, { passive: true });

        var boom = 0;
        addEventListener('react-boom', function () { boom = 1; });

        function applyTheme() {
            var light = isLight();
            allStars.forEach(function (st) {
                st.material.opacity = light ? st.userData.baseOpacity * 0.16 : st.userData.baseOpacity;
            });
            scene.children.forEach(function (o) {
                if (o.isAmbientLight) o.intensity = light ? 0.55 : 0.14;
            });
            renderer.toneMappingExposure = light ? 0.92 : 1.05;
        }
        applyTheme();
        new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        // handle para depuração/inspeção
        window.__sceneDebug = { renderer: renderer, scene: scene, camera: camera, station: station, stars: allStars };

        addEventListener('resize', function () {
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(innerWidth, innerHeight);
        });

        // -------------------------------------------------
        // Loop de animação
        // -------------------------------------------------
        var last = performance.now();
        var t0 = last;
        var visible = true;
        document.addEventListener('visibilitychange', function () { visible = !document.hidden; });

        (function tick(now) {
            requestAnimationFrame(tick);
            if (!visible) return;
            now = now || performance.now();
            var dt = Math.min((now - last) / 1000, 0.1);
            last = now;
            var t = (now - t0) / 1000;
            var scroll = Math.min(scrollY / innerHeight, 4);

            // parallax suave do mouse
            mouse.x += (mouse.tx - mouse.x) * 0.05;
            mouse.y += (mouse.ty - mouse.y) * 0.05;
            camera.position.x = mouse.x * 0.9;
            camera.position.y = -mouse.y * 0.6;
            camera.lookAt(0, 0, 0);

            // estação: gira devagar, sobe e se afasta com a rolagem
            var mobile = innerWidth < 900;
            station.scale.setScalar(mobile ? 0.42 : 0.78);
            station.position.x = mobile ? 0 : STATION_X;
            station.position.y = (mobile ? -0.2 : 0) + scroll * 1.7;
            station.position.z = -scroll * 1.6;
            station.rotation.y = t * 0.06 + mouse.x * 0.3;      // órbita lenta
            station.rotation.z = Math.sin(t * 0.3) * 0.045 + mouse.y * 0.06;
            station.rotation.x = Math.sin(t * 0.21) * 0.03;

            // anel habitat girando (com impulso do easter egg)
            boom *= 0.96;
            ringSpin.rotation.y += dt * (0.22 + boom * 3.5);

            // balizas piscantes + janelas reagem ao impulso
            var blink = (Math.sin(t * 3.2) > 0.6) ? 2.6 : 0.15;
            beacons[0].material.emissiveIntensity = blink;
            beacons[1].material.emissiveIntensity = (Math.sin(t * 3.2 + Math.PI) > 0.6) ? 2.6 : 0.15;
            matWindow.emissiveIntensity = 1.7 + Math.sin(t * 1.7) * 0.2 + boom * 2.2;

            // cintilação sutil das estrelas
            starsFar.material.opacity = starsFar.userData.baseOpacity * (0.8 + Math.sin(t * 1.4) * 0.12) * (isLight() ? 0.16 : 1);

            // campo estelar em deriva lenta
            starsFar.rotation.y = t * 0.004 + scroll * 0.05;
            starsNear.rotation.y = -t * 0.006 - scroll * 0.04;
            milkyWay.rotation.y = t * 0.002;

            renderer.render(scene, camera);
        })();
    };
})();
