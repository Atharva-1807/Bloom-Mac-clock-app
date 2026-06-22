# Terms of Use — Daylight

**Last updated:** June 2026

---

## 1. Acceptance

By downloading, installing, or using Daylight ("the App"), you agree to these Terms of Use. If you do not agree, do not install or use the App.

---

## 2. License

The author grants you a **free, non-exclusive, non-transferable license** to:

- Install and use the App on any macOS device you own or control.
- Share unmodified copies of the App with others, provided this Terms of Use document accompanies the distribution.

You may **not**:

- Sell, sublicense, or commercially redistribute the App or any part of it without written permission.
- Reverse-engineer, decompile, or disassemble the App beyond what is permitted by applicable law.
- Remove or obscure any copyright, trademark, or attribution notices.
- Claim authorship or pass the App off as your own creation.

---

## 3. Open Source Components

The App is built on open-source software. Their respective licenses apply:

| Component       | License    |
|-----------------|------------|
| Electron        | MIT        |
| React           | MIT        |
| Vite            | MIT        |
| electron-vite   | MIT        |
| electron-builder| MIT        |
| Satoshi font    | SIL OFL 1.1 (Fontshare) |

---

## 4. No Warranty

The App is provided **"as is"**, without warranty of any kind — express or implied — including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.

The author does not warrant that:

- The App will be error-free or uninterrupted.
- Defects will be corrected.
- The App is free from harmful components.

---

## 5. Limitation of Liability

To the maximum extent permitted by law, the author is **not liable** for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the App — including but not limited to loss of data, loss of profits, or business interruption.

---

## 6. Privacy and Location Data

Daylight requests access to your device's location solely to fetch current local weather conditions from [Open-Meteo](https://open-meteo.com) — a free, open-source weather API. The following applies:

- **What is sent:** Your approximate GPS coordinates (latitude and longitude) are transmitted to `api.open-meteo.com` to retrieve a weather code for your location.
- **What is not collected:** Daylight does not collect, store, log, or share your location with any party other than Open-Meteo's public API.
- **Retention:** Coordinates are held in memory only for the duration of the weather fetch. They are never written to disk and are discarded when the App quits.
- **Your control:** You may deny the macOS location permission when prompted. If denied, Daylight continues to function normally using a default "clear" weather state, and no location data is ever sent.
- **Third-party privacy:** Open-Meteo's privacy policy applies to any data they receive. See [open-meteo.com](https://open-meteo.com).

For full details, see our [Privacy Policy](PRIVACY_POLICY.md).

---

## 7. Modifications

The author reserves the right to update these Terms of Use at any time. Continued use of the App after changes are posted constitutes acceptance of the revised terms.

---

## 8. Governing Law

These Terms are governed by the laws of India, without regard to conflict-of-law principles.

---

## 9. Contact

For questions, permissions, or bug reports, open an issue on the project's GitHub repository or contact the author directly.

---

*Daylight is a personal project crafted with care. Enjoy it.*
