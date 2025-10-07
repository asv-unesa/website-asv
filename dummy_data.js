// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

// Folder public untuk file frontend
app.use(express.static(path.join(__dirname, 'shipdata.json')));
app.use(express.json());

// Posisi awal kapal
let shipData = {
  latitude: -7.922153,
  longitude: 112.595524,
  sog: 2.5, // Speed Over Ground (knot)
  cog: 45,  // Course Over Ground (derajat)
  route: [],
  trackHistory: []
};

// Fungsi simulasi pergerakan kapal
function simulateMovement() {
  // Konversi SOG (knot) → meter per detik
  const speedMS = shipData.sog * 0.5144;
  const distance = speedMS * 5; // gerak tiap 5 detik
  const bearingRad = (shipData.cog * Math.PI) / 180;
  const earthRadius = 6371000;

  // Hitung posisi baru berdasarkan bearing dan jarak
  const newLat =
    Math.asin(
      Math.sin((shipData.latitude * Math.PI) / 180) * Math.cos(distance / earthRadius) +
      Math.cos((shipData.latitude * Math.PI) / 180) *
      Math.sin(distance / earthRadius) *
      Math.cos(bearingRad)
    ) *
    (180 / Math.PI);

  const newLon =
    shipData.longitude +
    ((Math.atan2(
      Math.sin(bearingRad) * Math.sin(distance / earthRadius) * Math.cos((shipData.latitude * Math.PI) / 180),
      Math.cos(distance / earthRadius) - Math.sin((shipData.latitude * Math.PI) / 180) * Math.sin((newLat * Math.PI) / 180)
    ) *
      180) /
      Math.PI);

  // Update posisi kapal
  shipData.latitude = newLat;
  shipData.longitude = newLon;
  shipData.trackHistory.push([newLat, newLon]);
  if (shipData.trackHistory.length > 500) shipData.trackHistory.shift(); // batasi panjang history

  // Ubah arah sedikit supaya tidak monoton
  shipData.cog = (shipData.cog + (Math.random() * 10 - 5) + 360) % 360;
}

// Jalankan simulasi setiap 5 detik
setInterval(simulateMovement, 5000);

// Endpoint API untuk data kapal
app.get("/api/shipdata", (req, res) => {
  res.json(shipData);
});

app.listen(PORT, () => {
  console.log(`🚢 Server berjalan di http://localhost:${PORT}`);
});
