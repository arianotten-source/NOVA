# ESP32 ↔ N.O.V.A. Testinstructies

## 1. N.O.V.A. starten

```bash
cd /home/nova/NeonPulseLabsApps/apps/N.O.V.A.
npm run electron:dev
```

Sensor API draait op `http://0.0.0.0:3847`

## 2. API testen (zonder ESP32)

```bash
curl -X POST http://localhost:3847/api/sensors/update \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"livingroom01","name":"Woonkamer","temperature":22.4,"humidity":48,"timestamp":1780000000}'
```

```bash
curl http://localhost:3847/api/sensors
```

```bash
curl http://localhost:3847/api/sensors/livingroom01
```

## 3. ESP32 firmware

1. Open `firmware/esp32_dht_sensor/esp32_dht_sensor.ino` in Arduino IDE
2. Installeer libraries: **DHT sensor library**, **ArduinoJson**
3. Pas aan:
   - `WIFI_SSID` / `WIFI_PASSWORD`
   - `NOVA_SERVER_IP` → IP van je PC (bijv. `192.168.1.100`)
   - `DEVICE_ID` / `DEVICE_NAME`
4. DHT11/DHT22 op GPIO 4
5. Upload naar ESP32

## 4. Verificatie

- Open N.O.V.A. → **Sensoren** (Sensor Hub)
- Controleer temperatuur, vochtigheid, online status
- Dashboard toont sensor widget met gemiddelden en waarschuwingen

## 5. Online status

- 🟢 Online: laatste update < 2 minuten geleden
- 🔴 Offline: geen update binnen 2 minuten

## 6. Netwerk

ESP32 en PC moeten op hetzelfde WiFi-netwerk zitten.
Firewall poort **3847** openzetten indien nodig:

```bash
sudo ufw allow 3847/tcp
```
