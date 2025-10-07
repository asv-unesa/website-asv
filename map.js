
// Inisiasi map
document.addEventListener("DOMContentLoaded", () => {
            const map = L.map("map").setView([-7.922153, 112.595524], 19);

            // Tambah peta dasar
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 22,
                attribution: "&copy; OpenStreetMap contributors"
            }).addTo(map);

            // Icon kapal
            const shipIcon = L.icon({
                iconUrl: "ship.png",
                iconSize: [50, 50],
                iconAnchor: [25, 25],
            });

            // Variabel
            let shipMarker = null;
            let trajectory = L.polyline([], { color: "blue" }).addTo(map);
            let historyTrack = L.polyline([], { color: "gray", weight: 2, dashArray: "6, 8", opacity: 0.7 }).addTo(map);
            let plannedRoute = L.polyline([], { color: "dodgerblue", weight: 3, opacity: 0.9 }).addTo(map);

            // Tombol Center Map
            const centerControl = L.control({ position: "bottomleft" });

            centerControl.onAdd = function(map) {
                const btn = L.DomUtil.create("button", "leaflet-bar");
                btn.innerHTML = '<i class="ri-focus-3-line"></i>';
                btn.title = "Center to Ship";

                // Style tombol
                btn.style.backgroundColor = "white";
                btn.style.width = "36px";
                btn.style.height = "36px";
                btn.style.cursor = "pointer";

                L.DomEvent.on(btn, "click", function() {
                    if (shipMarker) {
                        map.setView(shipMarker.getLatLng(), map.getZoom());
                    } else {
                        alert("Posisi kapal tidak ditemukan");
                    }
                });
                return btn;
            };

            centerControl.addTo(map);

            // Pembaruan data kapal
            async function updateShipData() {
                try {
                    const res = await fetch('shipdata.json?_=' + Date.now());  // data json
                    const data = await res.json();
                    const { latitude, longitude, sog, cog, mode, surface, underwater, route } = data;

                    // Update marker
                    if (!shipMarker){
                        shipMarker = L.marker([latitude, longitude], { 
                            icon: shipIcon,
                            rotationAngle: cog,
                            rotationOrigin: "center center"
                        }).addTo(map);
                    } else {
                        shipMarker.setLatLng([latitude, longitude]);
                        shipMarker.setRotationAngle(cog);
                        updateCompass(cog);
                    }

                    // Update Lintasan
                    if (data.trackHistory && Array.isArray(data.trackHistory)) {
                        historyTrack.setLatLngs(data.trackHistory);
                    }
                    trajectory.addLatLng([latitude, longitude]);

                    // Rute Lintasan
                    if (route && Array.isArray(route) && route.length > 0) {
                        plannedRoute.setLatLngs(route);
                    }

                    // Update overlay
                    document.querySelector(".map-overlay .status-box-indicator-map:nth-child(1) .h4").textContent = sog + " kts";
                    document.querySelector(".map-overlay .status-box-indicator-map:nth-child(2) .h4").textContent = cog + "°";
                    document.querySelector(".map-overlay .status-box-indicator-map:nth-child(3) .small").textContent =
                        latitude.toFixed(4) + "°, " + longitude.toFixed(4) + "°";

                    if (surface) {
                        updateSurfaceData(surface.image, surface.sog, surface.cog, surface.latitude, surface.longitude);
                    }
                    if (underwater) {
                        updateUnderwaterData(underwater.image, underwater.sog, underwater.cog, underwater.latitude, underwater.longitude);
                    }

                } catch (err) {
                    console.error("Gagal ambil data kapal:", err);
                }
            }
            
            // Update Surface
            function updateSurfaceData(imageSrc, sog, cog, lat, lon) {
                const img = document.getElementById("surface-image");
                const sogEl = document.getElementById("surface-sog");
                const cogEl = document.getElementById("surface-cog");
                const posEl = document.getElementById("surface-pos");

                if (imageSrc) {
                    img.src = imageSrc;
                    img.classList.remove("d-none");
                } 

                sogEl.textContent = `${sog?.toFixed(1) || 0.0} kts`;
                cogEl.textContent = `${cog || 0}°`;
                posEl.textContent = `${lat?.toFixed(4) || 0.0000}°, ${lon?.toFixed(4) || 0.0000}°`;
            }

            // Update Underwater
            function updateUnderwaterData(imageSrc, sog, cog, lat, lon) {
                const img = document.getElementById("underwater-image");
                const sogEl = document.getElementById("under-sog");
                const cogEl = document.getElementById("under-cog");
                const posEl = document.getElementById("under-pos");

                if (imageSrc) {
                    img.src = imageSrc;
                    img.classList.remove("d-none");
                } 

                sogEl.textContent = `${sog?.toFixed(1) || 0.0} kts`;
                cogEl.textContent = `${cog || 0}°`;
                posEl.textContent = `${lat?.toFixed(4) || 0.0000}°, ${lon?.toFixed(4) || 0.0000}°`;
            }
            
            setInterval(updateShipData, 5000);
            updateShipData();
        });
