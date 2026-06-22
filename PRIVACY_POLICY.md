# Privacy Policy — Daylight

**Last updated:** June 2026

---

Daylight is designed to respect your privacy. This policy explains what data the App accesses, why, and how it is handled.

---

## 1. What data Daylight accesses

| Data | Purpose | Stored? |
|------|---------|---------|
| Device location (latitude & longitude) | Fetch local weather conditions from Open-Meteo | No — held in memory only |

Daylight does **not** access, collect, or transmit any other personal data, including but not limited to: your name, email address, contacts, calendar, photos, browsing history, or usage analytics.

---

## 2. How location data is used

When you grant the macOS location permission, Daylight reads your approximate GPS coordinates once at launch and then again every 30 minutes. These coordinates are sent in a single HTTPS request to:

```
https://api.open-meteo.com/v1/forecast?latitude=…&longitude=…&current=weather_code
```

The response contains only a [WMO weather interpretation code](https://open-meteo.com/en/docs#weathervariables) (a small integer). No personal data is returned or stored.

---

## 3. Data retention

- Coordinates are **never written to disk**.
- Coordinates are held in the App's memory only for the duration of the network request, then discarded.
- All weather data is cleared when the App quits.

---

## 4. Third-party services

Daylight uses one external service:

| Service | Purpose | Privacy Policy |
|---------|---------|----------------|
| [Open-Meteo](https://open-meteo.com) | Weather data API | [open-meteo.com/en/terms](https://open-meteo.com/en/terms) |

Open-Meteo is a fully open-source, non-commercial service. It does not require an account and does not track users.

Daylight has no analytics, advertising, or crash-reporting integrations.

---

## 5. Your choices

- **Grant location access:** Bloom fetches real weather conditions for your area and updates the UI accordingly.
- **Deny location access:** Bloom continues to function normally. The weather state defaults to "clear" and no location data is ever sent anywhere.

You can change your location permission at any time in **System Settings → Privacy & Security → Location Services → Daylight**.

---

## 6. Children's privacy

Daylight does not knowingly collect data from anyone, including children. No account creation or personal information is required to use the App.

---

## 7. Changes to this policy

If this policy changes materially, the "Last updated" date at the top will be revised. Continued use of the App after changes are posted constitutes acceptance of the revised policy.

---

## 8. Contact

For privacy questions or concerns, open an issue on the project's GitHub repository or contact the author directly.

---

*Daylight is a personal project. Your privacy matters.*
