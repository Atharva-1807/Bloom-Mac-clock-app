import SwiftUI
import WidgetKit

// MARK: - Pill subview (shared between sizes)

private struct BloomPill: View {
    let entry: BloomEntry
    let timeSize: CGFloat
    let metaSize: CGFloat
    let iconSize: CGFloat

    private var gradTop: Color {
        switch entry.state {
        case .sunrise, .sunset: return Color(red: 1.00, green: 0.792, blue: 0.263)
        case .day:              return Color(red: 0.263, green: 0.667, blue: 1.00)
        case .night:            return Color(red: 0.004, green: 0.071, blue: 0.137)
        }
    }
    private var gradBottom: Color {
        switch entry.state {
        case .sunrise, .sunset: return Color(red: 0.922, green: 0.612, blue: 0.208)
        case .day:              return Color(red: 0.306, green: 0.604, blue: 0.851)
        case .night:            return Color(red: 0.004, green: 0.071, blue: 0.137)
        }
    }
    private var celestialColor: Color {
        entry.state == .night
            ? .white.opacity(0.92)
            : Color(red: 1.0, green: 0.788, blue: 0.263)
    }

    // Format time as HH:mm (no AM/PM) to avoid clipping
    private var timeString: String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: entry.date)
    }
    private var dateString: String {
        let f = DateFormatter()
        f.dateFormat = "d MMM"
        return f.string(from: entry.date)
    }
    private var dayString: String {
        let f = DateFormatter()
        f.dateFormat = "EEEE"
        return f.string(from: entry.date)
    }

    var body: some View {
        ZStack {
            // Pill fill
            Capsule()
                .fill(LinearGradient(
                    colors: [gradTop, gradBottom],
                    startPoint: entry.state == .day ? .top : .bottom,
                    endPoint:   entry.state == .day ? .bottom : .top
                ))

            // Content
            HStack(spacing: 0) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(timeString)
                        .font(.system(size: timeSize, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                        .shadow(color: Color(white: 0.76).opacity(0.90), radius: 20, x: -10, y: -10)
                        .shadow(color: Color(white: 0.90).opacity(0.90), radius: 25, x:  10,  y:  10)

                    HStack(spacing: 3) {
                        Text(dateString)
                        Text("·")
                            .opacity(0.5)
                        Text(dayString)
                    }
                    .font(.system(size: metaSize, weight: .medium, design: .rounded))
                    .foregroundColor(.white.opacity(0.85))
                    .lineLimit(1)
                }

                Spacer(minLength: 8)

                Image(systemName: entry.state.celestialSymbol)
                    .resizable()
                    .scaledToFit()
                    .frame(width: iconSize, height: iconSize)
                    .foregroundStyle(celestialColor)
                    .shadow(
                        color: celestialColor.opacity(0.55),
                        radius: entry.state == .night ? 8 : 16
                    )
            }
            .padding(.horizontal, 18)

            // Inset border highlight
            Capsule()
                .strokeBorder(
                    LinearGradient(
                        colors: [.white.opacity(0.30), .black.opacity(0.20)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        }
        // Outer shadows
        .shadow(color: .white.opacity(0.38), radius: 6, x: 0,  y:  5)
        .shadow(color: .black.opacity(0.30), radius: 5, x: 0,  y: -4)
    }
}

// MARK: - Widget view

struct BloomWidgetView: View {
    let entry: BloomEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        Link(destination: URL(string: "bloom://open")!) {
            ZStack {
                // Dark desktop-like canvas outside the pill
                Color(red: 0.05, green: 0.05, blue: 0.07)

                switch family {
                case .systemSmall:
                    // Small: pill is wide, short — sits in centre of square frame
                    BloomPill(entry: entry, timeSize: 28, metaSize: 10, iconSize: 40)
                        .frame(height: 72)
                        .padding(.horizontal, 8)

                default:
                    // Medium: full-width pill with more breathing room
                    BloomPill(entry: entry, timeSize: 40, metaSize: 12, iconSize: 58)
                        .frame(height: 90)
                        .padding(.horizontal, 12)
                }
            }
        }
        .containerBackground(for: .widget) {
            Color(red: 0.05, green: 0.05, blue: 0.07)
        }
    }
}

// MARK: - Previews

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
    BloomEntry(date: .now, state: .sunrise)
    BloomEntry(date: .now, state: .sunset)
}
