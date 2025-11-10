import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

const ARViewer = ({
  session,
  isActive,
  onClose,
  currentParams,
  productName,
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraStream, setCameraStream] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [arMode, setArMode] = useState(false);

  const [modelPosition, setModelPosition] = useState({ x: 0, y: 0, z: -2 });
  const [modelRotation, setModelRotation] = useState({ x: 0, y: 0, z: 0 });
  const [modelScale, setModelScale] = useState(1);

  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animationIdRef = useRef(null);
  const modelRef = useRef(null);

  const [isCapturing, setIsCapturing] = useState(false);

  // ---- Ortam / destek kontrolü ----
  const checkSupport = () => {
    const isSecure =
      window.isSecureContext ||
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost";

    console.log("[AR] Support check:", {
      isSecure,
      protocol: window.location.protocol,
      host: window.location.host,
      mediaDevices: !!navigator.mediaDevices,
      getUserMedia: !!navigator.mediaDevices?.getUserMedia,
    });

    if (!isSecure) {
      throw new Error(
        "Kamera yalnızca HTTPS veya localhost ortamlarında kullanılabilir. " +
          "Lütfen siteyi güvenli bir bağlantı ile açın."
      );
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Tarayıcı getUserMedia API'sini desteklemiyor.");
    }
  };

  // ---- Kamera stream alma (Chrome + Safari) ----
  const getMediaStream = useCallback(async () => {
    checkSupport();

    const envConstraints = {
      video: {
        facingMode: { ideal: "environment" },
      },
    };

    try {
      console.log("[AR] getUserMedia (environment) çağrılıyor...");
      return await navigator.mediaDevices.getUserMedia(envConstraints);
    } catch (err) {
      console.warn(
        "[AR] environment constraints ile kamera açılamadı, generic video ile yeniden denenecek:",
        err
      );
      return await navigator.mediaDevices.getUserMedia({ video: true });
    }
  }, []);

  // ---- Kamera başlat ----
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      console.log("[AR] Kamera başlatılıyor...");
      const stream = await getMediaStream();
      console.log("[AR] Kamera stream alındı:", stream);
      setCameraStream(stream); // videoRef'e bağlama işini effect yapacak
      setArMode(true);
    } catch (err) {
      console.error("Kamera erişim hatası:", err);

      let msg = "Kamera erişimi başarısız. ";
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        msg +=
          "Tarayıcı kamera iznini engelledi. Ayarlardan bu site için kameraya izin verin.";
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        msg += "Herhangi bir kamera bulunamadı.";
      } else {
        msg += err.message || "Bilinmeyen bir hata oluştu.";
      }

      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [getMediaStream]);

  // ---- Kamera stream video elementine bağlansın ----
  useEffect(() => {
    if (!cameraStream || !videoRef.current) return;

    const video = videoRef.current;
    console.log("[AR] videoRef ve stream bağlanıyor...");
    video.srcObject = cameraStream;
    video.playsInline = true;
    video.muted = true;

    const play = async () => {
      try {
        await video.play();
        console.log("[AR] Video play() başarılı");
      } catch (err) {
        // AbortError genelde React dev/StrictMode'da önemsiz
        if (err.name === "AbortError") {
          console.warn("[AR] Video play() AbortError (önemsiz olabilir):", err);
        } else {
          console.warn("[AR] Video play() hatası:", err);
          setError(
            "Video oynatılamadı. Tarayıcı ayarlarından otomatik oynatmaya izin verin."
          );
        }
      }
    };

    play();

    // Burada cleanup'ta video.srcObject = null demiyoruz;
    // sadece stopCamera() içinde track'leri durduracağız.
  }, [cameraStream]);

  // ---- Kamerayı durdur ----
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setArMode(false);

    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
  }, [cameraStream]);

  // ---- Three.js sahnesini kur ----
  const setupThreeScene = useCallback(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.01,
      1000
    );
    camera.position.set(0, 0, 1);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(
      canvasRef.current.clientWidth,
      canvasRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Işıklar
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Basit model (ileride ShapeDiver modeline bağlayabilirsin)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x7aa2ff,
      metalness: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity: 0.9,
    });

    const model = new THREE.Mesh(geometry, material);
    model.position.set(modelPosition.x, modelPosition.y, modelPosition.z);
    model.rotation.set(modelRotation.x, modelRotation.y, modelRotation.z);
    model.scale.setScalar(modelScale);
    model.castShadow = true;

    modelRef.current = model;
    scene.add(model);
  }, [modelPosition, modelRotation, modelScale]);

  // ---- Animasyon döngüsü ----
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    animationIdRef.current = requestAnimationFrame(animate);

    if (modelRef.current) {
      modelRef.current.rotation.y += 0.005;
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, []);

  // ---- AR modu aktifken Three sahnesini başlat ----
  useEffect(() => {
    if (arMode && canvasRef.current) {
      console.log("[AR] Three.js sahne kuruluyor...");
      setupThreeScene();
      animate();
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, [arMode, setupThreeScene, animate]);

  // ---- Model transform güncelle ----
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.position.set(
        modelPosition.x,
        modelPosition.y,
        modelPosition.z
      );
      modelRef.current.rotation.set(
        modelRotation.x,
        modelRotation.y,
        modelRotation.z
      );
      modelRef.current.scale.setScalar(modelScale);
    }
  }, [modelPosition, modelRotation, modelScale]);

  // ---- Ekran görüntüsü ----
  const captureScreenshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !rendererRef.current) return;

    setIsCapturing(true);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      const combinedCanvas = document.createElement("canvas");
      const ctx = combinedCanvas.getContext("2d");
      combinedCanvas.width = canvas.width || canvas.clientWidth;
      combinedCanvas.height = canvas.height || canvas.clientHeight;

      // Arka plan: kamera görüntüsü
      ctx.drawImage(video, 0, 0, combinedCanvas.width, combinedCanvas.height);
      // Üstüne 3D canvas
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(canvas, 0, 0, combinedCanvas.width, combinedCanvas.height);

      const link = document.createElement("a");
      link.download = `AR_${productName || "Ürün"}_${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:.]/g, "-")}.png`;
      link.href = combinedCanvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Ekran görüntüsü alınamadı:", error);
    } finally {
      setIsCapturing(false);
    }
  }, [productName]);

  // NOT: React Strict Mode'da "mount → unmount → mount" simülasyonu yüzünden
  // burada stopCamera çağırmıyoruz; sadece kullanıcı X'e basınca/kamerayı durdurunca çağrılıyor.

  if (!isActive) return null;

  return (
    <div className="ar-overlay">
      <div className="ar-container">
        <div className="ar-header">
          <h3>Artırılmış Gerçeklik - {productName}</h3>
          <button
            className="btn ghost"
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="ar-error">
            <strong>Hata:</strong> {error}
            <br />
            <small>
              Tarayıcı ayarlarından kamera izinlerini ve bağlantıyı kontrol
              edin.
            </small>
          </div>
        )}

        {!arMode ? (
          <div className="ar-start">
            <div className="ar-instructions">
              <h4>🎯 AR Görünüm Nasıl Çalışır?</h4>
              <p>Parametrize ettiğiniz ürünü gerçek dünyada görüntüleyin:</p>
              <ul>
                <li>
                  <strong>Kamera izni</strong> vermeniz gerekecek
                </li>
                <li>
                  <strong>HTTPS</strong> veya <strong>localhost</strong>{" "}
                  üzerinden çalıştığından emin olun
                </li>
                <li>
                  <strong>Düz zemin</strong> seçin
                </li>
              </ul>
            </div>
            <button
              className="btn primary"
              onClick={startCamera}
              disabled={isLoading}
            >
              {isLoading ? "Kamera Açılıyor..." : "🚀 AR Modunu Başlat"}
            </button>
          </div>
        ) : (
          <div className="ar-viewer">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="ar-video"
            />
            <canvas ref={canvasRef} className="ar-canvas" />

            <div className="ar-controls">
              <div className="ar-section">
                <h5>📍 Pozisyon</h5>
                <div className="ar-control-group">
                  <label>X</label>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={modelPosition.x}
                    onChange={(e) =>
                      setModelPosition((prev) => ({
                        ...prev,
                        x: parseFloat(e.target.value),
                      }))
                    }
                  />
                  <span>{modelPosition.x.toFixed(1)}</span>
                </div>

                <div className="ar-control-group">
                  <label>Y</label>
                  <input
                    type="range"
                    min="-3"
                    max="3"
                    step="0.1"
                    value={modelPosition.y}
                    onChange={(e) =>
                      setModelPosition((prev) => ({
                        ...prev,
                        y: parseFloat(e.target.value),
                      }))
                    }
                  />
                  <span>{modelPosition.y.toFixed(1)}</span>
                </div>

                <div className="ar-control-group">
                  <label>Z</label>
                  <input
                    type="range"
                    min="-10"
                    max="1"
                    step="0.1"
                    value={modelPosition.z}
                    onChange={(e) =>
                      setModelPosition((prev) => ({
                        ...prev,
                        z: parseFloat(e.target.value),
                      }))
                    }
                  />
                  <span>{modelPosition.z.toFixed(1)}</span>
                </div>
              </div>

              <div className="ar-section">
                <h5>📏 Boyut</h5>
                <div className="ar-control-group">
                  <label>Ölçek</label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={modelScale}
                    onChange={(e) => setModelScale(parseFloat(e.target.value))}
                  />
                  <span>{modelScale.toFixed(1)}x</span>
                </div>
              </div>
            </div>

            <div className="ar-actions">
              <button className="btn" onClick={stopCamera}>
                ❌ Kamerayı Durdur
              </button>
              <button
                className="btn primary"
                onClick={captureScreenshot}
                disabled={isCapturing}
              >
                {isCapturing ? "📸 Kaydediliyor..." : "📸 Ekran Görüntüsü"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ARViewer;
