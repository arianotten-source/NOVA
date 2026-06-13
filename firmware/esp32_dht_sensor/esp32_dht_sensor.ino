/**
 * N.O.V.A. ESP32 Sensor Firmware V1
 *
 * Hardware:
 *   - ESP32 (DevKit)
 *   - DHT11 of DHT22 op GPIO 4
 *
 * Libraries (Arduino IDE → Library Manager):
 *   - DHT sensor library by Adafruit
 *   - ArduinoJson by Benoit Blanchon
 *
 * Configure WIFI_SSID, WIFI_PASSWORD en NOVA_SERVER_IP hieronder.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ── Configuratie ──────────────────────────────────────────────
#define WIFI_SSID       "JOUW_WIFI_NAAM"
#define WIFI_PASSWORD   "JOUW_WIFI_WACHTWOORD"

// IP-adres van de PC waar N.O.V.A. draait
#define NOVA_SERVER_IP  "192.168.1.100"
#define NOVA_SERVER_PORT 3847

#define DEVICE_ID       "livingroom01"
#define DEVICE_NAME     "Woonkamer"

// DHT11 of DHT22 — wijzig naar DHT22 indien nodig
#define DHT_PIN         4
#define DHT_TYPE        DHT11

#define SEND_INTERVAL_MS 30000

// ── Globals ───────────────────────────────────────────────────
DHT dht(DHT_PIN, DHT_TYPE);
unsigned long lastSend = 0;

void connectWiFi() {
  Serial.print("Verbinden met WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi verbonden. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi verbinding mislukt!");
  }
}

bool sendSensorData(float temperature, float humidity) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Geen WiFi — overslaan");
    return false;
  }

  HTTPClient http;
  String url = String("http://") + NOVA_SERVER_IP + ":" + String(NOVA_SERVER_PORT) + "/api/sensors/update";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["name"] = DEVICE_NAME;
  doc["temperature"] = round(temperature * 10) / 10.0;
  doc["humidity"] = round(humidity);
  doc["timestamp"] = (unsigned long)(millis() / 1000);

  String payload;
  serializeJson(doc, payload);

  Serial.print("Versturen naar N.O.V.A.: ");
  Serial.println(payload);

  int httpCode = http.POST(payload);
  bool success = (httpCode == 200);

  if (success) {
    Serial.println("Data ontvangen door N.O.V.A.");
  } else {
    Serial.printf("Fout HTTP %d: %s\n", httpCode, http.getString().c_str());
  }

  http.end();
  return success;
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== N.O.V.A. ESP32 Sensor V1 ===");

  dht.begin();
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    delay(5000);
    return;
  }

  unsigned long now = millis();
  if (now - lastSend < SEND_INTERVAL_MS) {
    delay(100);
    return;
  }
  lastSend = now;

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("DHT sensor leesfout!");
    return;
  }

  Serial.printf("Gemeten: %.1f°C, %.0f%%\n", temperature, humidity);
  sendSensorData(temperature, humidity);
}
