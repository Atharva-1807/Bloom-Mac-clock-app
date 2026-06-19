import SwiftUI
import WidgetKit

struct BloomWidgetView: View {
    let entry: BloomEntry
    @Environment(\.widgetFamily) private var family

    // Exact gradient colours from Figma / Clock.css
    private var gradTop: Color {
        switch entry.state {
        case .sunrise, .sunset: return Color(red: 1.00, green: 0.792, blue: 0.263) // #FFCA43
        case .day:              return Color(red: 0.263, green: 0.667, blue: 1.00)  // #43AAFF
        case .night:            return Color(red: 0.004, green: 0.071, blue: 0.137) // #011223
        }
    }

    private var gradBottom: Color {
        switch entry.state {
        case .sunrise, .sunset: return Color(red: 0.922, green: 0.612, blue: 0.208) // #EB9C35
        case .day:              return Color(red: 0.306, green: 0.604, blue: 0.851) // #4E9AD9
        case .night:            return Color(red: 0.004, green: 0.071, blue: 0.137) // #011223
        }
    }

    private var celestialColor: Color {
        entry.state == .night
            ? Color.white.opacity(0.92)
            : Color(red: 1.0, green: 0.788, blue: 0.263) // golden
    }

    private var timeSize: CGFloat   { family == .systemSmall ? 30 : 42 }
    private var metaSize: CGFloat   { family == .systemSmall ? 11 : 13 }
    private var iconSize: CGFloat   { family == .systemSmall ? 44 : 62 }
    private var hPad: CGFloat       { family == .systemSmall ? 14 : 20 }

    var body: some View {
        Link(destination: URL(string: "bloom://open")!) {
            ZStack {
                // ── Dark canvas that shows outside the pill ───────────────
                Color(red: 0.06, green: 0.06, blue: 0.08)

                // ── The pill ──────────────────────────────────────────────
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [gradTop, gradBottom],
                            startPoint: entry.state == .day ? .top : .bottom,
                            endPoint:   entry.state == .day ? .bottom : .top
                        )
                    )
                    // outer drop shadow (bottom-right bright, top-left dark)
                    .shadow(color: Color.white.opacity(0.40), radius: 4, x: 0, y:  4)
                    .shadow(color: Color.black.opacity(0.30), radius: 4, x: 0, y: -3)
                    .padding(.horizontal, family == .systemSmall ? 6 : 10)
                    .padding(.vertical,   family == .systemSmall ? 8 : 12)

                // ── Content row inside the pill ───────────────────────────
                HStack(spacing: 0) {
                    // Time + date/day
                    VStack(alignment: .leading, spacing: 2) {
                        Text(entry.date, style: .time)
                            .font(.system(size: timeSize, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                            .shadow(color: Color(white: 0.76).opacity(0.90), radius: 20, x: -10, y: -10)
                            .shadow(color: Color(white: 0.90).opacity(0.90), radius: 25, x:  10,  y: 10)

                        HStack(spacing: 4) {
                            Text(entry.date.formatted(.dateTime.day().month(.abbreviated)))
                                .foregroundColor(.white.opacity(0.85))
                            Text("·")
                                .foregroundColor(.white.opacity(0.50))
                            Text(entry.date.formatted(.dateTime.weekday(.wide)))
                                .foregroundColor(.white.opacity(0.85))
                        }
                        .font(.system(size: metaSize, weight: .medium, design: .rounded))
                    }

                    Spacer()

                    // Celestial icon
                    Image(systemName: entry.state.celestialSymbol)
                        .resizable()
                        .scaledToFit()
                        .frame(width: iconSize, height: iconSize)
                        .foregroundStyle(celestialColor)
                        .shadow(
                            color: celestialColor.opacity(entry.state == .night ? 0.6 : 0.5),
                            radius: entry.state == .night ? 8 : 14
                        )
                }
                .padding(.horizontal, hPad + (family == .systemSmall ? 6 : 10))
                .padding(.vertical,   family == .systemSmall ? 8 : 12)

                // ── Inset highlight on the pill edge ─────────────────────
                Capsule()
                    .strokeBorder(
                        LinearGradient(
                            colors: [Color.white.opacity(0.28), Color.black.opacity(0.18)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
                    .padding(.horizontal, family == .systemSmall ? 6 : 10)
                    .padding(.vertical,   family == .systemSmall ? 8 : 12)
            }
        }
        .containerBackground(for: .widget) {
            Color(red: 0.06, green: 0.06, blue: 0.08)
        }
    }
}

#Preview(as: .systemSmall) {
    BloomWidget()
} timeline: {
    BloomEntry(date: .now, state: .day)
    BloomEntry(date: .now, state: .night)
    BloomEntry(date: .now, state: .sunrise)
    BloomEntry(date: .now, state: .sunset)
}

#Preview(as: .systemMedium) {
    BloomWidget()
} timeline: {
    BloomEntry(date: .now, state: .day)
    BloomEntry(date: .now, state: .night)
}
